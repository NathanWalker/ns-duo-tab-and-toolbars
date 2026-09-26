import { View } from '@nativescript/core';

/**
 * Keeps a controller-backed view (TabView, Frame) the size of its native container.
 *
 * @nativescript/core leaves the native frame of these views to UIKit, and UIKit sizes a
 * controller's view from UIScreen.main when it is created. On iPhone Duo UIScreen.main is always
 * the outer display, so an app launched on the inner display gets an outer-display-sized tab bar
 * controller, and nothing resizes it because it is not the window's root controller.
 */
export function fillNativeContainer(view: View): void {
  if (!__APPLE__) {
    return;
  }
  const native = view.nativeViewProtected as UIView | undefined;
  const container = native?.superview;
  if (!native || !container) {
    return;
  }
  native.frame = container.bounds;
  native.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
}
