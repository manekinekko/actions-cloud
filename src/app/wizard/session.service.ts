import { Injectable } from "@angular/core";
import { OperationType } from "./gcp.types";

@Injectable()
export class SessionService {

  constructor() { }

  setUserInfo(key: string, entity?: any) {
    if (entity) {
      localStorage.setItem(`${key}.user-info`, JSON.stringify(entity));
    }
    else {
      localStorage.removeItem(`${key}.user-info`);
    }
  }

  getUserInfo(key: string) {
    return JSON.parse(localStorage.getItem(`${key}.user-info`));
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
