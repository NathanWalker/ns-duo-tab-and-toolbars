import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeScriptCommonModule, RouterExtensions } from '@nativescript/angular';
import { Page } from '@nativescript/core';
import { DuoService } from '../duo/duo.service';
import { PioneerPanelComponent } from './pioneer-panel.component';
import { PioneersService } from './pioneers.service';

/** Pushed detail page; the toolbar takes the tab bar's place at the bottom while it is up. */
@Component({
  selector: 'ns-pioneer-detail',
  templateUrl: './pioneer-detail.component.html',
  imports: [NativeScriptCommonModule, PioneerPanelComponent],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PioneerDetailComponent {
  readonly people = inject(PioneersService);
  private readonly duo = inject(DuoService);
  private readonly router = inject(RouterExtensions);
  private readonly page = inject(Page);

  readonly id = signal(+inject(ActivatedRoute).snapshot.params['id']);
  readonly pioneer = computed(() => this.people.byId(this.id()));

  constructor() {
    if (__APPLE__) {
      (this.page.ios as UIViewController).hidesBottomBarWhenPushed = true;
    }
    // Unfolding while this page is up: the list page now has room to show it beside itself.
    effect(() => {
      if (this.duo.twoPane() && this.page.frame?.currentPage === this.page) {
        this.people.selectedId.set(this.id());
        this.router.back();
      }
    });
  }
}
