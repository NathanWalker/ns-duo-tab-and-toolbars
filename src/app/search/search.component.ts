import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeScriptCommonModule, RouterExtensions } from '@nativescript/angular';
import { EventData, ItemEventData, ListView, Page } from '@nativescript/core';
import { haptics } from '../duo/haptics';
import { PioneerRowComponent } from '../pioneers/pioneer-row.component';
import { PioneersService } from '../pioneers/pioneers.service';
import { installSearchField } from './search-field';

/** The search tab: a system search field in the navigation item, results in the page. */
@Component({
  selector: 'ns-search',
  templateUrl: './search.component.html',
  imports: [NativeScriptCommonModule, PioneerRowComponent],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  readonly people = inject(PioneersService);
  private readonly router = inject(RouterExtensions);
  private readonly route = inject(ActivatedRoute);
  private readonly page = inject(Page);
  private list: ListView | null = null;

  readonly query = signal('');
  readonly results = computed(() => this.people.search(this.query()));

  constructor() {
    this.page.on(Page.loadedEvent, () => installSearchField(this.page, 'Name, field or work', (text) => this.query.set(text)));
    effect(() => {
      this.results();
      this.people.bookmarked();
      this.list?.refresh();
    });
  }

  onListLoaded(args: EventData): void {
    this.list = args.object as ListView;
  }

  onItemTap(args: ItemEventData): void {
    const pioneer = this.results()[args.index];
    if (pioneer) {
      haptics.tick();
      this.router.navigate(['../pioneer', pioneer.id], { relativeTo: this.route });
    }
  }
}
