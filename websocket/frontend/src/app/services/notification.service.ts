import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationMessage } from '../models/data-entity.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = 'http://localhost:8080/api/websocket';
  
  private notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  addNotification(notification: NotificationMessage): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications].slice(0, 50); // Manter apenas 50
    
    this.notificationsSubject.next(updatedNotifications);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }

  markAsRead(): void {
    this.unreadCountSubject.next(0);
  }

  clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  getNotificationHistory(): NotificationMessage[] {
    return this.notificationsSubject.value;
  }

  // API calls para WebSocket via REST
  sendTestNotification(message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/test`, { message });
  }

  forceExternalDataFetch(): Observable<any> {
    return this.http.post(`${this.apiUrl}/force-fetch`, {});
  }

  getWebSocketStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/status`);
  }
}