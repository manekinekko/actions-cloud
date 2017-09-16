export const environment = {
  production: true,
  firebase: {
    apiKey: "AIzaSyAxLYxpqFK8HC1M9_PwaW9hXKz51xJI1E0",
    authDomain: "actions-cloud.firebaseapp.com",
    databaseURL: "https://actions-cloud.firebaseio.com",
    projectId: "actions-cloud",
    storageBucket: "actions-cloud.appspot.com",
    messagingSenderId: "498726315028"
  },
  scopes: {
    google: [
      {
        name: "https://www.googleapis.com/auth/cloud-platform",
        description:
          "View and manage your data across Google Cloud Platform services"
      }
    ],
    github: [
      {
        name: "user",
        description: "Grants read/write access to profile info only. Note that this scope includes user:email and user:follow."
      },
      {
        name: "repo",
        description: "Grants read/write access to code, commit statuses, invitations, collaborators, adding team memberships, and deployment statuses for public and private repositories and organizations."
      }
    ]
  }
};
