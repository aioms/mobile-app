import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppDivider } from "./AppDivider";

const orientations = ["horizontal", "vertical"] as const;
const tones = ["default", "strong"] as const;

describe("AppDivider", () => {
  it.each(orientations)("exposes %s orientation for a meaningful separator", (orientation) => {
    render(<AppDivider decorative={false} orientation={orientation} />);

    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      orientation,
    );
  });

  it.each(tones)("renders the %s semantic tone", (tone) => {
    render(<AppDivider decorative={false} tone={tone} />);

    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("hides an explicitly decorative divider from assistive technology", () => {
    const { container } = render(<AppDivider decorative />);
    const divider = container.firstElementChild;

    expect(divider).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("leaves vertical height ownership with its parent", () => {
    const { container } = render(
      <div data-testid="divider-parent" style={{ height: "128px" }}>
        <AppDivider decorative={false} orientation="vertical" />
      </div>,
    );
    const parent = screen.getByTestId("divider-parent");
    const divider = parent.firstElementChild;

    expect(parent).toHaveStyle({ height: "128px" });
    expect(divider).not.toHaveAttribute("style");
    expect(container.querySelector('[aria-orientation="vertical"]')).toBe(
      divider,
    );
  });
});
