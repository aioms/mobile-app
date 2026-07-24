import type {
  AppBadgeProps,
  AppButtonProps,
  AppCardProps,
  AppDividerProps,
  AppIconButtonProps,
  AppIconProps,
  AppSearchFieldProps,
  AppSkeletonProps,
  AppTextFieldProps,
  AppTextProps,
} from "@/design-system";

type Present<T> = Exclude<T, null | undefined>;

export const UI_KIT_VIEWPORTS = [
  { id: "mobile-390", width: 390, height: 844 },
  { id: "mobile-393", width: 393, height: 852 },
  { id: "mobile-412", width: 412, height: 915 },
  { id: "tablet-768", width: 768, height: 1024 },
] as const;

export const foundationTokenFixtures = [
  {
    category: "color",
    tokens: [
      "--ds-color-brand-primary",
      "--ds-color-brand-primary-hover",
      "--ds-color-brand-primary-pressed",
      "--ds-color-brand-primary-soft",
      "--ds-color-brand-primary-rgb",
      "--ds-color-brand-focus",
      "--ds-color-action-primary",
      "--ds-color-action-primary-pressed",
      "--ds-color-action-neutral",
      "--ds-color-action-neutral-pressed",
      "--ds-color-background-page",
      "--ds-color-surface-default",
      "--ds-color-surface-subtle",
      "--ds-color-surface-disabled",
      "--ds-color-surface-overlay",
      "--ds-color-text-primary",
      "--ds-color-text-secondary",
      "--ds-color-text-disabled",
      "--ds-color-text-inverse",
      "--ds-color-text-inverse-rgb",
      "--ds-color-border-default",
      "--ds-color-border-muted",
      "--ds-color-border-strong",
      "--ds-color-border-focus",
      "--ds-color-status-info",
      "--ds-color-status-info-soft",
      "--ds-color-status-success",
      "--ds-color-status-success-soft",
      "--ds-color-status-warning",
      "--ds-color-status-warning-soft",
      "--ds-color-status-danger",
      "--ds-color-status-danger-pressed",
      "--ds-color-status-danger-soft",
      "--ds-color-status-neutral",
      "--ds-color-status-neutral-soft",
    ],
  },
  {
    category: "typography",
    tokens: [
      "--ds-font-family-sans",
      "--ds-font-size-display",
      "--ds-font-size-title",
      "--ds-font-size-heading",
      "--ds-font-size-body",
      "--ds-font-size-label",
      "--ds-font-size-caption",
      "--ds-font-size-input",
      "--ds-font-line-height-display",
      "--ds-font-line-height-title",
      "--ds-font-line-height-heading",
      "--ds-font-line-height-body",
      "--ds-font-line-height-label",
      "--ds-font-line-height-caption",
      "--ds-font-weight-regular",
      "--ds-font-weight-medium",
      "--ds-font-weight-semibold",
      "--ds-font-weight-bold",
      "--ds-font-ionic-dynamic",
    ],
  },
  {
    category: "spacing",
    tokens: [
      "--ds-space-0",
      "--ds-space-1",
      "--ds-space-2",
      "--ds-space-3",
      "--ds-space-4",
      "--ds-space-5",
      "--ds-space-6",
      "--ds-space-8",
      "--ds-space-10",
      "--ds-space-12",
    ],
  },
  {
    category: "radius",
    tokens: [
      "--ds-radius-none",
      "--ds-radius-sm",
      "--ds-radius-md",
      "--ds-radius-lg",
      "--ds-radius-xl",
      "--ds-radius-full",
    ],
  },
  {
    category: "elevation",
    tokens: [
      "--ds-border-width-thin",
      "--ds-border-style-default",
      "--ds-shadow-none",
      "--ds-shadow-card",
      "--ds-shadow-overlay",
    ],
  },
  {
    category: "motion",
    tokens: [
      "--ds-motion-duration-instant",
      "--ds-motion-duration-fast",
      "--ds-motion-duration-normal",
      "--ds-motion-duration-slow",
      "--ds-motion-easing-standard",
      "--ds-motion-easing-emphasized",
    ],
  },
  {
    category: "layout",
    tokens: [
      "--ds-layout-page-padding-inline",
      "--ds-layout-page-padding-block",
      "--ds-layout-content-max-width",
      "--ds-layout-control-min-size",
      "--ds-layout-control-height-md",
      "--ds-layout-control-height-lg",
      "--ds-layout-icon-size-sm",
      "--ds-layout-icon-size-md",
      "--ds-layout-icon-size-lg",
    ],
  },
  {
    category: "safe-area",
    tokens: [
      "--ds-safe-area-top",
      "--ds-safe-area-right",
      "--ds-safe-area-bottom",
      "--ds-safe-area-left",
    ],
  },
] as const;

