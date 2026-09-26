import { ActionBar, ActionItem } from '@nativescript/core';

export type DuoBarPriority = 'high' | 'standard' | 'low';
export type DuoBarAxis = 'automatic' | 'horizontalOnly' | 'verticalPreferred';

/** Optional ActionItem attributes read when its native bar button item is built. */
export interface DuoBarItemOptions {
  /** Which items survive longest before moving to the overflow menu. */
  duoPriority?: DuoBarPriority;
  duoAxis?: DuoBarAxis;
}

/**
 * iPhone Duo presents bar items vertically, horizontally, or in an overflow menu, and only an
 * item with both an image and a title works in all three. Core builds image-only items from
 * `icon`, so add the title (and the Duo placement hints) as each native item is created.
 */
export function enableDuoBarItems(): void {
  if (!__APPLE__) {
    return;
  }
  const prototype = ActionBar.prototype as unknown as {
    createBarButtonItem(item: ActionItem): UIBarButtonItem;
  };
  const createBarButtonItem = prototype.createBarButtonItem;

  prototype.createBarButtonItem = function (item: ActionItem & DuoBarItemOptions) {
    const barItem = createBarButtonItem.call(this, item) as UIBarButtonItem;
    if (!barItem) {
      return barItem;
    }
    if (item.text && !barItem.customView) {
      barItem.title = item.text;
    }
    if (barItem.respondsToSelector('setVisibilityPriority:')) {
      if (item.duoPriority === 'high') {
        barItem.visibilityPriority = UIBarButtonItemVisibilityPriorityHigh;
      } else if (item.duoPriority === 'low') {
        barItem.visibilityPriority = UIBarButtonItemVisibilityPriorityLow;
      }
      if (item.duoAxis === 'horizontalOnly') {
        barItem.axisBehavior = UIBarButtonItemAxisBehavior.HorizontalOnly;
      } else if (item.duoAxis === 'verticalPreferred') {
        barItem.axisBehavior = UIBarButtonItemAxisBehavior.VerticalPreferred;
      }
    }
    return barItem;
  };
}
