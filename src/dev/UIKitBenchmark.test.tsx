import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import {
  BENCHMARK_ROW_COUNT,
  SMALL_LIST_ROW_COUNT,
  UIKitBenchmark,
  createBenchmarkRows,
} from "./UIKitBenchmark";
import {
  INTERACTION_SAMPLE_COUNT,
  SCROLL_SEGMENT_COUNT,
  collectDomHeapEvidence,
  collectInteractionPerformance,
  collectScrollPerformance,
} from "./UIKitPerformance";

describe("UIKitBenchmark", () => {
  it("creates the stable 200-row reference fixture deterministically", () => {
    const firstPass = createBenchmarkRows();
    const secondPass = createBenchmarkRows();

    expect(BENCHMARK_ROW_COUNT).toBe(200);
    expect(firstPass).toHaveLength(BENCHMARK_ROW_COUNT);
    expect(secondPass).toEqual(firstPass);
    expect(new Set(firstPass.map((row) => row.id))).toHaveLength(
      BENCHMARK_ROW_COUNT,
    );
    expect(firstPass[0]).toMatchObject({
      id: "ui-kit-row-001",
      label: "Nội dung tham chiếu 001",
    });
    expect(firstPass.at(-1)?.id).toBe("ui-kit-row-200");
  });

  it("renders all reference rows without nested scroll or virtualization", () => {
    render(
      <div
        data-testid="primary-scroll-container"
        data-primary-scroll-container
        style={{ overflowY: "auto" }}
      >
        <UIKitBenchmark />
      </div>,
    );

    const benchmark = screen.getByTestId("ui-kit-benchmark");

    expect(benchmark).toHaveAttribute("data-scroll-owner", "ionic-content");
    expect(benchmark).toHaveAttribute("data-virtualized", "false");
    expect(benchmark.querySelectorAll("[data-benchmark-row]")).toHaveLength(
      BENCHMARK_ROW_COUNT,
    );
    expect(
      benchmark.querySelectorAll(
        '[data-primary-scroll-container], [data-scroll-container="true"]',
      ),
    ).toHaveLength(0);
    expect(benchmark.className).not.toMatch(
      /\boverflow-(?:auto|scroll|y-auto|y-scroll)\b/,
    );
  });

  it("keeps the small-list control fully rendered by default", () => {
    render(<UIKitBenchmark mode="small" />);

    const benchmark = screen.getByTestId("ui-kit-benchmark");

    expect(benchmark).toHaveAttribute(
      "data-row-count",
      String(SMALL_LIST_ROW_COUNT),
    );
    expect(benchmark).toHaveAttribute("data-virtualized", "false");
    expect(benchmark.querySelectorAll("[data-benchmark-row]")).toHaveLength(
      SMALL_LIST_ROW_COUNT,
    );
    expect(
      benchmark.querySelectorAll(
        "[data-virtual-spacer], [data-virtual-window]",
      ),
    ).toHaveLength(0);
  });
});

describe("UIKitPerformance", () => {
  it("warms up before collecting at least 20 next-paint samples", async () => {
    let clock = 0;
    const action = vi.fn();

    const evidence = await collectInteractionPerformance({
      action,
      warmupCount: 2,
      sampleCount: INTERACTION_SAMPLE_COUNT,
      now: () => clock,
      nextPaint: async () => {
        clock += 40;
        return clock;
      },
    });

    expect(INTERACTION_SAMPLE_COUNT).toBe(20);
    expect(action).toHaveBeenCalledTimes(22);
    expect(evidence.warmupCount).toBe(2);
    expect(evidence.samples).toHaveLength(INTERACTION_SAMPLE_COUNT);
    expect(evidence.samples.every((sample) => sample.durationMs === 40)).toBe(
      true,
    );
    expect(evidence.withinBudgetRate).toBe(1);
    expect(evidence.meetsBudget).toBe(true);
  });

  it("rejects an interaction collection smaller than the quality gate", async () => {
    await expect(
      collectInteractionPerformance({
        action: vi.fn(),
        sampleCount: INTERACTION_SAMPLE_COUNT - 1,
      }),
    ).rejects.toThrow("at least 20");
  });

  it("collects Long Tasks across 20 deterministic scroll segments", async () => {
    const scrollElement = document.createElement("div");
    Object.defineProperties(scrollElement, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 2200 },
    });

    let clock = 0;
    let reportLongTask: (entry: {
      duration: number;
      startTime: number;
    }) => void = () => undefined;
    const disconnect = vi.fn();

    const evidence = await collectScrollPerformance({
      scrollElement,
      now: () => clock,
      nextPaint: async () => {
        clock += 10;
        return clock;
      },
      observeLongTasks: (onEntry) => {
        reportLongTask = onEntry;
        return disconnect;
      },
      onScrollSegment: (segmentIndex) => {
        if (segmentIndex === 7) {
          reportLongTask({ duration: 120, startTime: clock + 1 });
        }
      },
    });

    expect(SCROLL_SEGMENT_COUNT).toBe(20);
    expect(evidence.segments).toHaveLength(SCROLL_SEGMENT_COUNT);
    expect(evidence.longTaskSupported).toBe(true);
    expect(evidence.cleanSegmentCount).toBe(19);
    expect(evidence.meetsBudget).toBe(true);
    expect(evidence.segments[7]).toMatchObject({
      longTaskCount: 1,
      maximumLongTaskDurationMs: 120,
      passes: false,
    });
    expect(scrollElement.scrollTop).toBe(2000);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("records DOM, scroll ownership, row count, and heap metadata", () => {
    const { container } = render(
      <div
        data-testid="primary-scroll-container"
        data-primary-scroll-container
        style={{ overflowY: "auto" }}
      >
        <UIKitBenchmark />
      </div>,
    );
    const primaryScrollContainer = screen.getByTestId(
      "primary-scroll-container",
    );

    const evidence = collectDomHeapEvidence({
      root: container,
      primaryScrollContainer,
      readHeap: () => ({
        jsHeapSizeLimit: 4_000_000,
        totalJSHeapSize: 2_000_000,
        usedJSHeapSize: 1_000_000,
      }),
    });

    expect(evidence.domNodeCount).toBeGreaterThan(BENCHMARK_ROW_COUNT);
    expect(evidence.benchmarkRowCount).toBe(BENCHMARK_ROW_COUNT);
    expect(evidence.primaryScrollContainerCount).toBe(1);
    expect(evidence.nestedScrollContainerCount).toBe(0);
    expect(evidence.heap).toEqual({
      supported: true,
      jsHeapSizeLimit: 4_000_000,
      totalJSHeapSize: 2_000_000,
      usedJSHeapSize: 1_000_000,
    });
  });
});
