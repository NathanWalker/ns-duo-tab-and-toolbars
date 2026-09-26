import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  registerElement,
  runNativeScriptAngularApp,
} from '@nativescript/angular';
import { provideZonelessChangeDetection } from '@angular/core';
import { withInterceptorsFromDi } from '@angular/common/http';
import { TouchManager } from '@nativescript/core';
import { NToolbar } from '@nstudio/nativescript-toolbar';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { enableDuoBarItems } from './app/duo/duo-bars';
import { GlassView } from './app/duo/glass-view';

registerElement('NToolbar', () => NToolbar);
registerElement('Glass', () => GlassView);
enableDuoBarItems();
TouchManager.enableGlobalTapAnimations = true;

runNativeScriptAngularApp({
  appModuleBootstrap: () => {
    return bootstrapApplication(AppComponent, {
      providers: [
        provideNativeScriptHttpClient(withInterceptorsFromDi()),
        provideNativeScriptRouter(routes),
        provideZonelessChangeDetection(),
      ],
    });
  },
});
