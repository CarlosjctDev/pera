import { appName } from '@app/app-name';
import packetJson from '@package';


export const environment = {
  production: true,
  appName: appName,
  appVersion: packetJson.version,  
} as const;