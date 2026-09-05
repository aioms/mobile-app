import {
  iosTransitionAnimation,
  mdTransitionAnimation,
  type AnimationBuilder,
} from "@ionic/react";

/**
 * In a standalone PWA the browser animates the edge-swipe back itself and the
 * page cannot suppress it. Ionic's own back transition then replays the leaving
 * page on top of the already-restored previous page, which reads as a flicker,
 * so back navigations swap instantly (duration: 1ms) while executing all of
 * Ionic's internal DOM cleanups (hiding leaving view, removing ion-page-invisible,
 * and releasing transition locks) and only forward pushes animate.
 */
export const webNavAnimation: AnimationBuilder = (baseEl, opts) => {
  if (opts?.direction === "back") {
    return opts?.mode === "ios"
      ? iosTransitionAnimation(baseEl, { ...opts, duration: 1 })
      : mdTransitionAnimation(baseEl, { ...opts, duration: 1 });
  }

  return opts?.mode === "ios"
    ? iosTransitionAnimation(baseEl, opts)
    : mdTransitionAnimation(baseEl, opts);
};
