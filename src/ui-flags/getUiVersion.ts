import {
  isUiSliceKey,
  uiSliceRegistry,
  type UiSliceKey,
  type UiVersion,
  type UiVersionResolution,
} from "./flags";

interface UiVersionRuntime {
  mode: string;
  production: boolean;
  environment: Readonly<Record<string, string | boolean | undefined>>;
  search: string;
  debug: (message: string) => void;
}

const readRuntime = (): UiVersionRuntime => ({
  mode: import.meta.env.MODE,
  production:
    import.meta.env.PROD === true || import.meta.env.MODE === "production",
  environment: import.meta.env as Readonly<
    Record<string, string | boolean | undefined>
  >,
  search: typeof window === "undefined" ? "" : window.location.search,
  debug: (message) => console.debug(message),
});

const parseEnvironmentVersion = (
  value: string | boolean | undefined,
): UiVersion | undefined => {
  if (value === true || value === "true") return "v2";
  if (value === false || value === "false") return "legacy";
  return undefined;
};

const parseOverrideVersion = (value: string | null): UiVersion | undefined => {
  if (value === "v2" || value === "legacy") return value;
  return undefined;
};

export const resolveUiVersion = (
  key: UiSliceKey,
  runtime: UiVersionRuntime,
): UiVersionResolution => {
  if (!isUiSliceKey(key)) {
    throw new Error(`Unknown UI slice: ${String(key)}`);
  }

  const definition = uiSliceRegistry[key];
  const environmentValue = runtime.environment[definition.environmentKey];
  const environmentVersion = parseEnvironmentVersion(environmentValue);

  if (!runtime.production) {
    const queryValue = new URLSearchParams(runtime.search).get(`ui-${key}`);
    const overrideVersion = parseOverrideVersion(queryValue);

    if (overrideVersion) {
      return {
        key,
        version: overrideVersion,
        source: "qa-override",
      };
    }

    if (queryValue !== null) {
      runtime.debug(
        `Ignoring invalid QA override for UI slice "${key}": "${queryValue}"`,
      );
    }
  }

  if (environmentVersion) {
    return {
      key,
      version: environmentVersion,
      source: "environment",
    };
  }

  if (
    environmentValue !== undefined &&
    environmentValue !== ""
  ) {
    runtime.debug(
      `Ignoring invalid environment value for ${definition.environmentKey}`,
    );
  }

  return {
    key,
    version: definition.defaultVersion,
    source: "default",
  };
};

export const getUiVersion = (key: UiSliceKey): UiVersionResolution => {
  if (!isUiSliceKey(key)) {
    throw new Error(`Unknown UI slice: ${String(key)}`);
  }

  return resolveUiVersion(key, readRuntime());
};
