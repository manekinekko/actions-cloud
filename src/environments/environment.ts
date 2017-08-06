// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyAwMND1TJ-dzM4dtEpaplGiSvTEaojxeFE",
    authDomain: "project-2966895523221308821.firebaseapp.com",
    databaseURL: "https://project-2966895523221308821.firebaseio.com",
    projectId: "project-2966895523221308821",
    storageBucket: "project-2966895523221308821.appspot.com",
    messagingSenderId: "571506926720"
  },
  scopes: [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/cloudplatformprojects",
    "https://www.googleapis.com/auth/cloudfunctions",
    "https://www.googleapis.com/auth/cloud-billing",
    "https://www.googleapis.com/auth/iam",
    "https://www.googleapis.com/auth/service.management"
  ]
};
