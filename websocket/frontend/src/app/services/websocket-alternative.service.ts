import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { NotificationMessage } from '../models/data-entity.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketAlternativeService {
  private client: Client | null = null;
  private readonly wsUrl = 'http://localhost:8080/websocket'; // Endpoint alternativo
  
  private notificationsSubject = new BehaviorSubject<NotificationMessage | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public notifications$ = this.notificationsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  connect(): void {
    if (this.client?.connected) {
      console.log('WebSocket alternativo já está conectado');
      return;
    }

    console.log(`🔄 Conectando ao WebSocket alternativo: ${this.wsUrl}`);
    
    this.client = new Client({
      webSocketFactory: () => {
        console.log('🏭 Criando SockJS connection (alternativo)...');
        return new SockJS(this.wsUrl);
      },
      debug: (str) => console.log('🔍 STOMP Alt:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: (frame) => {
        this.ngZone.run(() => {
          console.log('✅ WebSocket alternativo conectado!', frame);
          this.connectionStatusSubject.next(true);
          this.subscribeToNotifications();
        });
      },
      
      onStompError: (frame) => {
        this.ngZone.run(() => {
          console.error('❌ Erro STOMP alternativo:', frame);
          this.connectionStatusSubject.next(false);
        });
      },
      
      onWebSocketError: (error) => {
        this.ngZone.run(() => {
          console.error('❌ Erro WebSocket alternativo:', error);
          this.connectionStatusSubject.next(false);
        });
      }
    });

    this.client.activate();
  }

  private subscribeToNotifications(): void {
    if (!this.client?.connected) return;

    this.client.subscribe('/topic/notifications', (message) => {
      this.ngZone.run(() => {
        try {
          const notification: NotificationMessage = JSON.parse(message.body);
          console.log('📨 Notificação alternativa:', notification);
          this.notificationsSubject.next(notification);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem alternativa:', error);
        }
      });
    });
  }

  sendTestMessage(message: string): void {
    if (!this.client?.connected) {
      console.error('❌ WebSocket alternativo não conectado');
      return;
    }

    this.client.publish({
      destination: '/app/test',
      body: JSON.stringify({ message })
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connectionStatusSubject.next(false);
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}