import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  uiSliceRegistry,
  type UiSliceKey,
} from "./flags";
import { getUiVersion } from "./getUiVersion";
import { useUiVersion } from "./useUiVersion";

const REFERENCE_LIST_KEY = "reference-list" as const;
const REFERENCE_DETAIL_KEY = "reference-detail" as const;
const LIST_ENVIRONMENT_KEY = "VITE_UI_REFERENCE_LIST_V2";
const DETAIL_ENVIRONMENT_KEY = "VITE_UI_REFERENCE_DETAIL_V2";

const setRuntime = ({
  production = false,
  listEnvironment,
  detailEnvironment,
  query = "",
}: {
  production?: boolean;
  listEnvironment?: string;
  detailEnvironment?: string;
  query?: string;
} = {}) => {
  vi.stubEnv("MODE", production ? "production" : "test");
  if (listEnvironment !== undefined) {
    vi.stubEnv(LIST_ENVIRONMENT_KEY, listEnvironment);
  }
  if (detailEnvironment !== undefined) {
    vi.stubEnv(DETAIL_ENVIRONMENT_KEY, detailEnvironment);
  }
  window.history.replaceState(null, "", `/${query}`);
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("screen-level UI feature control", () => {
  it("keeps every foundation registry entry Legacy-only by default", () => {
    expect(uiSliceRegistry[REFERENCE_LIST_KEY]).toMatchObject({
      key: REFERENCE_LIST_KEY,
      environmentKey: LIST_ENVIRONMENT_KEY,
      defaultVersion: "legacy",
      rollbackTarget: "legacy",
      productionEnabled: false,
    });
    expect(uiSliceRegistry[REFERENCE_DETAIL_KEY]).toMatchObject({
      key: REFERENCE_DETAIL_KEY,
      environmentKey: DETAIL_ENVIRONMENT_KEY,
      defaultVersion: "legacy",
      rollbackTarget: "legacy",
      productionEnabled: false,
    });
    expect(uiSliceRegistry[REFERENCE_LIST_KEY].owner).not.toHaveLength(0);
    expect(uiSliceRegistry[REFERENCE_DETAIL_KEY].owner).not.toHaveLength(0);
  });

  it("resolves missing configuration to the Legacy default", () => {
    setRuntime();

    expect(getUiVersion(REFERENCE_LIST_KEY)).toEqual({
      key: REFERENCE_LIST_KEY,
      version: "legacy",
      source: "default",
    });
  });

  it.each(["false", "", "yes", "1", "V2", "unexpected"])(
    "treats environment value %j as Legacy rather than enabling V2",
    (environmentValue) => {
      setRuntime({ listEnvironment: environmentValue });

      expect(getUiVersion(REFERENCE_LIST_KEY)).toEqual({
        key: REFERENCE_LIST_KEY,
        version: "legacy",
        source: environmentValue === "false" ? "environment" : "default",
      });
    },
  );

  it("enables V2 only for the exact environment key with value true", () => {
    setRuntime({
      listEnvironment: "true",
      detailEnvironment: "false",
    });

    expect(getUiVersion(REFERENCE_LIST_KEY)).toEqual({
      key: REFERENCE_LIST_KEY,
      version: "v2",
      source: "environment",
    });
    expect(getUiVersion(REFERENCE_DETAIL_KEY)).toEqual({
      key: REFERENCE_DETAIL_KEY,
      version: "legacy",
      source: "environment",
    });
  });

  it.each([
    {
      query: "?ui-reference-list=v2",
      environment: "false",
      expected: "v2",
    },
    {
      query: "?ui-reference-list=legacy",
      environment: "true",
      expected: "legacy",
    },
  ] as const)(
    "gives a valid non-production QA override precedence over environment",
    ({ query, environment, expected }) => {
      setRuntime({
        production: false,
        listEnvironment: environment,
        query,
      });

      expect(getUiVersion(REFERENCE_LIST_KEY)).toEqual({
        key: REFERENCE_LIST_KEY,
        version: expected,
        source: "qa-override",
      });
    },
  );

  it("ignores invalid QA override values and falls back to environment", () => {
    setRuntime({
      production: false,
      listEnvironment: "true",
      query: "?ui-reference-list=beta",
    });

    expect(getUiVersion(REFERENCE_LIST_KEY)).toEqual({
      key: REFERENCE_LIST_KEY,
      version: "v2",
      source: "environment",
    });
  });

  it.each([
    {
      query: "?ui-reference-list=v2",
      environment: "false",
      expected: "legacy",
    },
    {
      query: "?ui-reference-list=legacy",
      environment: "true",
      expected: "v2",
    },
  ] as const)(
    "ignores QA overrides in production",
    ({ query, environment, expected }) => {
      setRuntime({
        production: true,
        listEnvironment: environment,
        query,
      });

      expect(getUiVersion(REFERENCE_LIST_KEY)).toEqual({
        key: REFERENCE_LIST_KEY,
        version: expected,
        source: "environment",
      });
    },
  );

  it("rejects keys outside the typed registry", () => {
    const compileTimeContract = () => {
      // @ts-expect-error unknown slices cannot be resolved by feature code
      getUiVersion("unknown-slice");
    };
    void compileTimeContract;

    expect(() =>
      getUiVersion("unknown-slice" as UiSliceKey),
    ).toThrow(/unknown|registry|slice/i);
  });

  it("keeps one slice toggle isolated from every other slice", () => {
    setRuntime({
      listEnvironment: "true",
      detailEnvironment: "false",
      query: "?ui-reference-detail=legacy",
    });

    expect(getUiVersion(REFERENCE_LIST_KEY).version).toBe("v2");
    expect(getUiVersion(REFERENCE_DETAIL_KEY).version).toBe("legacy");
  });

  it("exposes the same resolution through the thin React hook", () => {
    setRuntime({ listEnvironment: "true" });

    const { result } = renderHook(() => useUiVersion(REFERENCE_LIST_KEY));

    expect(result.current).toEqual(getUiVersion(REFERENCE_LIST_KEY));
  });

  it("resolves without storage, network, URL, or business-data mutation", () => {
    setRuntime({
      listEnvironment: "true",
      query: "?ui-reference-list=v2&business-record=unchanged",
    });
    const originalUrl = window.location.href;
    const localSet = vi.spyOn(Storage.prototype, "setItem");
    const localRemove = vi.spyOn(Storage.prototype, "removeItem");
    const localClear = vi.spyOn(Storage.prototype, "clear");
    const historyPush = vi.spyOn(window.history, "pushState");
    const historyReplace = vi.spyOn(window.history, "replaceState");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const resolution = getUiVersion(REFERENCE_LIST_KEY);

    expect(resolution.version).toBe("v2");
    expect(localSet).not.toHaveBeenCalled();
    expect(localRemove).not.toHaveBeenCalled();
    expect(localClear).not.toHaveBeenCalled();
    expect(historyPush).not.toHaveBeenCalled();
    expect(historyReplace).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalUrl);
  });
});
