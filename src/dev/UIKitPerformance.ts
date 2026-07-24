export const INTERACTION_SAMPLE_COUNT = 20;
export const SCROLL_SEGMENT_COUNT = 20;
export const INTERACTION_BUDGET_MS = 100;
export const LONG_TASK_THRESHOLD_MS = 100;
export const REQUIRED_PASS_RATE = 0.95;

export interface InteractionSample {
  index: number;
  startedAt: number;
  paintedAt: number;
  durationMs: number;
  withinBudget: boolean;
}

export interface InteractionPerformanceEvidence {
  warmupCount: number;
  sampleCount: number;
  samples: InteractionSample[];
  withinBudgetCount: number;
  withinBudgetRate: number;
  percentile95DurationMs: number;
  meetsBudget: boolean;
}

export interface InteractionPerformanceOptions {
  action: () => void;
  warmupCount?: number;
  sampleCount?: number;
  now?: () => number;
  nextPaint?: () => Promise<number>;
}

export interface LongTaskEntry {
  startTime: number;
  duration: number;
}

export type LongTaskObserver = (
  onEntry: (entry: LongTaskEntry) => void,
) => (() => void) | null;

export interface ScrollSegmentEvidence {
  index: number;
  targetScrollTop: number;
  startedAt: number;
  paintedAt: number;
  durationMs: number;
  longTaskCount: number;
  maximumLongTaskDurationMs: number;
  passes: boolean;
}

export interface ScrollPerformanceEvidence {
  segmentCount: number;
  longTaskSupported: boolean;
  longTaskThresholdMs: number;
  segments: ScrollSegmentEvidence[];
  cleanSegmentCount: number;
  meetsBudget: boolean;
}

export interface ScrollPerformanceOptions {
  scrollElement: Pick<
    HTMLElement,
    "clientHeight" | "scrollHeight" | "scrollTop"
  >;
  now?: () => number;
  nextPaint?: () => Promise<number>;
  observeLongTasks?: LongTaskObserver;
  onScrollSegment?: (
    segmentIndex: number,
    targetScrollTop: number,
  ) => void | Promise<void>;
}

export interface HeapSnapshot {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

export type HeapEvidence =
  | { supported: false }
  | ({ supported: true } & HeapSnapshot);

export interface DomHeapEvidence {
  domNodeCount: number;
  benchmarkRowCount: number;
  primaryScrollContainerCount: number;
  nestedScrollContainerCount: number;
  heap: HeapEvidence;
}

export interface DomHeapEvidenceOptions {
  root: Element;
  primaryScrollContainer?: Element | null;
  readHeap?: () => HeapSnapshot | null;
}

const defaultNow = (): number => {
  if (typeof performance !== "undefined") {
    return performance.now();
  }

  return Date.now();
};

export const waitForNextPaint = (
  now: () => number = defaultNow,
): Promise<number> => {
  if (typeof requestAnimationFrame !== "function") {
    return Promise.resolve().then(now);
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame((paintedAt) => resolve(paintedAt));
    });
  });
};

const percentile = (values: number[], target: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const targetIndex = Math.max(
    0,
    Math.min(sortedValues.length - 1, Math.ceil(target * values.length) - 1),
  );

  return sortedValues[targetIndex];
};

export const collectInteractionPerformance = async ({
  action,
  warmupCount = 1,
  sampleCount = INTERACTION_SAMPLE_COUNT,
  now = defaultNow,
  nextPaint = waitForNextPaint,
}: InteractionPerformanceOptions): Promise<InteractionPerformanceEvidence> => {
  if (
    !Number.isInteger(sampleCount) ||
    sampleCount < INTERACTION_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `Interaction collection requires at least ${INTERACTION_SAMPLE_COUNT} samples.`,
    );
  }

  if (!Number.isInteger(warmupCount) || warmupCount < 1) {
    throw new RangeError("Interaction collection requires at least one warm-up.");
  }

  for (let index = 0; index < warmupCount; index += 1) {
    action();
    await nextPaint();
  }

  const samples: InteractionSample[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const startedAt = now();
    action();
    const paintedAt = await nextPaint();
    const durationMs = Math.max(0, paintedAt - startedAt);

    samples.push({
      index,
      startedAt,
      paintedAt,
      durationMs,
      withinBudget: durationMs <= INTERACTION_BUDGET_MS,
    });
  }

  const withinBudgetCount = samples.filter(
    (sample) => sample.withinBudget,
  ).length;
  const withinBudgetRate = withinBudgetCount / samples.length;

  return {
    warmupCount,
    sampleCount,
    samples,
    withinBudgetCount,
    withinBudgetRate,
    percentile95DurationMs: percentile(
      samples.map((sample) => sample.durationMs),
      REQUIRED_PASS_RATE,
    ),
    meetsBudget: withinBudgetRate >= REQUIRED_PASS_RATE,
  };
};

