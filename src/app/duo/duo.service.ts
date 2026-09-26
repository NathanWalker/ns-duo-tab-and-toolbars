import { Injectable, computed, signal } from '@angular/core';
import { View } from '@nativescript/core';
import { DuoBarEdge, DuoFold, DuoPose } from './fold';
import { HingeTracker, foldWithin, trailingOcclusion } from './hinge-tracker';

export type { DuoBarEdge, DuoFold, DuoPose } from './fold';

/** A list or detail pane narrower than this reads badly. */
const MIN_PANE_WIDTH = 300;

/** Live hinge, fold and bar-edge state for the view the service is attached to. */
@Injectable({ providedIn: 'root' })
export class DuoService {
  /** False on any device without a hinge, and on iOS before 27.1. */
  readonly supported = signal(false);
  readonly pose = signal<DuoPose>('unknown');
  /** Radians: 0 closed, π fully open. Streams continuously while the device is being folded. */
  readonly hingeAngle = signal<number | null>(null);
  /** Active fold across the attached root view, in its coordinates. */
  readonly fold = signal<DuoFold | null>(null);
  /** Edge the system draws the vertical bar on; 'none' when bars are horizontal. */
  readonly barEdge = signal<DuoBarEdge>('none');
  /** Native size of the attached root view in dips, refreshed on every layout pass. */
  readonly rootSize = signal<{ width: number; height: number }>({ width: 0, height: 0 });

  readonly hingeDegrees = computed(() => {
    const angle = this.hingeAngle();
    return angle === null ? null : Math.round((angle * 180) / Math.PI);
  });

  /** Room for a list beside a detail pane: split on a top-to-bottom fold, or on width alone. */
  readonly twoPane = computed(() => {
    const { width } = this.rootSize();
    const fold = this.fold();
    if (fold?.axis === 'horizontal') {
      return false;
    }
    if (fold) {
      return fold.x >= MIN_PANE_WIDTH && width - fold.x - fold.width >= MIN_PANE_WIDTH;
    }
    return width >= MIN_PANE_WIDTH * 2 + 40;
  });

  readonly poseLabel = computed(() => {
    switch (this.pose()) {
      case 'closed':
        return 'Closed';
      case 'folded':
        return this.fold()?.axis === 'horizontal' ? 'Tabletop' : 'Book';
      case 'open':
        return 'Open';
      default:
        return 'Flat';
    }
  });

  private tracker: HingeTracker | null = null;

  attach(view: View): void {
    this.detach();
    if (!view.nativeViewProtected) {
      return;
    }
    this.tracker = new HingeTracker(view, {
      onHinge: ({ supported, pose, angle }) => {
        this.supported.set(supported);
        this.pose.set(pose);
        this.hingeAngle.set(angle);
      },
      onRegions: (fold, barEdge, size) => {
        if (JSON.stringify(fold) !== JSON.stringify(this.fold())) {
          this.fold.set(fold);
        }
        this.barEdge.set(barEdge);
        const current = this.rootSize();
        if (current.width !== size.width || current.height !== size.height) {
          this.rootSize.set(size);
        }
      },
    });
  }

  detach(): void {
    this.tracker?.dispose();
    this.tracker = null;
  }

  /** The active fold crossing `view`, in that view's own coordinates; null when it lies outside. */
  foldWithin(view: View): DuoFold | null {
    return foldWithin(view);
  }

  /** Width of the strip along `view`'s trailing edge that system chrome covers. */
  trailingOcclusion(view: View): number {
    return trailingOcclusion(view);
  }
}
