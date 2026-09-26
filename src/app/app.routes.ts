import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PioneersComponent } from './pioneers/pioneers.component';
import { PioneerDetailComponent } from './pioneers/pioneer-detail.component';
import { BookmarksComponent } from './bookmarks/bookmarks.component';
import { HingeComponent } from './hinge/hinge.component';
import { SearchComponent } from './search/search.component';

/** Each tab is a named outlet, so a detail page pushes inside the tab it was opened from. */
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: 'pioneers', component: PioneersComponent, outlet: 'pioneersTab' },
      { path: 'pioneer/:id', component: PioneerDetailComponent, outlet: 'pioneersTab' },
      { path: 'bookmarks', component: BookmarksComponent, outlet: 'bookmarksTab' },
      { path: 'pioneer/:id', component: PioneerDetailComponent, outlet: 'bookmarksTab' },
      { path: 'hinge', component: HingeComponent, outlet: 'hingeTab' },
      { path: 'search', component: SearchComponent, outlet: 'searchTab' },
      { path: 'pioneer/:id', component: PioneerDetailComponent, outlet: 'searchTab' },
    ],
  },
];