const observeBrowserLongTasks: LongTaskObserver = (onEntry) => {
  if (
    typeof PerformanceObserver === "undefined" ||
    !PerformanceObserver.supportedEntryTypes.includes("longtask")
  ) {
    return null;
  }

  const observer = new PerformanceObserver((entryList) => {
    entryList.getEntries().forEach((entry) => {
      onEntry({
        startTime: entry.startTime,
        duration: entry.duration,
      });
    });
  });

  observer.observe({ entryTypes: ["longtask"] });

  return () => observer.disconnect();
};

export const collectScrollPerformance = async ({
  scrollElement,
  now = defaultNow,
  nextPaint = waitForNextPaint,
  observeLongTasks = observeBrowserLongTasks,
  onScrollSegment,
}: ScrollPerformanceOptions): Promise<ScrollPerformanceEvidence> => {
  const longTasks: LongTaskEntry[] = [];
  const disconnect = observeLongTasks((entry) => {
    if (
      Number.isFinite(entry.startTime) &&
      Number.isFinite(entry.duration) &&
      entry.duration >= 0
    ) {
      longTasks.push(entry);
    }
  });
  const longTaskSupported = disconnect !== null;
  const segmentWindows: Array<{
    index: number;
    targetScrollTop: number;
    startedAt: number;
    paintedAt: number;
  }> = [];
  const maximumScrollTop = Math.max(
    0,
    scrollElement.scrollHeight - scrollElement.clientHeight,
  );

  try {
    for (let index = 0; index < SCROLL_SEGMENT_COUNT; index += 1) {
      const startedAt = now();
      const targetScrollTop =
        maximumScrollTop * ((index + 1) / SCROLL_SEGMENT_COUNT);

      scrollElement.scrollTop = targetScrollTop;
      await onScrollSegment?.(index, targetScrollTop);
      const paintedAt = await nextPaint();

      segmentWindows.push({
        index,
        targetScrollTop,
        startedAt,
        paintedAt,
      });
    }

    await Promise.resolve();
  } finally {
    disconnect?.();
  }

  const segments = segmentWindows.map((segment) => {
    const matchingLongTasks = longTasks.filter(
      (entry) =>
        entry.startTime >= segment.startedAt &&
        entry.startTime < segment.paintedAt,
    );
    const maximumLongTaskDurationMs = Math.max(
      0,
      ...matchingLongTasks.map((entry) => entry.duration),
    );

    return {
      ...segment,
      durationMs: Math.max(0, segment.paintedAt - segment.startedAt),
      longTaskCount: matchingLongTasks.length,
      maximumLongTaskDurationMs,
      passes: maximumLongTaskDurationMs <= LONG_TASK_THRESHOLD_MS,
    };
  });
  const cleanSegmentCount = segments.filter((segment) => segment.passes).length;

  return {
    segmentCount: SCROLL_SEGMENT_COUNT,
    longTaskSupported,
    longTaskThresholdMs: LONG_TASK_THRESHOLD_MS,
    segments,
    cleanSegmentCount,
    meetsBudget:
      longTaskSupported &&
      cleanSegmentCount >= SCROLL_SEGMENT_COUNT * REQUIRED_PASS_RATE,
  };
};

const readBrowserHeap = (): HeapSnapshot | null => {
  if (typeof performance === "undefined") {
    return null;
  }

  const memory = (
    performance as Performance & {
      memory?: HeapSnapshot;
    }
  ).memory;

  if (
    !memory ||
    !Number.isFinite(memory.jsHeapSizeLimit) ||
    !Number.isFinite(memory.totalJSHeapSize) ||
    !Number.isFinite(memory.usedJSHeapSize)
  ) {
    return null;
  }

  return {
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    totalJSHeapSize: memory.totalJSHeapSize,
    usedJSHeapSize: memory.usedJSHeapSize,
  };
};

const ownsVerticalScroll = (element: Element): boolean => {
  if (
    element.hasAttribute("data-primary-scroll-container") ||
    element.getAttribute("data-scroll-container") === "true"
  ) {
    return true;
  }

  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const overflowY =
    typeof getComputedStyle === "function"
      ? getComputedStyle(element).overflowY
      : element.style.overflowY;

  return overflowY === "auto" || overflowY === "scroll";
};

export const collectDomHeapEvidence = ({
  root,
  primaryScrollContainer = null,
  readHeap = readBrowserHeap,
}: DomHeapEvidenceOptions): DomHeapEvidence => {
  const descendants = Array.from(root.querySelectorAll("*"));
  const nestedScrollContainerCount = descendants.filter(
    (element) =>
      element !== primaryScrollContainer && ownsVerticalScroll(element),
  ).length;
  const heapSnapshot = readHeap();

  return {
    domNodeCount: descendants.length,
    benchmarkRowCount: root.querySelectorAll("[data-benchmark-row]").length,
    primaryScrollContainerCount: primaryScrollContainer ? 1 : 0,
    nestedScrollContainerCount,
    heap: heapSnapshot
      ? {
          supported: true,
          ...heapSnapshot,
        }
      : { supported: false },
  };
};
