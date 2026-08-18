export interface GeotabCredentials {
  username?: string;
  password?: string;
  database?: string;
  server?: string;
  environment?: 'sandbox' | 'test' | 'production' | string;
}

export interface GeotabAuthResult {
  sessionId: string;
  server: string;
  database: string;
  userName: string;
  expiresAt: Date;
}

export interface GeotabDevice {
  id: string;
  name?: string;
  serialNumber?: string;
  vin?: string;
  licensePlate?: string;
  deviceType?: string;
  productId?: number;
  comment?: string;
  imei?: string;
}

export interface GeotabLogRecord {
  id?: string;
  device?: { id: string };
  dateTime: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h in Geotab LogRecord
}

export interface GeotabStatusData {
  id?: string;
  device?: { id: string };
  dateTime: string;
  diagnostic?: { id: string };
  data: number; // raw value
}

export interface GeotabExceptionEvent {
  id?: string;
  device?: { id: string };
  rule?: { id: string; name?: string };
  activeFrom: string;
  activeTo?: string;
  driver?: { id: string };
}

export interface GeotabFaultData {
  id?: string;
  device?: { id: string };
  dateTime: string;
  failureModeCode?: number;
  faultState?: string;
  amberWarningLamp?: boolean;
}

export interface GeotabFeedResult<T> {
  data: T[];
  toVersion: string;
}
