import { View } from '@nativescript/core';
import type { FoldSnapListener, SnapSide } from './fold-snap';

/** The spring in SwiftUI's terms: `.spring(response: 0.5, dampingFraction: 0.7)`. */
const RESPONSE = 0.5;
const DAMPING_FRACTION = 0.7;
const STIFFNESS = (2 * Math.PI / RESPONSE) ** 2;
const DAMPING = 2 * DAMPING_FRACTION * Math.sqrt(STIFFNESS);
/** UIScrollView's normal deceleration rate, used to project where a fling would coast to. */
const DECELERATION_RATE = 0.998;
/** UIScrollView's rubber-band coefficient. */
const RUBBER_BAND = 0.55;
/** Extra reach around the knob for a grab. */
const GRAB_SLOP = 12;

@NativeClass()
class GestureTarget extends NSObject {
  static ObjCExposedMethods = {
    press: { returns: interop.types.void, params: [UILongPressGestureRecognizer] },
    pan: { returns: interop.types.void, params: [UIPanGestureRecognizer] },
    tick: { returns: interop.types.void, params: [CADisplayLink] },
  };
  owner: WeakRef<FoldSnap> | null = null;

  press(recognizer: UILongPressGestureRecognizer): void {
    this.owner?.deref()?.onPress(recognizer);
  }

  pan(recognizer: UIPanGestureRecognizer): void {
    this.owner?.deref()?.onPan(recognizer);
  }

  tick(link: CADisplayLink): void {
    this.owner?.deref()?.onFrame(link);
  }
}

@NativeClass()
class GestureDelegate extends NSObject implements UIGestureRecognizerDelegate {
  static ObjCProtocols = [UIGestureRecognizerDelegate];
  owner: WeakRef<FoldSnap> | null = null;

  gestureRecognizerShouldBegin(recognizer: UIGestureRecognizer): boolean {
    return this.owner?.deref()?.shouldBegin(recognizer) ?? false;
  }

  // The press, the pan and the enclosing scroll view's pan all watch the same touch.
  gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer(): boolean {
    return true;
  }
}

export class FoldSnap {
  private readonly track: WeakRef<View>;
  private readonly knob: WeakRef<View>;
  private readonly target: GestureTarget;
  private readonly delegate: GestureDelegate;
  /** Zero-duration press: a touch landing on a moving knob stops it on touch-down, not 10pt later. */
  private readonly press: UILongPressGestureRecognizer;
  private readonly pan: UIPanGestureRecognizer;
  private readonly link: CADisplayLink;

  /** Knob offset from its leading rest position, in dips. */
  private x = 0;
  private velocity = 0;
  private restX = 0;
  private side: SnapSide = 'leading';
  private held = false;
  private grabX = 0;
  private lastTimestamp = 0;

  constructor(
    track: View,
    knob: View,
    private readonly listener: FoldSnapListener,
  ) {
    this.track = new WeakRef(track);
    this.knob = new WeakRef(knob);
    this.target = GestureTarget.new() as GestureTarget;
    this.target.owner = new WeakRef(this);
    this.delegate = GestureDelegate.new() as GestureDelegate;
    this.delegate.owner = new WeakRef(this);

    const native = track.nativeViewProtected as UIView;
    this.press = UILongPressGestureRecognizer.alloc().initWithTargetAction(this.target, 'press');
    this.press.minimumPressDuration = 0;
    this.press.delegate = this.delegate;
    native.addGestureRecognizer(this.press);
    this.pan = UIPanGestureRecognizer.alloc().initWithTargetAction(this.target, 'pan');
    this.pan.delegate = this.delegate;
    native.addGestureRecognizer(this.pan);

    this.link = CADisplayLink.displayLinkWithTargetSelector(this.target, 'tick');
    this.link.paused = true;
    this.link.addToRunLoopForMode(NSRunLoop.mainRunLoop, NSDefaultRunLoopMode);
    this.link.addToRunLoopForMode(NSRunLoop.mainRunLoop, UITrackingRunLoopMode);
  }

  relayout(): void {
    if (this.link.paused && !this.held) {
      this.restX = this.side === 'leading' ? 0 : this.range();
      this.moveTo(this.restX);
    }
  }

  dispose(): void {
    this.link.invalidate();
    const native = this.track.deref()?.nativeViewProtected as UIView | undefined;
    native?.removeGestureRecognizer(this.press);
    native?.removeGestureRecognizer(this.pan);
    this.target.owner = null;
    this.delegate.owner = null;
  }

