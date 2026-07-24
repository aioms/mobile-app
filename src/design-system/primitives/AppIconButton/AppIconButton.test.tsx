import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Search } from "lucide-react";
import { vi } from "vitest";
import { AppIconButton } from "./AppIconButton";

const tones = ["primary", "neutral", "danger"] as const;
const variants = ["solid", "outline", "ghost"] as const;
const sizes = ["sm", "md", "lg"] as const;

const appIconButtonTypeContract = () => {
  // @ts-expect-error accessible label is required
  <AppIconButton icon={Search} />;
  // @ts-expect-error icon buttons do not accept children
  <AppIconButton icon={Search} label="Tìm kiếm">Forbidden child</AppIconButton>;
  // @ts-expect-error raw visual style overrides are forbidden
  <AppIconButton icon={Search} label="Tìm kiếm" style={{ color: "#ff0000" }} />;
  // @ts-expect-error native raw color is intentionally omitted
  <AppIconButton icon={Search} label="Tìm kiếm" color="#ff0000" />;
};
void appIconButtonTypeContract;

describe("AppIconButton", () => {
  it("uses its required label as the accessible name", () => {
    const { container } = render(
      <AppIconButton icon={Search} label="Tìm kiếm sản phẩm" />,
    );

    expect(
      screen.getByRole("button", { name: "Tìm kiếm sản phẩm" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("rejects an empty accessible label", () => {
    expect(() =>
      render(<AppIconButton icon={Search} label="" />),
    ).toThrow(/label/i);
  });

  it("supports every tone, variant, and size combination", () => {
    const classNames = new Set<string>();

    for (const tone of tones) {
      for (const variant of variants) {
        for (const size of sizes) {
          const label = `${tone}-${variant}-${size}`;
          const { unmount } = render(
            <AppIconButton
              icon={Search}
              label={label}
              tone={tone}
              variant={variant}
              size={size}
            />,
          );
          const button = screen.getByRole("button", { name: label });
          expect(button.className).toContain("ds-");
          classNames.add(button.className);
          unmount();
        }
      }
    }

    expect(classNames.size).toBe(
      tones.length * variants.length * sizes.length,
    );
  });

  it("forwards native attributes, click events, and button refs", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();

    render(
      <AppIconButton
        ref={ref}
        icon={Search}
        label="Mở tìm kiếm"
        type="button"
        data-testid="search-trigger"
        onClick={onClick}
      />,
    );
    const button = screen.getByTestId("search-trigger");

    fireEvent.click(button);

    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("retains its accessible name and busy state while loading", () => {
    render(
      <AppIconButton
        icon={Search}
        label="Tìm kiếm sản phẩm"
        loading
      />,
    );
    const button = screen.getByRole("button", {
      name: "Tìm kiếm sản phẩm",
    });

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });

  it.each([
    ["disabled", { disabled: true }],
    ["loading", { loading: true }],
  ] as const)("blocks repeated actions while %s", async (_state, props) => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <AppIconButton
        {...props}
        icon={Search}
        label="Tìm kiếm"
        onClick={onClick}
      />,
    );
    const button = screen.getByRole("button", { name: "Tìm kiếm" });

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
