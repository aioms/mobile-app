import {
  createAnimation,
  iosTransitionAnimation,
  mdTransitionAnimation,
  type AnimationBuilder,
} from "@ionic/react";

/**
 * In a standalone PWA the browser animates the edge-swipe back itself and the
 * page cannot suppress it. Ionic's own back transition then replays the leaving
 * page on top of the already-restored previous page, which reads as a flicker,
 * so back navigations swap instantly and only forward pushes animate.
 */
export const webNavAnimation: AnimationBuilder = (baseEl, opts) => {
  if (opts?.direction === "back") {
    return createAnimation();
  }

  return opts?.mode === "ios"
    ? iosTransitionAnimation(baseEl, opts)
    : mdTransitionAnimation(baseEl, opts);
};
