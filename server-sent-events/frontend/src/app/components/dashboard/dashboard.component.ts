import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { SSEService } from '../../services/sse.service';
import { NotificationService } from '../../services/notification.service';
import { ConnectionTestService } from '../../services/connection-test.service';
import { DataEntity, NotificationMessage, Stats } from '../../models/data-entity.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Data
  allData: DataEntity[] = [];
  externalData: DataEntity[] = [];
  internalData: DataEntity[] = [];
  stats: Stats | null = null;
  
  // Notifications
  notifications: NotificationMessage[] = [];
  unreadCount = 0;
  isConnected = false;
  
  // UI State
  loading = false;
  activeTab = 'all';
  
  // Form
  newItem: DataEntity = { name: '', value: '' };
  
  // Debug info
  debugInfo: any = {};
  
  private subscriptions: Subscription[] = [];

  constructor(
    private dataService: DataService,
    private sseService: SSEService,
    private notificationService: NotificationService,
    private connectionTestService: ConnectionTestService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando Dashboard...');
    this.runConnectivityTest();
    this.initializeSSE();
    this.loadInitialData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.sseService.disconnect();
  }

  private runConnectivityTest(): void {
    console.log('🔍 Executando teste de conectividade...');
    this.connectionTestService.runFullConnectivityTest();
  }

  private initializeSSE(): void {
    console.log('📡 Inicializando SSE...');
    this.updateDebugInfo();
    this.sseService.connect();
  }

  private updateDebugInfo(): void {
    this.debugInfo = this.sseService.getDebugInfo();
    console.log('🔍 Debug Info SSE:', this.debugInfo);
  }

  private setupSubscriptions(): void {
    // Monitor SSE connection status
    this.subscriptions.push(
      this.sseService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
        this.updateDebugInfo();
        console.log('📊 Status da conexão SSE:', status ? '✅ Conectado' : '❌ Desconectado');
      })
    );

    // Monitor SSE notifications
    this.subscriptions.push(
      this.sseService.notifications$.subscribe(notification => {
        if (notification) {
          this.handleSSENotification(notification);
        }
      })
    );

    // Monitor notification count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // Monitor notification history
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );
  }

  private handleSSENotification(notification: NotificationMessage): void {
    console.log('📨 Notificação recebida:', notification);
    
    this.notificationService.addNotification(notification);
    
    // Auto-refresh data on certain notification types
    if (notification.type === 'DATA_UPDATE') {
      setTimeout(() => {
        this.loadAllData();
        this.loadStats();
      }, 1000);
    }
  }

  private loadInitialData(): void {
    this.loadAllData();
    this.loadExternalData();
    this.loadInternalData();
    this.loadStats();
  }

  loadAllData(): void {
    this.loading = true;
    this.dataService.getAllData().subscribe({
      next: (data) => {
        this.allData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.loading = false;
      }
    });
  }

  loadExternalData(): void {
    this.dataService.getExternalData().subscribe({
      next: (data) => {
        this.externalData = data;
      },
      error: (error) => {
        console.error('Erro ao carregar dados externos:', error);
      }
    });
  }

  loadInternalData(): void {
    this.dataService.getInternalData().subscribe({
      next: (data) => {
        this.internalData = data;
      },
      error: (error) => {
        console.error('Erro ao carregar dados internos:', error);
      }
    });
  }

  loadStats(): void {
    this.dataService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
      }
    });
  }

  createNewItem(): void {
    if (!this.newItem.name.trim() || !this.newItem.value.trim()) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    this.dataService.createData(this.newItem).subscribe({
      next: (created) => {
        console.log('Item criado:', created);
        this.newItem = { name: '', value: '' };
        this.loadAllData();
        this.loadInternalData();
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao criar item:', error);
        alert('Erro ao criar item');
      }
    });
  }

  deleteItem(id: number): void {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      this.dataService.deleteData(id).subscribe({
        next: () => {
          console.log('Item excluído');
          this.loadAllData();
          this.loadExternalData();
          this.loadInternalData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Erro ao excluir item:', error);
          alert('Erro ao excluir item');
        }
      });
    }
  }

  refreshData(): void {
    this.notificationService.markAsRead();
    this.loadInitialData();
  }

  forceExternalFetch(): void {
    this.notificationService.forceExternalDataFetch().subscribe({
      next: (response) => {
        console.log('Busca forçada executada:', response);
      },
      error: (error) => {
        console.error('Erro na busca forçada:', error);
      }
    });
  }

  sendTestNotification(): void {
    const message = `Notificação de teste - ${new Date().toLocaleTimeString()}`;
    this.notificationService.sendTestNotification(message).subscribe({
      next: (response) => {
        console.log('Notificação de teste enviada:', response);
      },
      error: (error) => {
        console.error('Erro ao enviar notificação de teste:', error);
      }
    });
  }

  reconnectSSE(): void {
    console.log('🔄 Reconectando SSE...');
    this.sseService.forceReconnect();
  }

  testConnectivity(): void {
    console.log('🔍 Executando teste de conectividade manual...');
    this.runConnectivityTest();
  }

  clearNotifications(): void {
    this.notificationService.clearNotifications();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getCurrentData(): DataEntity[] {
    switch (this.activeTab) {
      case 'external':
        return this.externalData;
      case 'internal':
        return this.internalData;
      default:
        return this.allData;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'DATA_UPDATE':
        return '🔄';
      case 'ERROR':
        return '❌';
      case 'CONNECTION':
        return '🔗';
      case 'INFO':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'DATA_UPDATE':
        return 'alert-success';
      case 'ERROR':
        return 'alert-danger';
      case 'CONNECTION':
        return 'alert-info';
      case 'INFO':
        return 'alert-primary';
      default:
        return 'alert-secondary';
    }
  }
}