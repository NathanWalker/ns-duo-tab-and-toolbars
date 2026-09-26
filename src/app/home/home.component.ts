import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA, inject } from '@angular/core';
import { PageRouterOutlet, RouterExtensions, TabViewDirective, TabViewItemDirective } from '@nativescript/angular';
import { EventData, SelectedIndexChangedEventData, TabView } from '@nativescript/core';
import { DuoService } from '../duo/duo.service';
import { fillNativeContainer } from '../duo/fill-container';
import { haptics } from '../duo/haptics';

const TABS = [
  { outlet: 'pioneersTab', path: 'pioneers' },
  { outlet: 'bookmarksTab', path: 'bookmarks' },
  { outlet: 'hingeTab', path: 'hinge' },
  { outlet: 'searchTab', path: 'search' },
];

/** The tab bar: a native UITabBarController whose tabs are each a navigation stack. */
@Component({
  selector: 'ns-home',
  templateUrl: './home.component.html',
  imports: [PageRouterOutlet, TabViewDirective, TabViewItemDirective],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly router = inject(RouterExtensions);
  private readonly duo = inject(DuoService);
  private readonly started = new Set<string>();
  private tabView: TabView | null = null;

  onTabsLoaded(args: EventData): void {
    this.tabView = args.object as TabView;
    this.duo.attach(this.tabView);
    fillNativeContainer(this.tabView);
    this.showTab(this.tabView.selectedIndex || 0);
    if (__APPLE__) {
      const controller = this.tabView.ios as UITabBarController;
      // iOS 27: the search tab gets the prominent treatment in the bar.
      if (controller.respondsToSelector('setProminentTabIdentifier:animated:')) {
        controller.setProminentTabIdentifierAnimated('3', false);
      }
    }
  }

  onTabChanged(args: SelectedIndexChangedEventData): void {
    if (args.oldIndex !== undefined && args.oldIndex >= 0) {
      haptics.tick();
    }
    this.showTab(args.newIndex);
  }

  /** Tabs navigate on first selection so untouched tabs cost nothing. */
  private showTab(index: number): void {
    const tab = TABS[index];
    if (!tab || this.started.has(tab.outlet)) {
      return;
    }
    this.started.add(tab.outlet);
    this.router.navigate(['/home', { outlets: { [tab.outlet]: [tab.path] } }], { animated: false });
  }
}
