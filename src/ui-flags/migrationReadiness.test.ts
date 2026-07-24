import { describe, expect, it } from "vitest";

import {
  canTransitionMigration,
  transitionMigrationStatus,
  validateMigrationReadiness,
  type MigrationReadinessRecord,
} from "./migrationReadiness";

const completeRecord = (): MigrationReadinessRecord => ({
  sliceKey: "reference-list",
  filesInScope: [
    "src/reference/ReferenceListPageV2.tsx",
    "src/reference/useReferenceListController.ts",
  ],
  filesOutOfScope: [
    "src/routes/index.tsx",
    "src/pages/LegacyReferenceList.tsx",
  ],
  behaviorToPreserve: [
    "Giữ nguyên navigation và back behavior",
    "Giữ nguyên search, filter và permission checks",
    "Giữ nguyên loading, empty, error và retry behavior",
  ],
  visualBaseline: [
    "specs/001-build-design-system-foundation/baselines/screenshots/reference-list.png",
  ],
  performanceBaseline: [
    {
      capturedAt: "2026-07-23T00:00:00.000Z",
      commit: "ea53362725a43bb2e377c9c423d0f71e18e3974d",
      environment: "PWA standalone, fixed mobile and network profile",
      metric: "time-to-usable",
      sampleCount: 5,
      value: 900,
      unit: "ms",
      threshold: 945,
      artifactPath:
        "specs/001-build-design-system-foundation/baselines/performance.md",
    },
  ],
  acceptanceCriteria: [
    "Legacy remains the default",
    "V2 can be disabled independently without changing data",
  ],
  testCommands: [
    "npm run test.unit -- --run src/ui-flags",
    "npm run vite:build",
  ],
  manualQa: [
    "Verify four viewport baselines",
    "Verify PWA standalone, safe area, keyboard and back behavior",
  ],
  rollbackPlan: {
    sliceKey: "reference-list",
    triggerConditions: [
      "High-severity navigation, permission or data-display regression",
    ],
    action:
      "Set VITE_UI_REFERENCE_LIST_V2=false and release through the existing explicit PWA update prompt",
    targetVersion: "legacy",
    dataImpact: "none",
    owner: "Reference feature owner",
    timeBudgetMinutes: 5,
    verifiedAt: "2026-07-23T00:00:00.000Z",
  },
  status: "ready",
});

const requiredFields = [
  "sliceKey",
  "filesInScope",
  "filesOutOfScope",
  "behaviorToPreserve",
  "visualBaseline",
  "performanceBaseline",
  "acceptanceCriteria",
  "testCommands",
  "manualQa",
  "rollbackPlan",
  "status",
] as const;

const requiredCollections = [
  "filesInScope",
  "filesOutOfScope",
  "behaviorToPreserve",
  "visualBaseline",
  "performanceBaseline",
  "acceptanceCriteria",
  "testCommands",
  "manualQa",
] as const;

const withoutField = (
  record: MigrationReadinessRecord,
  field: (typeof requiredFields)[number],
) => {
  const candidate = structuredClone(record) as unknown as Record<
    string,
    unknown
  >;
  delete candidate[field];
  return candidate;
};

describe("migration Definition of Ready", () => {
  it.each(requiredFields)("rejects a record missing %s", (field) => {
    const result = validateMigrationReadiness(
      withoutField(completeRecord(), field),
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.field)).toContain(field);
  });

  it.each(requiredCollections)(
    "rejects an empty required collection: %s",
    (field) => {
      const candidate = {
        ...completeRecord(),
        [field]: [],
      };

      const result = validateMigrationReadiness(candidate);

      expect(result.valid).toBe(false);
      expect(result.errors.map((error) => error.field)).toContain(field);
    },
  );

  it("accepts a complete readiness and rollback record", () => {
    expect(validateMigrationReadiness(completeRecord())).toEqual({
      valid: true,
      errors: [],
    });
  });

  it.each([
    {
      field: "rollbackPlan.targetVersion",
      value: "v2",
    },
    {
      field: "rollbackPlan.dataImpact",
      value: "migration-required",
    },
    {
      field: "rollbackPlan.timeBudgetMinutes",
      value: 6,
    },
  ] as const)(
    "rejects invalid rollback invariant $field=$value",
    ({ field, value }) => {
      const rollbackField = field.split(".")[1];
      const candidate = {
        ...completeRecord(),
        rollbackPlan: {
          ...completeRecord().rollbackPlan,
          [rollbackField]: value,
        },
      };

      const result = validateMigrationReadiness(candidate);

      expect(result.valid).toBe(false);
      expect(result.errors.map((error) => error.field)).toContain(field);
    },
  );

  it("rejects a rollback record for a different slice", () => {
    const candidate = completeRecord();
    candidate.rollbackPlan = {
      ...candidate.rollbackPlan,
      sliceKey: "reference-detail",
    };

    const result = validateMigrationReadiness(candidate);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.field)).toContain(
      "rollbackPlan.sliceKey",
    );
  });

  it("requires rollback verification before a released record is accepted", () => {
    const candidate = completeRecord();
    candidate.status = "released";
    delete candidate.rollbackPlan.verifiedAt;

    const result = validateMigrationReadiness(candidate);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.field)).toContain(
      "rollbackPlan.verifiedAt",
    );
  });

  it("allows verification to remain pending while a complete record is only ready", () => {
    const candidate = completeRecord();
    delete candidate.rollbackPlan.verifiedAt;

    expect(validateMigrationReadiness(candidate)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it.each([
    ["draft", "ready"],
    ["ready", "implementation"],
    ["implementation", "qa"],
    ["qa", "released"],
    ["released", "cleanup-eligible"],
    ["ready", "draft"],
    ["implementation", "draft"],
    ["qa", "draft"],
  ] as const)("allows the contract transition %s -> %s", (from, to) => {
    expect(canTransitionMigration(from, to)).toBe(true);
  });

  it.each([
    ["draft", "implementation"],
    ["ready", "qa"],
    ["implementation", "released"],
    ["qa", "cleanup-eligible"],
    ["released", "draft"],
    ["cleanup-eligible", "draft"],
  ] as const)("blocks the contract transition %s -> %s", (from, to) => {
    expect(canTransitionMigration(from, to)).toBe(false);
  });

  it("validates the complete record while moving from draft to ready", () => {
    const record = completeRecord();
    record.status = "draft";

    expect(transitionMigrationStatus(record, "ready")).toMatchObject({
      sliceKey: "reference-list",
      status: "ready",
    });
  });
});
