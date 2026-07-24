import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { AppIcon } from "./AppIcon";

const sizes = ["sm", "md", "lg"] as const;
const tones = [
  "primary",
  "secondary",
  "inverse",
  "danger",
  "success",
] as const;

const appIconTypeContract = () => {
  // @ts-expect-error meaningful icons require a label
  <AppIcon icon={Search} decorative={false} />;
  // @ts-expect-error decorative icons must not expose a label
  <AppIcon icon={Search} decorative label="Duplicate meaning" />;
  // @ts-expect-error raw visual style overrides are forbidden
  <AppIcon icon={Search} style={{ color: "#ff0000" }} />;
  // @ts-expect-error unsupported raw tone is rejected
  <AppIcon icon={Search} tone="#ff0000" />;
};
void appIconTypeContract;

describe("AppIcon", () => {
  it("is decorative and hidden from assistive technology by default", () => {
    const { container } = render(<AppIcon icon={Search} />);
    const icon = container.querySelector("svg");

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("aria-label");
  });

  it("exposes a meaningful icon with a non-empty accessible label", () => {
    render(
      <AppIcon
        icon={Search}
        decorative={false}
        label="Tìm kiếm sản phẩm"
      />,
    );

    expect(
      screen.getByRole("img", { name: "Tìm kiếm sản phẩm" }),
    ).toBeInTheDocument();
  });

  it("rejects an empty meaningful label", () => {
    expect(() =>
      render(<AppIcon icon={Search} decorative={false} label="" />),
    ).toThrow(/label/i);
  });

  it("supports every semantic size and tone combination", () => {
    const classNames = new Set<string>();

    for (const size of sizes) {
      for (const tone of tones) {
        const label = `${size}-${tone}`;
        const { unmount } = render(
          <AppIcon
            icon={Search}
            decorative={false}
            label={label}
            size={size}
            tone={tone}
          />,
        );
        const icon = screen.getByRole("img", { name: label });
        expect(icon.getAttribute("class")).toContain("ds-");
        classNames.add(icon.getAttribute("class") ?? "");
        unmount();
      }
    }

    expect(classNames.size).toBe(sizes.length * tones.length);
  });

  it("forwards an SVG ref without wrapper or React ref warnings", () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(<AppIcon ref={ref} icon={Search} />);

    expect(ref.current).toBe(container.querySelector("svg"));
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it("retains composition-only className", () => {
    const { container } = render(
      <AppIcon icon={Search} className="shrink-0" />,
    );
    expect(container.querySelector("svg")).toHaveClass("shrink-0");
  });
});
