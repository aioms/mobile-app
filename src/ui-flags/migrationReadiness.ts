import { isUiSliceKey, type UiSliceKey } from "./flags";

export type ExperienceMetric =
  | "initial-gzip"
  | "precache-total"
  | "time-to-usable"
  | "interaction-next-paint"
  | "long-task"
  | "dom-count"
  | "heap";

export type ExperienceUnit = "bytes" | "ms" | "count" | "percent";

export interface ExperienceBaseline {
  capturedAt: string;
  commit: string;
  environment: string;
  metric: ExperienceMetric;
  sampleCount: number;
  value: number;
  unit: ExperienceUnit;
  threshold: number;
  artifactPath: string;
}

export type MigrationStatus =
  | "draft"
  | "ready"
  | "implementation"
  | "qa"
  | "released"
  | "cleanup-eligible";

export interface RollbackRecord {
  sliceKey: UiSliceKey;
  triggerConditions: string[];
  action: string;
  targetVersion: "legacy";
  dataImpact: "none";
  owner: string;
  timeBudgetMinutes: number;
  verifiedAt?: string;
}

export interface MigrationReadinessRecord {
  sliceKey: UiSliceKey;
  filesInScope: string[];
  filesOutOfScope: string[];
  behaviorToPreserve: string[];
  visualBaseline: string[];
  performanceBaseline: ExperienceBaseline[];
  acceptanceCriteria: string[];
  testCommands: string[];
  manualQa: string[];
  rollbackPlan: RollbackRecord;
  status: MigrationStatus;
}

export interface MigrationReadinessError {
  field: string;
  message: string;
}

export interface MigrationReadinessValidation {
  valid: boolean;
  errors: MigrationReadinessError[];
}

const migrationStatuses = new Set<MigrationStatus>([
  "draft",
  "ready",
  "implementation",
  "qa",
  "released",
  "cleanup-eligible",
]);

const experienceMetrics = new Set<ExperienceMetric>([
  "initial-gzip",
  "precache-total",
  "time-to-usable",
  "interaction-next-paint",
  "long-task",
  "dom-count",
  "heap",
]);

const experienceUnits = new Set<ExperienceUnit>([
  "bytes",
  "ms",
  "count",
  "percent",
]);

const transitionTargets: Record<MigrationStatus, ReadonlySet<MigrationStatus>> =
  {
    draft: new Set(["ready"]),
    ready: new Set(["draft", "implementation"]),
    implementation: new Set(["draft", "qa"]),
    qa: new Set(["draft", "released"]),
    released: new Set(["cleanup-eligible"]),
    "cleanup-eligible": new Set(),
  };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isIsoDate = (value: unknown): value is string =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const addError = (
  errors: MigrationReadinessError[],
  field: string,
  message: string,
) => {
  errors.push({ field, message });
};

const validateStringCollection = (
  record: Record<string, unknown>,
  field: string,
  errors: MigrationReadinessError[],
) => {
  const value = record[field];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every(isNonEmptyString)
  ) {
    addError(errors, field, `${field} must be a non-empty string array`);
  }
};

const minimumSamplesFor = (metric: ExperienceMetric) => {
  if (metric === "time-to-usable") return 5;
  if (metric === "interaction-next-paint" || metric === "long-task") return 20;
  return 1;
};

const validateExperienceBaseline = (
  value: unknown,
  field: string,
  errors: MigrationReadinessError[],
) => {
  if (!isRecord(value)) {
    addError(errors, field, "performance baseline must be an object");
    return;
  }

  for (const name of ["commit", "environment", "artifactPath"] as const) {
    if (!isNonEmptyString(value[name])) {
      addError(errors, `${field}.${name}`, `${name} is required`);
    }
  }

  if (!isIsoDate(value.capturedAt)) {
    addError(errors, `${field}.capturedAt`, "capturedAt must be an ISO date");
  }

  if (
    !isNonEmptyString(value.metric) ||
    !experienceMetrics.has(value.metric as ExperienceMetric)
  ) {
    addError(errors, `${field}.metric`, "metric is invalid");
  }

  if (
    !isNonEmptyString(value.unit) ||
    !experienceUnits.has(value.unit as ExperienceUnit)
  ) {
    addError(errors, `${field}.unit`, "unit is invalid");
  }

  if (!isFiniteNumber(value.value)) {
    addError(errors, `${field}.value`, "value must be finite");
  }

  if (!isFiniteNumber(value.threshold)) {
    addError(errors, `${field}.threshold`, "threshold must be finite");
  }

  const sampleCount = value.sampleCount;
  if (
    !isFiniteNumber(sampleCount) ||
    !Number.isInteger(sampleCount) ||
    sampleCount <= 0
  ) {
    addError(
      errors,
      `${field}.sampleCount`,
      "sampleCount must be a positive integer",
    );
  } else if (
    isNonEmptyString(value.metric) &&
    experienceMetrics.has(value.metric as ExperienceMetric) &&
    sampleCount < minimumSamplesFor(value.metric as ExperienceMetric)
  ) {
    addError(
      errors,
      `${field}.sampleCount`,
      `sampleCount is below the minimum for ${value.metric}`,
    );
  }
};

