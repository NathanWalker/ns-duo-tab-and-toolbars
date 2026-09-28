import { View } from '@nativescript/core';
import type { FoldSnapListener } from './fold-snap';

/** The demo only renders on a device with a hinge, which this app treats as iOS only. */
export class FoldSnap {
  constructor(_track: View, _knob: View, _listener: FoldSnapListener) {}

  relayout(): void {}

  dispose(): void {}
}
