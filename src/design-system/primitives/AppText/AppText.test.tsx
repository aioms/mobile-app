import { render, screen } from "@testing-library/react";
import { AppText } from "./AppText";

const variants = [
  "display",
  "title",
  "heading",
  "body",
  "label",
  "caption",
] as const;

const tones = [
  "primary",
  "secondary",
  "disabled",
  "inverse",
  "danger",
  "success",
] as const;

const elements = ["span", "p", "div", "label", "h1", "h2", "h3", "h4"] as const;

const appTextTypeContract = () => {
  // @ts-expect-error visual style overrides are not public API
  <AppText style={{ color: "#ff0000" }}>Forbidden style</AppText>;
  // @ts-expect-error raw color props are not public API
  <AppText color="#ff0000">Forbidden color</AppText>;
  // @ts-expect-error unsupported semantic variants are rejected
  <AppText variant="hero">Forbidden variant</AppText>;
};
void appTextTypeContract;

describe("AppText", () => {
  it("defaults to a primary body span", () => {
    const { unmount } = render(<AppText>Default copy</AppText>);
    const defaultText = screen.getByText("Default copy");
    const defaultClassName = defaultText.className;

    expect(defaultText.tagName).toBe("SPAN");
    expect(defaultClassName).toContain("ds-");

    unmount();
    render(
      <AppText as="span" variant="body" tone="primary">
        Explicit defaults
      </AppText>,
    );

    expect(screen.getByText("Explicit defaults")).toHaveClass(defaultClassName);
  });

  it.each(elements)("renders the requested semantic <%s> element", (as) => {
    render(<AppText as={as}>Semantic copy</AppText>);
    expect(screen.getByText("Semantic copy").tagName).toBe(as.toUpperCase());
  });

  it("maps every visual variant to a distinct semantic class contract", () => {
    const classes = variants.map((variant) => {
      const { unmount } = render(
        <AppText variant={variant}>{variant}</AppText>,
      );
      const className = screen.getByText(variant).className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(variants.length);
    expect(classes.every((className) => className.includes("ds-"))).toBe(true);
  });

  it("maps every tone to a distinct semantic class contract", () => {
    const classes = tones.map((tone) => {
      const { unmount } = render(<AppText tone={tone}>{tone}</AppText>);
      const className = screen.getByText(tone).className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(tones.length);
    expect(classes.every((className) => className.includes("ds-"))).toBe(true);
  });

  it("preserves critical full text when visually truncated", () => {
    const content =
      "Đơn hàng doanh nghiệp có tên rất dài cần giữ nguyên cho công nghệ hỗ trợ";
    render(<AppText truncate>{content}</AppText>);

    const text = screen.getByText(content);
    expect(text).toHaveTextContent(content);
    expect(
      text.getAttribute("aria-label") ?? text.getAttribute("title"),
    ).toBe(content);
  });

  it("retains composition-only className without losing DS classes", () => {
    render(<AppText className="col-span-2">Composed copy</AppText>);
    const text = screen.getByText("Composed copy");

    expect(text).toHaveClass("col-span-2");
    expect(text.className).toContain("ds-");
  });
});
