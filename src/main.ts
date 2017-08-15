import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

import * as firebase from "firebase/app";

if (environment.production) {
  enableProdMode();
}

(async () => {
  
  await platformBrowserDynamic().bootstrapModule(AppModule);

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/assets/sw.js");
    } catch (e) {
      console.warn("cannot register ServiceWorker");
    }
  }

  // make sure to call this AFTER angular bootstraps!
  // tell Firebase not to store the auth info, we'll take care of that.
  // await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  
})();
