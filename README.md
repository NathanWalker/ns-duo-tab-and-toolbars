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
| `e2e` | The e2e suite: `e2e.config.ts`, `tests/*.e2e.ts`, and the `fold()` fixture in `tests/duo.ts` |
| `src/app/duo` | Hinge tracking (`hinge-tracker.ios.ts`), fold and bar-edge signals (`duo.service.ts`), iOS 27.1 typings (`uikit-duo.d.ts`), and the Liquid Glass view |

`src/app/duo/uikit-duo.d.ts` declares the iOS 27.1 classes that `@nativescript/types` 9.1 does not have yet (`UIHingeInteraction`, `UIViewReservedRegion`, `UIVerticalBarEdge`, `UIArrangementViewController`, plus the iOS 27 `UITabBarController` additions). Delete it once the published types catch up.

## Core support for the Duo

The app runs on core from [NativeScript/NativeScript#11438](https://github.com/NativeScript/NativeScript/pull/11438), which it also serves to validate. `UIScreen.main` on the Duo is always the outer display, and the PR fixes the places where core assumed otherwise:

- A `TabView` or `Frame` hosted in a NativeScript view is laid out from its layout slot. Without this, a `TabView` created while the app sits on the inner display stays outer-display-sized.
- `Screen.mainScreen` reports the size of the display the window is on.
- `ActionItem`s keep their `text` as the title next to an `icon`, so the vertical bar's overflow menu can list them, and accept `ios.visibilityPriority` and `ios.axisBehavior` (iOS 27.1).

Duo problems found here are fixed on that PR rather than worked around in the app.

## Run it

Requires Xcode 27.1 with the iPhone Duo simulator (it lives in Device Hub) and Node 22+.

```bash
npm install
ns run ios --device "iPhone Duo"
```

Fold and unfold with the posture buttons at the bottom of the Device Hub window. Android builds, but the Duo features are iOS only; on any device without a hinge the Hinge tab says so and the rest of the app behaves like a regular phone.

## End-to-end tests

`e2e/` is an [e2e](https://tester.army/e2e) suite (TesterArmy's open source agentic test runner) that drives the app on the iPhone Duo simulator through `@e2e-dev/mobile`. Tests mix plain-English agent steps (`agent.act`, `agent.assert`, `agent.extract`) with exact locator checks, and a `fold()` fixture changes the hinge pose with [agent-device](https://github.com/callstack/agent-device)'s `fold` command, so the suite covers the closed outer display and the half-open two-pane layout.

```bash
cd e2e && npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env   # agent steps use Claude Sonnet 5.5; E2E_MODEL picks another
cd .. && npm run e2e:build                    # the suite installs this simulator build
npm run e2e
```

Start with the Duo booted and folded shut. Passing `agent.act` steps are cached in `e2e/.e2e/cache` and replay without a model call; `npm run e2e -- --no-cache` makes the agent drive every step again. The project registers `e2e mcp` in `.mcp.json` and ships the e2e skill in `.claude/skills/e2e`, so a coding agent here can explore the live app and write new tests.

## Stack

NativeScript 9.1 (core from [NativeScript/NativeScript#11438](https://github.com/NativeScript/NativeScript/pull/11438)) · Angular 22, zoneless with signals · Vite · `@nstudio/nativescript-toolbar` · Tailwind CSS
