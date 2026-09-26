import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, computed, inject, input } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { Pioneer } from './pioneer';
import { PioneersService, lifespan } from './pioneers.service';

@Component({
  selector: 'ns-pioneer-row',
  templateUrl: './pioneer-row.component.html',
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PioneerRowComponent {
  readonly people = inject(PioneersService);
  readonly pioneer = input.required<Pioneer>();
  readonly selected = input(false);
  readonly subtitle = computed(() => `${this.pioneer().field} · ${lifespan(this.pioneer())}`);
  readonly bookmarked = computed(() => this.people.bookmarked().has(this.pioneer().id));
}