const textVariants = [
  "display",
  "title",
  "heading",
  "body",
  "label",
  "caption",
] as const satisfies readonly Present<AppTextProps["variant"]>[];
const textTones = [
  "primary",
  "secondary",
  "disabled",
  "inverse",
  "danger",
  "success",
] as const satisfies readonly Present<AppTextProps["tone"]>[];
const iconSizes = [
  "sm",
  "md",
  "lg",
] as const satisfies readonly Present<AppIconProps["size"]>[];
const iconTones = [
  "primary",
  "secondary",
  "inverse",
  "danger",
  "success",
] as const satisfies readonly Present<AppIconProps["tone"]>[];
const buttonTones = [
  "primary",
  "neutral",
  "danger",
] as const satisfies readonly Present<AppButtonProps["tone"]>[];
const buttonVariants = [
  "solid",
  "outline",
  "ghost",
] as const satisfies readonly Present<AppButtonProps["variant"]>[];
const buttonSizes = [
  "sm",
  "md",
  "lg",
] as const satisfies readonly Present<AppButtonProps["size"]>[];
const iconButtonSizes = [
  "sm",
  "md",
  "lg",
] as const satisfies readonly Present<AppIconButtonProps["size"]>[];
const cardSurfaces = [
  "default",
  "subtle",
] as const satisfies readonly Present<AppCardProps["surface"]>[];
const cardElevations = [
  "none",
  "raised",
] as const satisfies readonly Present<AppCardProps["elevation"]>[];
const cardPaddings = [
  "none",
  "sm",
  "md",
  "lg",
] as const satisfies readonly Present<AppCardProps["padding"]>[];
const badgeTones = [
  "neutral",
  "info",
  "success",
  "warning",
  "danger",
] as const satisfies readonly AppBadgeProps["tone"][];
const badgeSizes = [
  "sm",
  "md",
] as const satisfies readonly Present<AppBadgeProps["size"]>[];
const dividerOrientations = [
  "horizontal",
  "vertical",
] as const satisfies readonly Present<AppDividerProps["orientation"]>[];
const dividerTones = [
  "default",
  "strong",
] as const satisfies readonly Present<AppDividerProps["tone"]>[];
const skeletonShapes = [
  "text",
  "rectangle",
  "circle",
] as const satisfies readonly Present<AppSkeletonProps["shape"]>[];
const skeletonSizes = [
  "sm",
  "md",
  "lg",
] as const satisfies readonly Present<AppSkeletonProps["size"]>[];
const textFieldSizes = [
  "md",
  "lg",
] as const satisfies readonly Present<AppTextFieldProps["size"]>[];
const textFieldStates = [
  "default",
  "error",
] as const satisfies readonly Present<AppTextFieldProps["state"]>[];
const searchFieldSizes = [
  "md",
  "lg",
] as const satisfies readonly Present<AppSearchFieldProps["size"]>[];

export const uiKitVariantAxes = {
  AppText: { variants: textVariants, tones: textTones },
  AppIcon: { sizes: iconSizes, tones: iconTones },
  AppButton: {
    tones: buttonTones,
    variants: buttonVariants,
    sizes: buttonSizes,
  },
  AppIconButton: {
    tones: buttonTones,
    variants: buttonVariants,
    sizes: iconButtonSizes,
  },
  AppCard: {
    surfaces: cardSurfaces,
    elevations: cardElevations,
    paddings: cardPaddings,
  },
  AppBadge: { tones: badgeTones, sizes: badgeSizes },
  AppDivider: {
    orientations: dividerOrientations,
    tones: dividerTones,
  },
  AppSkeleton: { shapes: skeletonShapes, sizes: skeletonSizes },
  AppTextField: { sizes: textFieldSizes, states: textFieldStates },
  AppSearchField: { sizes: searchFieldSizes },
} as const;

export const componentFixtures = [
  {
    component: "AppText",
    variants: textVariants,
    tones: textTones,
    states: ["default", "truncated"],
  },
  {
    component: "AppIcon",
    sizes: iconSizes,
    tones: iconTones,
    states: ["decorative", "meaningful"],
  },
  {
    component: "AppButton",
    variants: buttonVariants,
    tones: buttonTones,
    sizes: buttonSizes,
    states: ["default", "focused", "pressed", "disabled", "loading"],
  },
  {
    component: "AppIconButton",
    variants: buttonVariants,
    tones: buttonTones,
    sizes: iconButtonSizes,
    states: ["default", "focused", "pressed", "disabled", "loading"],
  },
  {
    component: "AppCard",
    surfaces: cardSurfaces,
    elevations: cardElevations,
    paddings: cardPaddings,
    states: ["default", "interactive", "focused"],
  },
  {
    component: "AppBadge",
    tones: badgeTones,
    sizes: badgeSizes,
    states: ["default"],
  },
  {
    component: "AppDivider",
    orientations: dividerOrientations,
    tones: dividerTones,
    states: ["decorative", "meaningful"],
  },
  {
    component: "AppSkeleton",
    shapes: skeletonShapes,
    sizes: skeletonSizes,
    states: ["loading", "reduced-motion"],
  },
  {
    component: "AppTextField",
    sizes: textFieldSizes,
    states: [
      ...textFieldStates,
      "focused",
      "disabled",
      "helper",
      "empty",
    ],
  },
  {
    component: "AppSearchField",
    sizes: searchFieldSizes,
    states: ["default", "focused", "disabled", "loading", "filled", "empty"],
  },
] as const;

