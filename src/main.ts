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

console.log(`\n\n\n`);
console.log(`%cYou can reach out to me on twitter @manekinekko if you need an "alpha access": https://twitter.com/@manekinekko`, `padding:2px; color:white; background-color:#FB7073; border-radius:3px; text-shadow: 1px 0px 1px black; `);
console.log(`\n\n\n`);
