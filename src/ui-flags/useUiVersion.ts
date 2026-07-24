import { useMemo } from "react";

import type { UiSliceKey, UiVersionResolution } from "./flags";
import { getUiVersion } from "./getUiVersion";

export const useUiVersion = (key: UiSliceKey): UiVersionResolution =>
  useMemo(() => getUiVersion(key), [key]);
