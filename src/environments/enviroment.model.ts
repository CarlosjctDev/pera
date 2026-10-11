import { appName } from "@app/app-name";

export interface Environment {
  production: boolean;
  appName: typeof appName;
  appVersion: string;  
}