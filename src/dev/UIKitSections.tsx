import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Package,
  Search,
} from "lucide-react";

import {
  AppBadge,
  AppButton,
  AppCard,
  AppDivider,
  AppIcon,
  AppIconButton,
  AppSearchField,
  AppSkeleton,
  AppText,
  AppTextField,
} from "@/design-system";

import {
  edgeContentFixtures,
  foundationTokenFixtures,
  uiKitVariantAxes,
  usageFixtures,
} from "./UIKitFixtures";
import { UIKitBenchmark } from "./UIKitBenchmark";
import {
  collectDomHeapEvidence,
  collectInteractionPerformance,
  collectScrollPerformance,
  type DomHeapEvidence,
  type InteractionPerformanceEvidence,
  type ScrollPerformanceEvidence,
} from "./UIKitPerformance";

interface UIKitSectionProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

interface UIKitSectionsProps {
  getPrimaryScrollElement: () => Promise<HTMLElement | null>;
}

const UIKitSection: React.FC<UIKitSectionProps> = ({
  id,
  title,
  description,
  children,
}) => (
  <section
    id={id}
    aria-labelledby={`${id}-title`}
    className="space-y-ds-4 rounded-ds-card border border-ds-border-default bg-ds-surface-default p-ds-4"
  >
    <header className="space-y-ds-1">
      <div id={`${id}-title`}>
        <AppText as="h2" variant="heading">
          {title}
        </AppText>
      </div>
      <AppText as="p" tone="secondary">
        {description}
      </AppText>
    </header>
    {children}
  </section>
);

const colorSwatches = [
  {
    label: "Brand primary",
    className: "bg-ds-brand text-ds-text-inverse",
  },
  {
    label: "Surface default",
    className:
      "border border-ds-border-default bg-ds-surface-default text-ds-text-primary",
  },
  {
    label: "Surface subtle",
    className: "bg-ds-surface-subtle text-ds-text-primary",
  },
  {
    label: "Success",
    className: "bg-ds-status-success-subtle text-ds-status-success",
  },
  {
    label: "Warning",
    className: "bg-ds-status-warning-subtle text-ds-status-warning",
  },
  {
    label: "Danger",
    className: "bg-ds-status-danger-subtle text-ds-status-danger",
  },
] as const;

