import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, computed, effect, inject } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DuoService } from '../duo/duo.service';
import { haptics } from '../duo/haptics';

const TRACK_WIDTH = 200;

interface Readout {
  label: string;
  api: string;
  value: string;
}

/** Everything the device reports about its hinge and fold, as it changes. */
@Component({
  selector: 'ns-hinge',
  templateUrl: './hinge.component.html',
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HingeComponent {
  readonly duo = inject(DuoService);

  readonly degreesText = computed(() => {
    const degrees = this.duo.hingeDegrees();
    return degrees === null ? '—' : `${degrees}°`;
  });

  readonly statusText = computed(() => {
    const bar = this.duo.barEdge() === 'none' ? 'along the bottom' : `in the vertical bar on the ${this.duo.barEdge()} edge`;
    switch (this.duo.pose()) {
      case 'closed':
        return `Folded shut, on the outer display. The tab bar and bar items sit ${bar}.`;
      case 'folded':
        return this.duo.fold()?.axis === 'horizontal'
          ? `Half open on a table. Content divides above and below the fold, with the bars ${bar}.`
          : `Half open like a book. Two panes sit either side of the fold, with the bars ${bar}.`;
      case 'open':
        return `Fully open on the inner display. Two panes share the screen and the bars sit ${bar}.`;
      default:
        return 'Waiting for the hinge.';
    }
  });

  /** The lid swings on its hinge edge: flat at 180°, edge-on at 90°, shut at 0°. */
  readonly lidRotation = computed(() => {
    const degrees = this.duo.hingeDegrees() ?? 180;
    return -(180 - Math.min(180, Math.max(0, degrees)));
  });

  readonly fillWidth = computed(() => {
    const openness = Math.min(1, (this.duo.hingeAngle() ?? 0) / Math.PI);
    return Math.max(4, Math.round(TRACK_WIDTH * openness));
  });

  readonly readouts = computed<Readout[]>(() => {
    const angle = this.duo.hingeAngle();
    const fold = this.duo.fold();
    const size = this.duo.rootSize();
    const edge = this.duo.barEdge();
    return [
      { label: 'Hinge status', api: 'UIHinge.status', value: this.duo.poseLabel() },
      { label: 'Hinge angle', api: 'UIHinge.angle', value: angle === null ? '—' : `${angle.toFixed(3)} rad` },
      { label: 'Vertical bar edge', api: 'UITraitCollection.verticalBarEdge', value: edge === 'none' ? 'Unspecified' : edge[0].toUpperCase() + edge.slice(1) },
      { label: 'Fold region', api: 'UIViewReservedRegion (division)', value: fold ? `${fold.axis} · x ${Math.round(fold.x)} y ${Math.round(fold.y)} · ${Math.round(fold.width)}×${Math.round(fold.height)}` : 'None active' },
      { label: 'Window', api: 'Root view bounds', value: `${Math.round(size.width)} × ${Math.round(size.height)} pt` },
    ];
  });

  constructor() {
    let last = this.duo.pose();
    effect(() => {
      const pose = this.duo.pose();
      if (pose !== last) {
        last = pose;
        haptics.tap();
      }
    });
  }
}
