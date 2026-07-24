import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppSkeleton } from "./AppSkeleton";

const shapes = ["text", "rectangle", "circle"] as const;
const sizes = ["sm", "md", "lg"] as const;

describe("AppSkeleton", () => {
  it("is hidden from assistive technology while its parent owns busy state", () => {
    const { container } = render(
      <section aria-busy="true">
        <AppSkeleton />
      </section>,
    );
    const region = container.querySelector("section");
    const skeleton = region?.firstElementChild;

    expect(region).toHaveAttribute("aria-busy", "true");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });

  it("renders every shape and size as a distinct deterministic variant", () => {
    const signatures = new Set<string>();

    for (const shape of shapes) {
      for (const size of sizes) {
        const view = render(<AppSkeleton shape={shape} size={size} />);
        const skeleton = view.container.firstElementChild;

        expect(skeleton).toHaveAttribute("aria-hidden", "true");
        signatures.add(skeleton?.outerHTML ?? "");
        view.unmount();
      }
    }

    expect(signatures).toHaveLength(shapes.length * sizes.length);
  });

  it("renders a deterministic number of text lines without random widths", () => {
    const first = render(<AppSkeleton shape="text" lines={4} size="md" />);
    const firstMarkup = first.container.innerHTML;
    const firstRoot = first.container.firstElementChild;

    expect(firstRoot?.children).toHaveLength(4);
    first.unmount();

    const second = render(<AppSkeleton shape="text" lines={4} size="md" />);
    expect(second.container.firstElementChild?.children).toHaveLength(4);
    expect(second.container.innerHTML).toBe(firstMarkup);
  });

  it("declares a reduced-motion branch that removes shimmer animation", () => {
    const { container } = render(<AppSkeleton />);
    const skeleton = container.firstElementChild;

    expect(skeleton?.className).toMatch(
      /motion-reduce:(?:animate-none|\[animation:none\])/,
    );
  });
});
