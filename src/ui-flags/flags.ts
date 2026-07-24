export type UiVersion = "legacy" | "v2";

export interface UiSliceDefinition {
  key: string;
  environmentKey: `VITE_UI_${string}_V2`;
  defaultVersion: "legacy";
  owner: string;
  rollbackTarget: "legacy";
  productionEnabled: false;
}

export interface UiVersionResolution {
  key: UiSliceKey;
  version: UiVersion;
  source: "default" | "environment" | "qa-override";
}

export const uiSliceRegistry = {
  "reference-list": {
    key: "reference-list",
    environmentKey: "VITE_UI_REFERENCE_LIST_V2",
    defaultVersion: "legacy",
    owner: "Reference feature owner",
    rollbackTarget: "legacy",
    productionEnabled: false,
  },
  "reference-detail": {
    key: "reference-detail",
    environmentKey: "VITE_UI_REFERENCE_DETAIL_V2",
    defaultVersion: "legacy",
    owner: "Reference feature owner",
    rollbackTarget: "legacy",
    productionEnabled: false,
  },
} as const satisfies Record<string, UiSliceDefinition>;

export type UiSliceKey = keyof typeof uiSliceRegistry;

export const isUiSliceKey = (key: string): key is UiSliceKey =>
  Object.prototype.hasOwnProperty.call(uiSliceRegistry, key);
