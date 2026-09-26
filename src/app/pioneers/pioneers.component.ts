import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeScriptCommonModule, RouterExtensions } from '@nativescript/angular';
import { EventData, GridLayout, ItemEventData, ListView, Page } from '@nativescript/core';
import { DuoService } from '../duo/duo.service';
import { haptics } from '../duo/haptics';
import { Pioneer, PioneerSort } from './pioneer';
import { PioneerPanelComponent } from './pioneer-panel.component';
import { PioneerRowComponent } from './pioneer-row.component';
import { PioneersService } from './pioneers.service';

@Component({
  selector: 'ns-pioneers',
  templateUrl: './pioneers.component.html',
  imports: [NativeScriptCommonModule, PioneerRowComponent, PioneerPanelComponent],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PioneersComponent {
  readonly people = inject(PioneersService);
  readonly duo = inject(DuoService);
  private readonly router = inject(RouterExtensions);
  private readonly route = inject(ActivatedRoute);
  private readonly page = inject(Page);

  /** The fold crossing this page's content, in its coordinates. */
  private readonly fold = signal<{ x: number; width: number } | null>(null);
  private grid: GridLayout | null = null;
  private list: ListView | null = null;

  readonly twoPane = this.duo.twoPane;

  readonly columns = computed(() => {
    if (!this.twoPane()) {
      return '*';
    }
    const fold = this.fold();
    return fold ? `${Math.round(fold.x)}, ${Math.round(fold.width)}, *` : '2*, 0, 3*';
  });

  constructor() {
    this.page.on(Page.navigatedToEvent, () => this.installSortMenu());
    // Reserved regions are read from the native view, so a change of fold means a re-read.
    effect(() => {
      this.duo.fold();
      this.duo.barEdge();
      this.onLayout();
    });
    effect(() => {
      this.people.selectedId();
      this.people.bookmarked();
      this.list?.refresh();
    });
  }

  onLoaded(args: EventData): void {
    this.grid = args.object as GridLayout;
    this.onLayout();
  }

  onListLoaded(args: EventData): void {
    this.list = args.object as ListView;
  }

  onLayout(): void {
    const grid = this.grid;
    if (!grid) {
      return;
    }
    const fold = this.duo.foldWithin(grid);
    const next = fold?.axis === 'vertical' ? { x: fold.x, width: fold.width } : null;
    if (JSON.stringify(next) !== JSON.stringify(this.fold())) {
      this.fold.set(next);
    }
  }

  onItemTap(args: ItemEventData): void {
    const pioneer = this.people.sorted()[args.index];
    if (!pioneer) {
      return;
    }
    haptics.tick();
    this.open(pioneer);
  }

  private open(pioneer: Pioneer): void {
    this.people.selectedId.set(pioneer.id);
    if (!this.twoPane()) {
      this.router.navigate(['../pioneer', pioneer.id], { relativeTo: this.route });
    }
  }

  /** Sort options live in the navigation bar's overflow menu (iOS 26+). */
  private installSortMenu(): void {
    if (!__APPLE__) {
      return;
    }
    const navigationItem = (this.page.ios as UIViewController).navigationItem;
    if (!navigationItem.respondsToSelector('setAdditionalOverflowItems:')) {
      return;
    }
    const options: [PioneerSort, string, string][] = [
      ['curated', 'Curated order', 'sparkles'],
      ['name', 'Sort by name', 'textformat.abc'],
      ['era', 'Sort by era', 'calendar'],
    ];
    navigationItem.additionalOverflowItems = UIDeferredMenuElement.elementWithUncachedProvider((completion) => {
      completion(
        options.map(([sort, title, symbol]) => {
          const action = UIAction.actionWithTitleImageIdentifierHandler(title, UIImage.systemImageNamed(symbol), null, () => {
            haptics.tick();
            this.people.sort.set(sort);
          });
          action.state = this.people.sort() === sort ? UIMenuElementState.On : UIMenuElementState.Off;
          return action;
        }) as any,
      );
    });
  }
}
