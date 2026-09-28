import { View } from '@nativescript/core';

export type SnapSide = 'leading' | 'trailing';

export interface FoldSnapListener {
  /** The finger has the knob; `interrupted` when it was caught while still springing. */
  onGrab(interrupted: boolean): void;
  /** Released with `velocity` dips per second; the spring carries that velocity toward `target`. */
  onRelease(velocity: number, target: SnapSide): void;
  onRest(side: SnapSide): void;
}

/**
 * A knob that can be dragged along a track, flung to either end, and caught at any point while it
 * is still moving. The whole interaction runs in the app process: a UIPanGestureRecognizer moves
 * the knob directly, on release a spring stepped by CADisplayLink takes over from the gesture's
 * velocity, and a touch landing on the track while the knob is moving stops it on touch-down, so
 * every frame's position is known to the code handling the next touch.
 */
export declare class FoldSnap {
  constructor(track: View, knob: View, listener: FoldSnapListener);
  /** Re-seats a resting knob after the track changes width. */
  relayout(): void;
  dispose(): void;
}
