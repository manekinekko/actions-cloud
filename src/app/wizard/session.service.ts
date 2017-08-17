import { Injectable } from "@angular/core";
import { OperationType } from "./gcp.types";

@Injectable()
export class SessionService {

  constructor() { }

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