  shouldBegin(recognizer: UIGestureRecognizer): boolean {
    const track = this.track.deref()?.nativeViewProtected as UIView | undefined;
    const knob = this.knob.deref()?.nativeViewProtected as UIView | undefined;
    if (!track || !knob) {
      return false;
    }
    if (recognizer === this.press) {
      // A moving knob can be caught anywhere on the track; a resting one has to be grabbed.
      const touch = recognizer.locationInView(track);
      return !this.link.paused || CGRectContainsPoint(CGRectInset(knob.frame, -GRAB_SLOP, -GRAB_SLOP), touch);
    }
    // A vertical swipe starting on the knob scrolls the page instead.
    const velocity = this.pan.velocityInView(track);
    return this.held && Math.abs(velocity.x) > Math.abs(velocity.y);
  }

  onPress(recognizer: UILongPressGestureRecognizer): void {
    switch (recognizer.state) {
      case UIGestureRecognizerState.Began: {
        const interrupted = !this.link.paused;
        this.link.paused = true;
        this.velocity = 0;
        this.held = true;
        this.listener.onGrab(interrupted);
        break;
      }
      case UIGestureRecognizerState.Ended:
      case UIGestureRecognizerState.Cancelled:
      case UIGestureRecognizerState.Failed:
        if (!this.held) {
          break;
        }
        this.held = false;
        // A lift without a drag: the pan never took the touch, so nothing else restarts the spring.
        if (this.pan.state !== UIGestureRecognizerState.Changed && this.pan.state !== UIGestureRecognizerState.Ended) {
          this.release(0);
        }
        break;
    }
  }

  onPan(recognizer: UIPanGestureRecognizer): void {
    const track = this.track.deref()?.nativeViewProtected as UIView | undefined;
    if (!track) {
      return;
    }
    switch (recognizer.state) {
      case UIGestureRecognizerState.Began:
        this.grabX = this.x;
        break;
      case UIGestureRecognizerState.Changed:
        this.moveTo(this.rubberBand(this.grabX + recognizer.translationInView(track).x));
        break;
      case UIGestureRecognizerState.Ended:
      case UIGestureRecognizerState.Cancelled:
        this.held = false;
        this.release(recognizer.velocityInView(track).x);
        break;
    }
  }

  onFrame(link: CADisplayLink): void {
    const dt = this.lastTimestamp ? Math.min(0.05, link.timestamp - this.lastTimestamp) : 1 / 60;
    this.lastTimestamp = link.timestamp;
    // Semi-implicit Euler in fixed substeps keeps a stiff spring stable at any frame rate.
    const steps = 4;
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const acceleration = -STIFFNESS * (this.x - this.restX) - DAMPING * this.velocity;
      this.velocity += acceleration * h;
      this.x += this.velocity * h;
    }
    if (Math.abs(this.x - this.restX) < 0.05 && Math.abs(this.velocity) < 2) {
      this.velocity = 0;
      this.link.paused = true;
      this.moveTo(this.restX);
      this.listener.onRest(this.side);
      return;
    }
    this.moveTo(this.x);
  }

  /** Hands the knob to the spring with the gesture's velocity, aimed where a fling would coast to. */
  private release(velocity: number): void {
    const range = this.range();
    const projected = this.x + ((velocity / 1000) * DECELERATION_RATE) / (1 - DECELERATION_RATE);
    this.side = projected < range / 2 ? 'leading' : 'trailing';
    this.restX = this.side === 'leading' ? 0 : range;
    this.velocity = velocity;
    this.listener.onRelease(velocity, this.side);
    this.lastTimestamp = 0;
    this.link.paused = false;
  }

  /** Distance between the two rest positions, from the native bounds the knob is laid out in. */
  private range(): number {
    const track = this.track.deref()?.nativeViewProtected as UIView | undefined;
    const knob = this.knob.deref()?.nativeViewProtected as UIView | undefined;
    if (!track || !knob) {
      return 0;
    }
    // center ignores the transform, so this is the knob's laid-out inset from the track's edge.
    const inset = knob.center.x - knob.bounds.size.width / 2;
    return Math.max(0, track.bounds.size.width - knob.bounds.size.width - inset * 2);
  }

  /** UIScrollView's curve, with the knob's own width as the dimension so the stretch stays small. */
  private rubberBand(raw: number): number {
    const range = this.range();
    const knob = this.knob.deref()?.nativeViewProtected as UIView | undefined;
    const dimension = Math.max(1, knob?.bounds.size.width ?? 1);
    const give = (overshoot: number) => (1 - 1 / ((overshoot * RUBBER_BAND) / dimension + 1)) * dimension;
    if (raw < 0) {
      return -give(-raw);
    }
    if (raw > range) {
      return range + give(raw - range);
    }
    return raw;
  }

  private moveTo(x: number): void {
    this.x = x;
    const knob = this.knob.deref();
    if (knob) {
      knob.translateX = x;
    }
  }
}
