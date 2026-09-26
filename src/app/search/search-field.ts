import { Page } from '@nativescript/core';

@NativeClass()
class SearchResultsUpdater extends NSObject implements UISearchResultsUpdating {
  static ObjCProtocols = [UISearchResultsUpdating];
  onText: ((text: string) => void) | null = null;

  updateSearchResultsForSearchController(searchController: UISearchController): void {
    this.onText?.(searchController.searchBar.text ?? '');
  }
}

const updaters = new WeakMap<Page, SearchResultsUpdater>();

/**
 * Attaches a UISearchController to the page's navigation item so the system places the field:
 * integrated into the bottom bar on iPhone (iOS 26+), in the vertical bar on iPhone Duo.
 */
export function installSearchField(page: Page, placeholder: string, onText: (text: string) => void): void {
  if (!__APPLE__ || updaters.has(page)) {
    return;
  }
  const controller = page.ios as UIViewController;
  const updater = SearchResultsUpdater.new() as SearchResultsUpdater;
  updater.onText = onText;
  updaters.set(page, updater);

  const search = UISearchController.alloc().initWithSearchResultsController(null);
  search.searchResultsUpdater = updater;
  search.obscuresBackgroundDuringPresentation = false;
  search.hidesNavigationBarDuringPresentation = false;
  search.searchBar.placeholder = placeholder;
  search.searchBar.autocapitalizationType = UITextAutocapitalizationType.None;

  const item = controller.navigationItem;
  item.hidesSearchBarWhenScrolling = false;
  if (item.respondsToSelector('setPreferredSearchBarPlacement:')) {
    item.preferredSearchBarPlacement = UINavigationItemSearchBarPlacement.Integrated;
  }
  item.searchController = search;
}
