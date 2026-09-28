# NativeScript on iPhone Duo: native tab bar and toolbars

A [NativeScript](https://nativescript.org) + Angular app. Everything on screen is UIKit: a `UITabBarController` behind NativeScript's `TabView`, `UIToolbar` through [`@nstudio/nativescript-toolbar`](https://plugins.nstudio.io/plugins/toolbar), `UISearchController`, `UIMenu`, and the iOS 27.1 hinge APIs, all driven from TypeScript with no native code in the project.

https://github.com/user-attachments/assets/e0019ef6-7030-47f5-bd7d-2d391a85d694

## What it does on the Duo

- **Vertical bar** – iOS 27.1 moves the tab bar, navigation items and status bar into a vertical bar on the trailing edge of both Duo displays. `TabView` gets that for free; the app reads `UITraitCollection.verticalBarEdge` to know it happened.
- **Two panes on the fold** – with the device open, the Pioneers tab splits list and detail on the physical fold, using `UIViewReservedRegion`'s division region for the exact crease. Folded shut, the list stands alone and detail pushes. Unfold while a detail page is up and it collapses back into the split.
- **Native toolbar** – every pioneer has a `UIToolbar` docked beneath it: previous and next (state-aware), bookmark (tinted, animated symbol), share (`UIActivityViewController`, anchored as a popover in regular widths) and a `UIMenu` with an inline sort section.
- **Hinge tab** – `UIHingeInteraction` streams the hinge angle and status into signals; a small 3D model of the device swings with it, and the readouts show the raw values from UIKit.
- **Interruptible spring** – on the Hinge tab, a knob you can drag, fling and catch mid-flight. A `UIPanGestureRecognizer` hands its velocity to a spring stepped by `CADisplayLink` in the app process, a zero-duration `UILongPressGestureRecognizer` stops it on touch-down, and the track shows the physical fold from `UIViewReservedRegion` (`src/app/duo/fold-snap.ios.ts`).
- **Search tab** – a `UISearchTab` with a `UISearchController` in the navigation item, so the system places the field: integrated into the bar on iPhone, in the vertical bar on the Duo.
- **Sort in the overflow** – the Pioneers list puts its sort options in the navigation bar's iOS 26 overflow menu (`additionalOverflowItems`).

## Where things live

| Path | What |
| --- | --- |
| `src/app/home` | The `TabView` shell: four `page-router-outlet` tabs, prominent search tab, haptics |
| `src/app/pioneers` | List, two-pane split, detail page, and the toolbar panel |
| `src/app/hinge` | The hinge dashboard |
| `src/app/search`, `src/app/bookmarks` | The other two tabs; `search-field.ts` wires `UISearchController` |
| `src/app/duo` | Hinge tracking (`hinge-tracker.ios.ts`), fold and bar-edge signals (`duo.service.ts`), iOS 27.1 typings (`uikit-duo.d.ts`), Liquid Glass view, bar item hints, and `fill-container.ts` |

`src/app/duo/uikit-duo.d.ts` declares the iOS 27.1 classes that `@nativescript/types` 9.1 does not have yet (`UIHingeInteraction`, `UIViewReservedRegion`, `UIVerticalBarEdge`, `UIArrangementViewController`, plus the iOS 27 `UITabBarController` additions). Delete it once the published types catch up.

## A core note for foldables

`UIScreen.main` on the Duo is always the outer display. `@nativescript/core` leaves the native frame of `TabView` and `Frame` to UIKit, and UIKit sizes a controller's view from `UIScreen.main` when it is created, so a `TabView` created while the app sits on the inner display stays outer-display-sized. `src/app/duo/fill-container.ts` pins it to its container with an autoresizing mask; the same idea belongs in core.

## Run it

Requires Xcode 27.1 with the iPhone Duo simulator (it lives in Device Hub) and Node 22+.

```bash
npm install
ns run ios --device "iPhone Duo"
```

Fold and unfold with the posture buttons at the bottom of the Device Hub window. Android builds, but the Duo features are iOS only; on any device without a hinge the Hinge tab says so and the rest of the app behaves like a regular phone.

## Stack

NativeScript 9.1 (core from [NativeScript/NativeScript#11434](https://github.com/NativeScript/NativeScript/pull/11434)) · Angular 22, zoneless with signals · Vite · `@nstudio/nativescript-toolbar` · Tailwind CSS
