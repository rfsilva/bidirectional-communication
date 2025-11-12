export interface DataEntity {
  id?: number;
  name: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
  isExternal?: boolean;
}

export interface NotificationMessage {
  type: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface Stats {
  totalRecords: number;
  externalRecords: number;
  internalRecords: number;
  lastCreatedAt: string;
  activeSSEConnections: number;
}