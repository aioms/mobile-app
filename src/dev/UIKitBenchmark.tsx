import React from "react";

import { benchmarkRows } from "./UIKitFixtures";

export const BENCHMARK_ROW_COUNT = 200;
export const SMALL_LIST_ROW_COUNT = 12;

export type BenchmarkRow = (typeof benchmarkRows)[number];

export const createBenchmarkRows = (
  count = BENCHMARK_ROW_COUNT,
): BenchmarkRow[] => {
  if (!Number.isInteger(count) || count < 0 || count > BENCHMARK_ROW_COUNT) {
    throw new RangeError(
      `Benchmark row count must be an integer from 0 to ${BENCHMARK_ROW_COUNT}.`,
    );
  }

  return benchmarkRows.slice(0, count);
};

export interface UIKitBenchmarkProps {
  mode?: "reference" | "small";
}

export const UIKitBenchmark: React.FC<UIKitBenchmarkProps> = ({
  mode = "reference",
}) => {
  const rowCount =
    mode === "small" ? SMALL_LIST_ROW_COUNT : BENCHMARK_ROW_COUNT;
  const rows = createBenchmarkRows(rowCount);
  const titleId = `ui-kit-benchmark-${mode}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="space-y-ds-3"
      data-testid="ui-kit-benchmark"
      data-row-count={rowCount}
      data-scroll-owner="ionic-content"
      data-virtualized="false"
    >
      <header className="flex items-end justify-between gap-ds-3">
        <div className="space-y-ds-1">
          <h3
            id={titleId}
            className="text-ds-heading font-ds-semibold leading-ds-heading text-ds-text-primary"
          >
            {mode === "small"
              ? "Small-list control"
              : "200-row reference list"}
          </h3>
          <p className="text-ds-caption leading-ds-caption text-ds-text-secondary">
            Toàn bộ {rowCount} dòng được render; Ionic Content sở hữu cuộn.
          </p>
        </div>
        <output
          aria-label="Số dòng benchmark"
          className="text-ds-label font-ds-semibold text-ds-text-secondary"
        >
          {rowCount}
        </output>
      </header>

      <ul
        aria-label={
          mode === "small"
            ? "Danh sách kiểm soát nhỏ"
            : "Danh sách tham chiếu 200 dòng"
        }
        className="divide-y divide-ds-border-muted rounded-ds-card border border-ds-border-default bg-ds-surface-default"
      >
        {rows.map((row) => (
          <li
            key={row.id}
            className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-ds-3 px-ds-4 py-ds-3"
            data-benchmark-row
            data-row-id={row.id}
          >
            <div className="min-w-0">
              <p className="truncate text-ds-body font-ds-medium leading-ds-body text-ds-text-primary">
                {row.label}
              </p>
              <p className="text-ds-caption leading-ds-caption text-ds-text-secondary">
                {row.status}
              </p>
            </div>
            <span className="text-ds-label font-ds-semibold text-ds-text-primary">
              {row.displayValue}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
