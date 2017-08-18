import { NotifierService } from './notifier.service';
import { Observable } from 'rxjs/Observable';
import { Injectable } from "@angular/core";
import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from "firebase";
import { OperationType } from "./gcp.types";
import 'rxjs/add/operator/take';

@Injectable()
export class SessionService {

  constructor(
    public db: AngularFireDatabase,
    public notifier: NotifierService
  ) { }

  checkBetaAccess(): Promise<boolean> {
    const baEmail = (localStorage.getItem(`ba.email`) || '').trim();
    const baToken = (localStorage.getItem(`ba.token`) || '').trim();

    return new Promise( (resolve, reject) => {
      if (baEmail && baToken) {
        this.db.object(`/ba/` + baToken)
          .take(1)
          .subscribe( async (data) => {

            if (data && data.email === baEmail) {
              this.notifier.notify(null, false, false, null, "Congrats! You are now a beta tester.", 2000);
              await this.db.object(`/ba/` + baToken).update({
                "ua": navigator.userAgent,
                "lastUsed": new Date()
              });
              resolve(true);
            }
            else {
              this.notifier.notify(null, false, false, {message: "Wrong Beta Access Code detected."}, null, 2000);
              resolve(false);
            }
          });
      }
      else {
        resolve(false);
      }
    });
  }

  getAccessToken(key) {
    return localStorage.getItem(`${key}.access-token`);
  }

  setAccessToken(key, value) {
    if (value === null) {
      localStorage.removeItem(`${key}.access-token`);
    }
    else {
      localStorage.setItem(`${key}.access-token`, value);
    }
  }

  setUserInfo(key: string, entity?: any) {
    if (entity) {
      localStorage.setItem(`${key}.user-info`, JSON.stringify(entity));
    }
    else {
      localStorage.removeItem(`${key}.user-info`);
    }
  }

  getUserInfo(key: string) {
    if (this.getAccessToken(key)) {
      return JSON.parse(localStorage.getItem(`${key}.user-info`));
    }
    else {
      localStorage.removeItem(`${key}.user-info`);
      return null;
    }
  }

  saveOperation(key: string, operation: OperationType, entity: any) {
    const ope = this.restoreOperation(key);
    ope[operation] = entity;
    localStorage.setItem(`${key}.operation-steps`, JSON.stringify(ope));
  }

  restoreOperation<T>(key: string): T {
    return JSON.parse(localStorage.getItem(`${key}.operation-steps`) || "{}");
  }

}
