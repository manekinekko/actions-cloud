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

  checkBetaAccess(opts: {email: string, token: string} = { email: '', token: '' }, isGauard = false): Promise<boolean> {

    if (opts && opts.email && opts.token) {
      localStorage.setItem(`ba.email`, opts.email);
      localStorage.setItem(`ba.token`, opts.token);
    }

    const baEmail = (localStorage.getItem(`ba.email`) || '').trim();
    const baToken = (localStorage.getItem(`ba.token`) || '').trim();

    return new Promise( (resolve, reject) => {
      if (baEmail && baToken) {
        this.db.object(`/ba/` + baToken)
          .take(1)
          .subscribe( async (data) => {

            if (data && data.email === baEmail) {
              
              try {

                await this.db.object(`/ba/` + baToken).update({
                  "ua": navigator.userAgent,
                  "lastUsed": new Date()
                });

                if (localStorage.getItem(`ba.lastUsed`) === null) {
                  this.notifier.notify(null, false, false, {message: "Congrats! You are now a beta tester."}, null, 4000);
                }

                localStorage.setItem(`ba.lastUsed`, `${+new Date()}`);
                resolve(true);

              } catch (error) {
                this.notifier.notify(null, false, false, {message: "Error detected. Report your logs to @manekinekko."});
                console.error(`==================== report the error below this line ====================`);
                console.error(error);
                console.error(`==================== report the error above this line ====================`);
                
                resolve(false);
              }
            }
            else {
              this.notifier.notify(null, false, false, {message: "Wrong Beta Access Email detected."}, null, 2000);
              resolve(false);
            }
          }, (error) => {
              if ( error.message.startsWith("permission_denied") ) {
              this.notifier.notify(null, false, false, {message: "Wrong Beta Access Token detected."}, null, 2000);
              }
              else {
                this.notifier.notify(null, false, false, {message: "Error detected. Report your logs to @manekinekko."});
                console.info(`==================== report the error below this line ====================`);
                console.info(error.message);
                console.info(`==================== report the error above this line ====================`);
              }
              
              resolve(false);
          });
      }
      else {
        if (isGauard) {
          this.notifier.notify(null, false, false, {message: "You are not allowed to access this area. Contact @manekinekko for more details."});
        }
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
    if (ope) {
      ope[operation] = entity;
      localStorage.setItem(`${key}.operation-steps`, JSON.stringify(ope));
    }
  }

  restoreOperation<T>(key: string): T {
    const operationsSteps = localStorage.getItem(`${key}.operation-steps`);
    return operationsSteps ? JSON.parse(operationsSteps) : {};
  }

  setGCPProjectId(projectId: string) {
    localStorage.setItem('google.projectId', projectId);
  }

  restoreGCPProjectId(): string {
    return localStorage.getItem('google.projectId') || '';
  }

  remove(key: string) {
    localStorage.removeItem(`${key}`);
  }
}
