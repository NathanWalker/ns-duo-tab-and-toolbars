import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NativeScriptCommonModule, RouterExtensions } from '@nativescript/angular';
import { EventData, ItemEventData, ListView } from '@nativescript/core';
import { haptics } from '../duo/haptics';
import { PioneerRowComponent } from '../pioneers/pioneer-row.component';
import { PioneersService } from '../pioneers/pioneers.service';

@Component({
  selector: 'ns-bookmarks',
  templateUrl: './bookmarks.component.html',
  imports: [NativeScriptCommonModule, PioneerRowComponent],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookmarksComponent {
  readonly people = inject(PioneersService);
  private readonly router = inject(RouterExtensions);
  private readonly route = inject(ActivatedRoute);
  private list: ListView | null = null;

  constructor() {
    effect(() => {
      this.people.bookmarks();
      this.list?.refresh();
    });
  }

  onListLoaded(args: EventData): void {
    this.list = args.object as ListView;
  }

  onItemTap(args: ItemEventData): void {
    const pioneer = this.people.bookmarks()[args.index];
    if (pioneer) {
      haptics.tick();
      this.router.navigate(['../pioneer', pioneer.id], { relativeTo: this.route });
    }
  }
}