const validateRollback = (
  value: unknown,
  sliceKey: unknown,
  status: unknown,
  errors: MigrationReadinessError[],
) => {
  if (!isRecord(value)) {
    addError(errors, "rollbackPlan", "rollbackPlan is required");
    return;
  }

  if (!isNonEmptyString(value.sliceKey) || !isUiSliceKey(value.sliceKey)) {
    addError(
      errors,
      "rollbackPlan.sliceKey",
      "rollback slice must exist in the registry",
    );
  } else if (value.sliceKey !== sliceKey) {
    addError(
      errors,
      "rollbackPlan.sliceKey",
      "rollback must target the same slice",
    );
  }

  if (
    !Array.isArray(value.triggerConditions) ||
    value.triggerConditions.length === 0 ||
    !value.triggerConditions.every(isNonEmptyString)
  ) {
    addError(
      errors,
      "rollbackPlan.triggerConditions",
      "rollback trigger conditions are required",
    );
  }

  for (const name of ["action", "owner"] as const) {
    if (!isNonEmptyString(value[name])) {
      addError(errors, `rollbackPlan.${name}`, `${name} is required`);
    }
  }

  if (value.targetVersion !== "legacy") {
    addError(
      errors,
      "rollbackPlan.targetVersion",
      "rollback target must be legacy",
    );
  }

  if (value.dataImpact !== "none") {
    addError(
      errors,
      "rollbackPlan.dataImpact",
      "rollback must not require data changes",
    );
  }

  if (
    !isFiniteNumber(value.timeBudgetMinutes) ||
    value.timeBudgetMinutes <= 0 ||
    value.timeBudgetMinutes > 5
  ) {
    addError(
      errors,
      "rollbackPlan.timeBudgetMinutes",
      "rollback time budget must be between 0 and 5 minutes",
    );
  }

  if (
    value.verifiedAt !== undefined &&
    !isIsoDate(value.verifiedAt)
  ) {
    addError(
      errors,
      "rollbackPlan.verifiedAt",
      "verifiedAt must be an ISO date",
    );
  }

  if (
    (status === "released" || status === "cleanup-eligible") &&
    !isIsoDate(value.verifiedAt)
  ) {
    addError(
      errors,
      "rollbackPlan.verifiedAt",
      "released migrations require verified rollback evidence",
    );
  }
};

export const validateMigrationReadiness = (
  value: unknown,
): MigrationReadinessValidation => {
  const errors: MigrationReadinessError[] = [];

  if (!isRecord(value)) {
    return {
      valid: false,
      errors: [
        {
          field: "record",
          message: "migration readiness record must be an object",
        },
      ],
    };
  }

  if (!isNonEmptyString(value.sliceKey) || !isUiSliceKey(value.sliceKey)) {
    addError(errors, "sliceKey", "sliceKey must exist in the UI registry");
  }

  for (const field of [
    "filesInScope",
    "filesOutOfScope",
    "behaviorToPreserve",
    "visualBaseline",
    "acceptanceCriteria",
    "testCommands",
    "manualQa",
  ]) {
    validateStringCollection(value, field, errors);
  }

  if (
    !Array.isArray(value.performanceBaseline) ||
    value.performanceBaseline.length === 0
  ) {
    addError(
      errors,
      "performanceBaseline",
      "performanceBaseline must be a non-empty array",
    );
  } else {
    value.performanceBaseline.forEach((baseline, index) =>
      validateExperienceBaseline(
        baseline,
        `performanceBaseline.${index}`,
        errors,
      ),
    );
  }

  if (
    !isNonEmptyString(value.status) ||
    !migrationStatuses.has(value.status as MigrationStatus)
  ) {
    addError(errors, "status", "status is invalid");
  }

  validateRollback(value.rollbackPlan, value.sliceKey, value.status, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const canTransitionMigration = (
  from: MigrationStatus,
  to: MigrationStatus,
): boolean => transitionTargets[from].has(to);

export const assertMigrationTransition = (
  from: MigrationStatus,
  to: MigrationStatus,
) => {
  if (!canTransitionMigration(from, to)) {
    throw new Error(`Invalid migration transition: ${from} -> ${to}`);
  }
};

export const transitionMigrationStatus = (
  record: MigrationReadinessRecord,
  nextStatus: MigrationStatus,
): MigrationReadinessRecord => {
  assertMigrationTransition(record.status, nextStatus);

  const candidate = {
    ...record,
    status: nextStatus,
  };
  const validation = validateMigrationReadiness(candidate);

  if (!validation.valid) {
    const summary = validation.errors
      .map((error) => `${error.field}: ${error.message}`)
      .join("; ");
    throw new Error(`Migration is not ready for ${nextStatus}: ${summary}`);
  }

  return candidate;
};
