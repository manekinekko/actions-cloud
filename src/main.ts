import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

(async() => {
  await platformBrowserDynamic().bootstrapModule(AppModule);
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/assets/sw.js");
    } catch (e) {
      console.warn("cannot register ServiceWorker");
    }
  }
})();