export const UIKitSections: React.FC<UIKitSectionsProps> = ({
  getPrimaryScrollElement,
}) => {
  const [fieldValue, setFieldValue] = useState("Nguyễn Văn An");
  const [searchValue, setSearchValue] = useState("đơn hàng");
  const [actionCount, setActionCount] = useState(0);
  const [reducedMotionPreview, setReducedMotionPreview] = useState(false);
  const [performanceStatus, setPerformanceStatus] = useState<
    "idle" | "running" | "complete" | "error"
  >("idle");
  const [performanceError, setPerformanceError] = useState("");
  const [interactionEvidence, setInteractionEvidence] =
    useState<InteractionPerformanceEvidence | null>(null);
  const [scrollEvidence, setScrollEvidence] =
    useState<ScrollPerformanceEvidence | null>(null);
  const [domEvidence, setDomEvidence] = useState<DomHeapEvidence | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const runPerformanceReview = async () => {
    const root = rootRef.current;
    const scrollElement = await getPrimaryScrollElement();
    if (!root || !scrollElement) {
      setPerformanceStatus("error");
      setPerformanceError("Không tìm thấy vùng cuộn chính của Ionic.");
      return;
    }

    setPerformanceStatus("running");
    setPerformanceError("");
    try {
      const interaction = await collectInteractionPerformance({
        action: () => setActionCount((count) => count + 1),
      });
      const scroll = await collectScrollPerformance({ scrollElement });
      const dom = collectDomHeapEvidence({
        root,
        primaryScrollContainer: scrollElement,
      });

      setInteractionEvidence(interaction);
      setScrollEvidence(scroll);
      setDomEvidence(dom);
      setPerformanceStatus("complete");
    } catch (error) {
      setPerformanceStatus("error");
      setPerformanceError(
        error instanceof Error ? error.message : "Không thể thu thập số đo.",
      );
    }
  };

  return (
    <div
      ref={rootRef}
      className={`space-y-ds-6 ${
        reducedMotionPreview ? "ds-reduced-motion-preview" : ""
      }`}
    >
      <UIKitSection
        id="semantic-colors"
        title="Semantic colors and contrast"
        description={`${foundationTokenFixtures.length} approved tokens. Raw values stay in the token source.`}
      >
        <div className="grid grid-cols-2 gap-ds-3 md:grid-cols-3">
          {colorSwatches.map((swatch) => (
            <div
              key={swatch.label}
              className={`min-h-24 rounded-ds-md p-ds-3 ${swatch.className}`}
            >
              <AppText variant="label">{swatch.label}</AppText>
            </div>
          ))}
        </div>
      </UIKitSection>

      <UIKitSection
        id="typography"
        title="Typography scale"
        description="Visual variants remain independent from document semantics."
      >
        <div className="space-y-ds-3">
          {uiKitVariantAxes.AppText.variants.map((variant) => (
            <AppText key={variant} as="p" variant={variant}>
              {variant}: Quản lý đơn hàng tiếng Việt
            </AppText>
          ))}
        </div>
      </UIKitSection>

      <UIKitSection
        id="layout-foundations"
        title="Spacing, radius, elevation, motion and safe area"
        description="Four-point spacing, semantic shapes and reduced-motion-safe feedback."
      >
        <div className="grid gap-ds-3 md:grid-cols-3">
          <AppCard padding="sm">Spacing sm</AppCard>
          <AppCard padding="md" elevation="raised">
            Raised card
          </AppCard>
          <AppCard padding="lg" surface="subtle">
            Safe area stays Ionic-owned
          </AppCard>
        </div>
      </UIKitSection>

      <UIKitSection
        id="icons"
        title="Icon sizes and semantics"
        description="Decorative icons are hidden; meaningful icons require names."
      >
        <div className="flex flex-wrap items-center gap-ds-4">
          {uiKitVariantAxes.AppIcon.sizes.map((size) => (
            <AppIcon key={size} icon={Package} size={size} />
          ))}
          <AppIcon
            icon={Search}
            decorative={false}
            label="Tìm kiếm sản phẩm"
          />
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-text"
        title="AppText"
        description="All variants, tones and long-content behavior."
      >
        <div className="space-y-ds-2">
          {uiKitVariantAxes.AppText.tones.map((tone) => (
            <AppText key={tone} as="p" tone={tone}>
              Tone {tone}: Nội dung có nghĩa
            </AppText>
          ))}
          <AppText as="p" truncate>
            Tên doanh nghiệp rất dài cần giữ nguyên nội dung cho công nghệ hỗ trợ
          </AppText>
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-icon"
        title="AppIcon"
        description="Semantic size/tone matrix."
      >
        <div className="flex flex-wrap gap-ds-4">
          {uiKitVariantAxes.AppIcon.tones.flatMap((tone) =>
            uiKitVariantAxes.AppIcon.sizes.map((size) => (
              <AppIcon
                key={`${tone}-${size}`}
                icon={Check}
                decorative={false}
                label={`${tone} ${size}`}
                tone={tone}
                size={size}
              />
            )),
          )}
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-button"
        title="AppButton"
        description="Tone, variant, size, disabled and loading states."
      >
        <div className="flex flex-wrap gap-ds-3">
          {uiKitVariantAxes.AppButton.tones.flatMap((tone) =>
            uiKitVariantAxes.AppButton.variants.flatMap((variant) =>
              uiKitVariantAxes.AppButton.sizes.map((size) => (
                <AppButton
                  key={`${tone}-${variant}-${size}`}
                  tone={tone}
                  variant={variant}
                  size={size}
                  onClick={() => setActionCount((count) => count + 1)}
                >
                  {tone} {variant} {size}
                </AppButton>
              )),
            ),
          )}
          <AppButton disabled>Disabled</AppButton>
          <AppButton loading>Loading</AppButton>
        </div>
        <div aria-live="polite">
          <AppText as="p" variant="caption">
            Visible responses: {actionCount}
          </AppText>
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-icon-button"
        title="AppIconButton"
        description="Every public size keeps at least a 44×44 hit target."
      >
        <div className="flex flex-wrap gap-ds-3">
          {uiKitVariantAxes.AppIconButton.tones.flatMap((tone) =>
            uiKitVariantAxes.AppIconButton.variants.flatMap((variant) =>
              uiKitVariantAxes.AppIconButton.sizes.map((size) => (
                <AppIconButton
                  key={`${tone}-${variant}-${size}`}
                  icon={Search}
                  label={`${tone} ${variant} ${size}`}
                  tone={tone}
                  variant={variant}
                  size={size}
                />
              )),
            ),
          )}
          <AppIconButton icon={Search} label="Loading search" loading />
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-card"
        title="AppCard"
        description="Surface, elevation, padding and keyboard interaction."
      >
        <div className="grid gap-ds-3 md:grid-cols-2">
          {uiKitVariantAxes.AppCard.surfaces.flatMap((surface) =>
            uiKitVariantAxes.AppCard.elevations.flatMap((elevation) =>
              uiKitVariantAxes.AppCard.paddings.map((padding) => (
                <AppCard
                  key={`${surface}-${elevation}-${padding}`}
                  surface={surface}
                  elevation={elevation}
                  padding={padding}
                >
                  {surface} / {elevation} / {padding}
                </AppCard>
              )),
            ),
          )}
          <AppCard
            interactive
            aria-label="Mở card tham chiếu"
            onClick={() => setActionCount((count) => count + 1)}
          >
            Interactive card <ChevronRight aria-hidden="true" />
          </AppCard>
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-badge"
        title="AppBadge"
        description="Status meaning always includes text."
      >
        <div className="flex flex-wrap gap-ds-2">
          {uiKitVariantAxes.AppBadge.tones.flatMap((tone) =>
            uiKitVariantAxes.AppBadge.sizes.map((size) => (
              <AppBadge key={`${tone}-${size}`} tone={tone} size={size}>
                {tone} {size}
              </AppBadge>
            )),
          )}
          <AppBadge tone="warning">
            Đang chờ xác nhận thanh toán trong kỳ đối soát tháng này
          </AppBadge>
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-divider"
        title="AppDivider"
        description="Decorative and meaningful orientations."
      >
        <div className="space-y-ds-3">
          <AppDivider decorative />
          <div className="flex h-12 items-center gap-ds-3">
            <span>Trước</span>
            <AppDivider decorative={false} orientation="vertical" />
            <span>Sau</span>
          </div>
          <AppDivider decorative={false} tone="strong" />
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-skeleton"
        title="AppSkeleton"
        description="Deterministic shapes with reduced-motion behavior."
      >
        <div aria-busy="true" className="grid gap-ds-4 md:grid-cols-3">
          <AppSkeleton shape="text" lines={3} />
          <AppSkeleton shape="rectangle" size="lg" />
          <AppSkeleton shape="circle" size="lg" />
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-text-field"
        title="AppTextField"
        description="Controlled values, labels, helpers and errors."
      >
        <div className="grid gap-ds-4 md:grid-cols-2">
          <AppTextField
            label="Tên khách hàng"
            value={fieldValue}
            onValueChange={setFieldValue}
            helperText="Nhãn luôn hiển thị"
          />
          <AppTextField
            label="Mã số thuế"
            value="không hợp lệ"
            onValueChange={() => undefined}
            state="error"
            errorText="Mã số thuế không hợp lệ"
            trailingAction={
              <AppIconButton
                icon={AlertTriangle}
                label="Xem hướng dẫn lỗi"
                tone="danger"
                variant="ghost"
              />
            }
          />
        </div>
      </UIKitSection>

      <UIKitSection
        id="app-search-field"
        title="AppSearchField"
        description="Controller outside the component owns debounce and results."
      >
        <div className="grid gap-ds-4 md:grid-cols-2">
          <AppSearchField
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <AppSearchField
            label="Tìm nhà cung cấp"
            value="đang tải"
            onValueChange={() => undefined}
            loading
          />
        </div>
      </UIKitSection>

      <UIKitSection
        id="edge-content"
        title="Edge-content matrix"
        description="Vietnamese, large-money, long-badge and empty cases."
      >
        <div className="grid gap-ds-3 md:grid-cols-2">
          {edgeContentFixtures.map((fixture) => (
            <AppCard key={fixture.id} surface="subtle">
              <AppText as="p" variant="label">
                {fixture.label}
              </AppText>
              <AppText as="p" tone="secondary">
                {fixture.value || "Nội dung rỗng có chủ đích"}
              </AppText>
            </AppCard>
          ))}
        </div>
      </UIKitSection>

      <UIKitSection
        id="performance-benchmark"
        title="200-row performance benchmark"
        description="Reference and small-list controls use Ionic Content as the only scroll owner."
      >
        <div className="space-y-ds-6">
          <div className="flex flex-wrap gap-ds-3">
            <AppButton
              onClick={() => void runPerformanceReview()}
              loading={performanceStatus === "running"}
            >
              Chạy phép đo catalog
            </AppButton>
            <AppButton
              variant="outline"
              aria-pressed={reducedMotionPreview}
              onClick={() =>
                setReducedMotionPreview((isEnabled) => !isEnabled)
              }
            >
              {reducedMotionPreview
                ? "Tắt mô phỏng reduced motion"
                : "Mô phỏng reduced motion"}
            </AppButton>
          </div>
          <div aria-live="polite" className="space-y-ds-2">
            <AppText as="p" variant="label">
              Trạng thái đo: {performanceStatus}
            </AppText>
            {performanceError && (
              <AppText as="p" tone="danger">
                {performanceError}
              </AppText>
            )}
            {interactionEvidence && (
              <AppText as="p" tone="secondary">
                Interaction: {interactionEvidence.withinBudgetCount}/
                {interactionEvidence.sampleCount} mẫu ≤100 ms; p95{" "}
                {interactionEvidence.percentile95DurationMs.toFixed(1)} ms.
              </AppText>
            )}
            {scrollEvidence && (
              <AppText as="p" tone="secondary">
                Scroll: {scrollEvidence.cleanSegmentCount}/
                {scrollEvidence.segmentCount} segment sạch; Long Task API{" "}
                {scrollEvidence.longTaskSupported
                  ? "được hỗ trợ"
                  : "không được hỗ trợ"}.
              </AppText>
            )}
            {domEvidence && (
              <AppText as="p" tone="secondary">
                DOM: {domEvidence.domNodeCount} nodes,{" "}
                {domEvidence.benchmarkRowCount} benchmark rows,{" "}
                {domEvidence.nestedScrollContainerCount} nested scroll; heap{" "}
                {domEvidence.heap.supported
                  ? `${domEvidence.heap.usedJSHeapSize} bytes`
                  : "không được trình duyệt cung cấp"}.
              </AppText>
            )}
          </div>
          <UIKitBenchmark mode="small" />
          <UIKitBenchmark />
        </div>
      </UIKitSection>

      <UIKitSection
        id="resilience-states"
        title="Resilience and permission states"
        description="Reusable presentation examples; retry and permission policy remain consumer-owned."
      >
        <div className="grid gap-ds-3 md:grid-cols-2">
          <AppCard surface="subtle">
            <AppBadge tone="warning">Offline</AppBadge>
            <AppText as="p" variant="label">
              Không có kết nối
            </AppText>
            <AppText as="p" tone="secondary">
              Dữ liệu đã tải vẫn có thể được xem.
            </AppText>
          </AppCard>
          <AppCard surface="subtle">
            <AppBadge tone="info">Loading</AppBadge>
            <div aria-busy="true" className="mt-ds-3">
              <AppSkeleton shape="text" lines={2} />
            </div>
          </AppCard>
          <AppCard surface="subtle">
            <AppBadge tone="danger">Error</AppBadge>
            <AppText as="p">Không thể tải dữ liệu tham chiếu.</AppText>
            <AppButton
              className="mt-ds-3"
              variant="outline"
              onClick={() => setActionCount((count) => count + 1)}
            >
              Thử lại
            </AppButton>
          </AppCard>
          <AppCard surface="subtle">
            <AppBadge tone="neutral">Permission denied</AppBadge>
            <AppText as="p">
              Quyền camera bị từ chối. Mở cài đặt để cấp quyền nếu cần.
            </AppText>
            <AppButton className="mt-ds-3" variant="ghost">
              Xem hướng dẫn
            </AppButton>
          </AppCard>
        </div>
      </UIKitSection>

      <UIKitSection
        id="usage-guidance"
        title="Correct and incorrect usage"
        description="Review guidance prevents visual and behavioral drift."
      >
        <div className="space-y-ds-3">
          {usageFixtures.map((guidance) => (
            <AppCard key={guidance.area} padding="sm">
              <AppText as="p" variant="label">
                {guidance.area}
              </AppText>
              <AppText as="p" tone="success">
                Đúng: {guidance.correct}
              </AppText>
              <AppText as="p" tone="danger">
                Sai: {guidance.incorrect}
              </AppText>
            </AppCard>
          ))}
        </div>
      </UIKitSection>

      <UIKitSection
        id="legacy-isolation"
        title="Legacy style-isolation control"
        description="This sample uses only pre-existing Tailwind language and must not change when foundation CSS is imported."
      >
        <div
          data-testid="legacy-style-control"
          className="rounded-lg border border-gray-200 bg-white p-4 text-gray-900"
        >
          Legacy control sample
        </div>
      </UIKitSection>
    </div>
  );
};
