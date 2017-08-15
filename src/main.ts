import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

import * as firebase from "firebase/app";

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

  // make sure to call this AFTER angular bootstraps!
  // tell Firebase not to store the auth info, we'll take care of that.
  await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  
})();



// const oReq = new XMLHttpRequest();
// oReq.open("GET", "https://firebasestorage.googleapis.com/v0/b/project-2966895523221308821.appspot.com/o/actions-on-google-project-template-master.zip?alt=media&token=dea4920d-9369-4ba4-879c-1a17a66c9d31", true);
// oReq.responseType = "blob";

// oReq.onload = function(oEvent) {
//   const blob = oReq.response;
//   console.log(blob);
// };

// oReq.send();
