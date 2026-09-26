import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, computed, effect, inject, input, output, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { EventData, Page, ScrollView, Utils } from '@nativescript/core';
import { NToolbar, ToolbarItem, ToolbarItemTapEventData } from '@nstudio/nativescript-toolbar';
import { haptics } from '../duo/haptics';
import { Pioneer, PioneerSort } from './pioneer';
import { PioneersService, lifespan } from './pioneers.service';

/**
 * A pioneer's profile with a native UIToolbar docked beneath it. Used as the pushed detail
 * page's body and, with room for two panes, inline beside the list.
 */
@Component({
  selector: 'ns-pioneer-panel',
  templateUrl: './pioneer-panel.component.html',
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PioneerPanelComponent {
  readonly pioneer = input.required<Pioneer>();
  /** Emits the neighbour chosen with the previous/next toolbar items. */
  readonly pioneerChange = output<number>();

  readonly people = inject(PioneersService);
  private readonly page = inject(Page);
  // The toolbar's loaded event fires while the view is still being built, before inputs are set,
  // so items are applied from the effect once both the toolbar and the pioneer are available.
  private readonly toolbar = signal<NToolbar | null>(null);
  private scroll: ScrollView | null = null;

  readonly meta = computed(() => `${this.pioneer().field} · ${this.pioneer().nationality} · ${lifespan(this.pioneer())}`);

  constructor() {
    effect(() => {
      const toolbar = this.toolbar();
      const pioneer = this.pioneer();
      this.people.bookmarked();
      this.people.sort();
      if (toolbar) {
        this.applyItems(toolbar, pioneer);
      }
      this.scroll?.scrollToVerticalOffset(0, false);
    });
  }

  onScrollLoaded(args: EventData): void {
    this.scroll = args.object as ScrollView;
  }

  onToolbarLoaded(args: EventData): void {
    this.toolbar.set(args.object as NToolbar);
  }

  onToolbarTap(args: ToolbarItemTapEventData): void {
    const id = this.pioneer().id;
    switch (args.data.item.id) {
      case 'previous':
      case 'next': {
        const neighbour = this.people.neighbours(id)[args.data.item.id];
        if (neighbour) {
          haptics.tick();
          this.pioneerChange.emit(neighbour.id);
        }
        break;
      }
      case 'bookmark':
        haptics.tap();
        this.people.toggleBookmark(id);
        break;
      case 'share':
        this.share(args.data.nativeItem);
        break;
    }
  }

  private applyItems(toolbar: NToolbar, pioneer: Pioneer): void {
    const { previous, next } = this.people.neighbours(pioneer.id);
    const bookmarked = this.people.isBookmarked(pioneer.id);
    const items: ToolbarItem[] = [
      { id: 'previous', systemImage: 'chevron.up', enabled: !!previous, accessibilityIdentifier: 'previous' },
      { systemItem: 'fixedSpace', width: 12 },
      { id: 'next', systemImage: 'chevron.down', enabled: !!next, accessibilityIdentifier: 'next' },
      { systemItem: 'flexibleSpace' },
      { id: 'bookmark', systemImage: bookmarked ? 'bookmark.fill' : 'bookmark', tintColor: bookmarked ? pioneer.tint : undefined, symbolAnimationEnabled: true },
      { systemItem: 'fixedSpace', width: 12 },
      { id: 'share', systemItem: 'action' },
      { systemItem: 'fixedSpace', width: 12 },
      { id: 'more', systemImage: 'ellipsis.circle', menu: __APPLE__ ? this.moreMenu(pioneer) : undefined },
    ];
    toolbar.setItems(items, true);
  }

  private moreMenu(pioneer: Pioneer): UIMenu {
    const open = UIAction.actionWithTitleImageIdentifierHandler('Read on Wikipedia', UIImage.systemImageNamed('safari'), null, () =>
      Utils.openUrl(pioneer.wikipedia),
    );
    const copy = UIAction.actionWithTitleImageIdentifierHandler('Copy name', UIImage.systemImageNamed('doc.on.doc'), null, () => {
      UIPasteboard.generalPasteboard.string = pioneer.name;
      haptics.tap();
    });
    const sorts: [PioneerSort, string, string][] = [
      ['curated', 'Curated order', 'sparkles'],
      ['name', 'By name', 'textformat.abc'],
      ['era', 'By era', 'calendar'],
    ];
    const sortMenu = UIDeferredMenuElement.elementWithUncachedProvider((completion) => {
      const actions = sorts.map(([sort, title, symbol]) => {
        const action = UIAction.actionWithTitleImageIdentifierHandler(title, UIImage.systemImageNamed(symbol), null, () => {
          haptics.tick();
          this.people.sort.set(sort);
        });
        action.state = this.people.sort() === sort ? UIMenuElementState.On : UIMenuElementState.Off;
        return action;
      });
      completion([UIMenu.menuWithTitleImageIdentifierOptionsChildren('Sort pioneers', null, null, UIMenuOptions.DisplayInline, actions as any)] as any);
    });
    return UIMenu.menuWithTitleChildren('', [open, copy, sortMenu] as any);
  }

  private share(nativeItem: UIBarButtonItem): void {
    if (!__APPLE__) {
      return;
    }
    const pioneer = this.pioneer();
    const controller = UIActivityViewController.alloc().initWithActivityItemsApplicationActivities(
      [`${pioneer.name} — ${pioneer.summary}`, NSURL.URLWithString(pioneer.wikipedia)] as any,
      null,
    );
    // Regular widths present a popover, which needs an anchor; compact widths ignore it.
    const popover = controller.popoverPresentationController;
    if (popover) {
      popover.barButtonItem = nativeItem;
    }
    (this.page.ios as UIViewController).presentViewControllerAnimatedCompletion(controller, true, null);
  }
}