export const UI_KIT_LONG_VIETNAMESE_TEXT =
  "Đơn hàng doanh nghiệp có tên rất dài cần giữ nguyên để người dùng hiểu đầy đủ ngữ cảnh khi thao tác trên màn hình nhỏ.";
export const UI_KIT_LARGE_MONEY = "9.999.999.999 ₫";
export const UI_KIT_LONG_BADGE =
  "Đang chờ xác nhận thanh toán từ nhà cung cấp trong kỳ đối soát tháng này";
export const UI_KIT_EMPTY_CONTENT = "";

export const edgeContentFixtures = [
  {
    id: "long-vietnamese",
    label: "Long Vietnamese text",
    value: UI_KIT_LONG_VIETNAMESE_TEXT,
    expectation: "Wrap hoặc truncate nhưng luôn giữ full-text strategy.",
  },
  {
    id: "large-money",
    label: "Large money",
    value: UI_KIT_LARGE_MONEY,
    expectation: "Không mất chữ số, đơn vị hoặc ý nghĩa.",
  },
  {
    id: "long-badge",
    label: "Long badge",
    value: UI_KIT_LONG_BADGE,
    expectation: "Giữ nguyên status copy và không overflow ngang.",
  },
  {
    id: "empty-content",
    label: "Empty content",
    value: UI_KIT_EMPTY_CONTENT,
    expectation: "Có empty-state copy và không tạo control không tên.",
  },
] as const;

export const usageFixtures = [
  {
    area: "Foundation",
    correct: "Dùng semantic token theo vai trò.",
    incorrect: "Sao chép raw visual value vào component hoặc screen.",
  },
  {
    area: "AppText",
    correct: "Chọn heading element theo document semantics.",
    incorrect: "Suy ra heading level từ visual variant.",
  },
  {
    area: "AppIcon",
    correct: "Ẩn icon trang trí; đặt label cho icon có nghĩa.",
    incorrect: "Để icon có nghĩa không tên.",
  },
  {
    area: "AppButton",
    correct: "Giữ accessible name ổn định khi loading.",
    incorrect: "Cho action chạy khi disabled hoặc loading.",
  },
  {
    area: "AppCard",
    correct: "Chỉ bật interactive cho một action có tên.",
    incorrect: "Bật interactive cho card tĩnh hoặc chứa nhiều action.",
  },
  {
    area: "AppBadge",
    correct: "Dùng status copy rõ nghĩa cùng semantic tone.",
    incorrect: "Truyền đạt trạng thái chỉ bằng màu.",
  },
  {
    area: "AppDivider",
    correct: "Chọn decorative hoặc meaningful theo nội dung.",
    incorrect: "Ép chiều cao vertical divider trong component.",
  },
  {
    area: "AppSkeleton",
    correct: "Đặt busy state trên vùng chứa.",
    incorrect: "Dùng random width hoặc để skeleton tự announce.",
  },
  {
    area: "AppTextField",
    correct: "Dùng visible label và liên kết helper/error.",
    incorrect: "Dùng placeholder thay label hoặc thêm business validation.",
  },
  {
    area: "AppSearchField",
    correct: "Để controller ngoài sở hữu debounce và request.",
    incorrect: "Fetch hoặc debounce trong search field.",
  },
] as const;

const benchmarkLabels = [
  "Nội dung tham chiếu",
  "Dòng kiểm tra cuộn",
  "Mẫu typography tiếng Việt",
  "Mục đo hiệu năng",
] as const;
const benchmarkStatuses = [
  "Sẵn sàng",
  "Đang xem xét",
  "Cần chú ý",
  "Hoàn tất",
] as const;

export const benchmarkRows = Array.from({ length: 200 }, (_, index) => {
  const ordinal = index + 1;
  const stableNumber = ordinal.toString().padStart(3, "0");

  return {
    id: `ui-kit-row-${stableNumber}`,
    label: `${benchmarkLabels[index % benchmarkLabels.length]} ${stableNumber}`,
    status: benchmarkStatuses[index % benchmarkStatuses.length],
    displayValue: `${(ordinal * 1000).toLocaleString("vi-VN")} ₫`,
  };
});
