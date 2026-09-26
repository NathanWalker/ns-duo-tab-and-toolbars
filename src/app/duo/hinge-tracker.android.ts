import { View } from '@nativescript/core';
import { DuoFold } from './fold';
import type { HingeListener } from './hinge-tracker';

/** This app targets iPhone Duo; on Android it reports a device without a hinge. */
export class HingeTracker {
  constructor(_root: View, listener: HingeListener) {
    listener.onHinge({ supported: false, pose: 'unknown', angle: null });
    listener.onRegions(null, 'none', { width: 0, height: 0 });
  }

  dispose(): void {}
}

export function foldWithin(_view: View): DuoFold | null {
  return null;
}

export function trailingOcclusion(_view: View): number {
  return 0;
}
