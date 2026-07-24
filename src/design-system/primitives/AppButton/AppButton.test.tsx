import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChevronRight, Search } from "lucide-react";
import { vi } from "vitest";
import { AppButton } from "./AppButton";

const tones = ["primary", "neutral", "danger"] as const;
const variants = ["solid", "outline", "ghost"] as const;
const sizes = ["sm", "md", "lg"] as const;

const appButtonTypeContract = () => {
  // @ts-expect-error raw visual style overrides are forbidden
  <AppButton style={{ background: "#ff0000" }}>Forbidden style</AppButton>;
  // @ts-expect-error native raw color is intentionally omitted
  <AppButton color="#ff0000">Forbidden color</AppButton>;
  // @ts-expect-error unsupported visual variants are rejected
  <AppButton variant="gradient">Forbidden variant</AppButton>;
};
void appButtonTypeContract;

describe("AppButton", () => {
  it("defaults to the same contract as primary/solid/md", () => {
    const { unmount } = render(<AppButton>Default action</AppButton>);
    const defaultClassName = screen.getByRole("button", {
      name: "Default action",
    }).className;
    unmount();

    render(
      <AppButton tone="primary" variant="solid" size="md">
        Explicit action
      </AppButton>,
    );
    const explicitButton = screen.getByRole("button", {
      name: "Explicit action",
    });

    expect(explicitButton).toHaveClass(defaultClassName);
    expect(explicitButton.className).toContain("ds-");
  });

  it("supports every tone, variant, and size combination", () => {
    const classNames = new Set<string>();

    for (const tone of tones) {
      for (const variant of variants) {
        for (const size of sizes) {
          const label = `${tone}-${variant}-${size}`;
          const { unmount } = render(
            <AppButton tone={tone} variant={variant} size={size}>
              {label}
            </AppButton>,
          );
          const button = screen.getByRole("button", { name: label });
          expect(button).toBeEnabled();
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

  it("renders leading and trailing icon slots without changing its name", () => {
    const { container } = render(
      <AppButton leadingIcon={Search} trailingIcon={ChevronRight}>
        Xem đơn hàng
      </AppButton>,
    );

    expect(
      screen.getByRole("button", { name: "Xem đơn hàng" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("forwards native attributes, click events, and button refs", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();

    render(
      <AppButton
        ref={ref}
        type="submit"
        data-testid="save-order"
        onClick={onClick}
      >
        Lưu đơn
      </AppButton>,
    );
    const button = screen.getByTestId("save-order");

    fireEvent.click(button);

    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "submit");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps stable accessible content while loading", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <AppButton onClick={onClick}>Thanh toán</AppButton>,
    );
    const originalName = screen.getByRole("button", {
      name: "Thanh toán",
    }).textContent;

    rerender(
      <AppButton loading onClick={onClick}>
        Thanh toán
      </AppButton>,
    );
    const loadingButton = screen.getByRole("button", {
      name: "Thanh toán",
    });

    expect(loadingButton).toHaveAttribute("aria-busy", "true");
    expect(loadingButton).toBeDisabled();
    expect(loadingButton.textContent).toBe(originalName);
  });

  it.each([
    ["disabled", { disabled: true }],
    ["loading", { loading: true }],
  ] as const)("blocks repeated actions while %s", async (_state, props) => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <AppButton {...props} onClick={onClick}>
        Gửi yêu cầu
      </AppButton>,
    );
    const button = screen.getByRole("button", { name: "Gửi yêu cầu" });

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
