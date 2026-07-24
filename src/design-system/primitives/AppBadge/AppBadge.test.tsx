import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppBadge } from "./AppBadge";

const tones = ["neutral", "info", "success", "warning", "danger"] as const;
const sizes = ["sm", "md"] as const;

describe("AppBadge", () => {
  it.each(tones)("renders the %s semantic tone without hiding its status copy", (tone) => {
    render(<AppBadge tone={tone}>Trạng thái {tone}</AppBadge>);

    const badge = screen.getByText(`Trạng thái ${tone}`);
    expect(badge).toBeVisible();
    expect(badge).not.toHaveAttribute("aria-hidden", "true");
  });

  it.each(sizes)("renders the %s public size", (size) => {
    render(
      <AppBadge tone="neutral" size={size}>
        Kích thước {size}
      </AppBadge>,
    );

    expect(screen.getByText(`Kích thước ${size}`)).toBeVisible();
  });

  it("preserves meaningful long Vietnamese status text", () => {
    const longStatus =
      "Đang chờ xác nhận thanh toán từ nhà cung cấp trong kỳ đối soát tháng này";

    render(<AppBadge tone="warning">{longStatus}</AppBadge>);

    expect(screen.getByText(longStatus)).toHaveTextContent(longStatus);
  });

  it("preserves large numeric content without replacing its meaning", () => {
    render(<AppBadge tone="info">9.999.999.999 ₫</AppBadge>);

    expect(screen.getByText("9.999.999.999 ₫")).toBeVisible();
  });

  it("communicates status through caller-provided text rather than color alone", () => {
    render(<AppBadge tone="danger">Cần xử lý ngay</AppBadge>);

    const status = screen.getByText("Cần xử lý ngay");
    expect(status).toHaveTextContent("Cần xử lý ngay");
    expect(status).not.toBeEmptyDOMElement();
  });
});
