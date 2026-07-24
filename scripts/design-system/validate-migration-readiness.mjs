#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");

const usage = `Usage:
  npm run validate:migration-readiness -- <record.json> [record.json ...]

Validates one or more migration readiness records. The command exits with:
  0  every record is valid
  1  at least one record is incomplete
  2  usage, file, or JSON error
`;

const uiSliceKeys = new Set(["reference-list", "reference-detail"]);
const migrationStatuses = new Set([
  "draft",
  "ready",
  "implementation",
  "qa",
  "released",
  "cleanup-eligible",
]);
const experienceMetrics = new Set([
  "initial-gzip",
  "precache-total",
  "time-to-usable",
  "interaction-next-paint",
  "long-task",
  "dom-count",
  "heap",
]);
const experienceUnits = new Set(["bytes", "ms", "count", "percent"]);

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isIsoDate = (value) =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const addError = (errors, field, message) => {
  errors.push({ field, message });
};

const validateStringCollection = (record, field, errors) => {
  const value = record[field];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every(isNonEmptyString)
  ) {
    addError(errors, field, `${field} must be a non-empty string array`);
  }
};

const minimumSamplesFor = (metric) => {
  if (metric === "time-to-usable") return 5;
  if (metric === "interaction-next-paint" || metric === "long-task") return 20;
  return 1;
};

const validateExperienceBaseline = (value, field, errors) => {
  if (!isRecord(value)) {
    addError(errors, field, "performance baseline must be an object");
    return;
  }

  for (const name of ["commit", "environment", "artifactPath"]) {
    if (!isNonEmptyString(value[name])) {
      addError(errors, `${field}.${name}`, `${name} is required`);
    }
  }

  if (!isIsoDate(value.capturedAt)) {
    addError(errors, `${field}.capturedAt`, "capturedAt must be an ISO date");
  }

  if (
    !isNonEmptyString(value.metric) ||
    !experienceMetrics.has(value.metric)
  ) {
    addError(errors, `${field}.metric`, "metric is invalid");
  }

  if (!isNonEmptyString(value.unit) || !experienceUnits.has(value.unit)) {
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
    experienceMetrics.has(value.metric) &&
    sampleCount < minimumSamplesFor(value.metric)
  ) {
    addError(
      errors,
      `${field}.sampleCount`,
      `sampleCount is below the minimum for ${value.metric}`,
    );
  }
};

const validateRollback = (value, sliceKey, status, errors) => {
  if (!isRecord(value)) {
    addError(errors, "rollbackPlan", "rollbackPlan is required");
    return;
  }

  if (!isNonEmptyString(value.sliceKey) || !uiSliceKeys.has(value.sliceKey)) {
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

  for (const name of ["action", "owner"]) {
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

  if (value.verifiedAt !== undefined && !isIsoDate(value.verifiedAt)) {
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

const validateMigrationReadiness = (value) => {
  const errors = [];

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

  if (!isNonEmptyString(value.sliceKey) || !uiSliceKeys.has(value.sliceKey)) {
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
    !migrationStatuses.has(value.status)
  ) {
    addError(errors, "status", "status is invalid");
  }

  validateRollback(value.rollbackPlan, value.sliceKey, value.status, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
};

const argumentsList = process.argv.slice(2);

if (argumentsList.includes("--help")) {
  console.log(usage);
  process.exit(0);
}

if (
  argumentsList.length === 0 ||
  argumentsList.some((value) => value.startsWith("-"))
) {
  console.error(usage);
  process.exit(2);
}

let failureCount = 0;

for (const argument of argumentsList) {
  const absolutePath = resolve(repositoryRoot, argument);
  const displayPath = relative(repositoryRoot, absolutePath);
  let record;

  try {
    record = JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`ERROR ${displayPath}: ${reason}`);
    process.exitCode = 2;
    continue;
  }

  const result = validateMigrationReadiness(record);
  if (result.valid) {
    console.log(
      `PASS ${displayPath} (${record.sliceKey}, status: ${record.status})`,
    );
    continue;
  }

  failureCount += 1;
  console.error(`FAIL ${displayPath}`);
  for (const error of result.errors) {
    console.error(`  - ${error.field}: ${error.message}`);
  }
}

if (process.exitCode !== 2) {
  process.exitCode = failureCount > 0 ? 1 : 0;
}
