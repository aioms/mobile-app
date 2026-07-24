import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AppCard } from "./AppCard";

const surfaces = ["default", "subtle"] as const;
const elevations = ["none", "raised"] as const;
const paddings = ["none", "sm", "md", "lg"] as const;

const appCardTypeContract = () => {
  // @ts-expect-error raw visual style overrides are forbidden
  <AppCard style={{ boxShadow: "0 0 20px #000" }}>Forbidden style</AppCard>;
  // @ts-expect-error native raw color is intentionally omitted
  <AppCard color="#ff0000">Forbidden color</AppCard>;
  // @ts-expect-error unsupported elevation is rejected
  <AppCard elevation="floating">Forbidden elevation</AppCard>;
};
void appCardTypeContract;

describe("AppCard", () => {
  it("renders a non-interactive div by default", () => {
    render(<AppCard>Summary</AppCard>);
    const card = screen.getByText("Summary");

    expect(card.tagName).toBe("DIV");
    expect(card).not.toHaveAttribute("role", "button");
    expect(card).not.toHaveAttribute("tabindex");
    expect(card.className).toContain("ds-");
  });

  it("supports every surface, elevation, and padding combination", () => {
    const classNames = new Set<string>();

    for (const surface of surfaces) {
      for (const elevation of elevations) {
        for (const padding of paddings) {
          const label = `${surface}-${elevation}-${padding}`;
          const { unmount } = render(
            <AppCard
              surface={surface}
              elevation={elevation}
              padding={padding}
            >
              {label}
            </AppCard>,
          );
          const card = screen.getByText(label);
          expect(card.className).toContain("ds-");
          expect(card.className).not.toMatch(
            /\boverflow-(?:auto|scroll|y-auto|y-scroll)\b/,
          );
          classNames.add(card.className);
          unmount();
        }
      }
    }

    expect(classNames.size).toBe(
      surfaces.length * elevations.length * paddings.length,
    );
  });

  it("provides button semantics and keyboard activation when interactive", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <AppCard
        interactive
        aria-label="Mở chi tiết khách hàng"
        onClick={onClick}
      >
        Nguyễn Văn An
      </AppCard>,
    );
    const card = screen.getByRole("button", {
      name: "Mở chi tiết khách hàng",
    });

    expect(card).toHaveAttribute("tabindex", "0");

    card.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("forwards native pointer activation exactly once", () => {
    const onClick = vi.fn();
    render(
      <AppCard interactive aria-label="Mở tổng quan" onClick={onClick}>
        Tổng quan
      </AppCard>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở tổng quan" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("never owns a vertical scroll container", () => {
    render(
      <AppCard surface="subtle" elevation="raised" padding="lg">
        Nội dung dài
      </AppCard>,
    );
    const card = screen.getByText("Nội dung dài");

    expect(card.className).not.toMatch(
      /\boverflow-(?:auto|scroll|y-auto|y-scroll)\b/,
    );
    expect(card).not.toHaveStyle({ overflowY: "auto" });
    expect(card).not.toHaveStyle({ overflowY: "scroll" });
  });
});
