import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { DataService } from '../../services/data.service';
import { SSEService } from '../../services/sse.service';
import { NotificationService } from '../../services/notification.service';
import { ConnectionTestService } from '../../services/connection-test.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { DataEntity, NotificationMessage, Stats } from '../../models/data-entity.model';
import { UserInfo, UserRole, PermissionUtils } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent],
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
  
  // I18N info
  currentLanguage = 'pt';
  availableLanguages: any[] = [];
  i18nInfo: any = null;
  
  // Auth info
  currentUser: UserInfo | null = null;
  private isUserAuthenticated = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private dataService: DataService,
    private sseService: SSEService,
    private notificationService: NotificationService,
    private connectionTestService: ConnectionTestService,
    private languageService: LanguageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando Dashboard...');
    this.initializeAuth();
    this.initializeI18n();
    this.runConnectivityTest();
    this.setupSubscriptions();
    
    // Aguardar autenticação antes de inicializar SSE e carregar dados
    this.waitForAuthentication();
  }

  ngOnDestroy(): void {
    console.log('🔌 Destruindo Dashboard - desconectando SSE...');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.sseService.disconnect();
  }

  private waitForAuthentication(): void {
    console.log('⏳ Aguardando confirmação de autenticação...');
    
    // Aguardar até que o usuário esteja autenticado
    this.authService.isAuthenticated$.pipe(
      filter(isAuth => isAuth === true), // Só continua quando autenticado
      take(1) // Pega apenas o primeiro valor true
    ).subscribe(() => {
      console.log('✅ Usuário autenticado confirmado - inicializando recursos protegidos');
      this.isUserAuthenticated = true;
      this.initializeSSE();
      this.loadInitialData();
    });

    // Também verificar se já está autenticado imediatamente
    if (this.authService.isAuthenticated()) {
      console.log('✅ Usuário já autenticado - inicializando recursos protegidos');
      this.isUserAuthenticated = true;
      this.initializeSSE();
      this.loadInitialData();
    }
  }

  private initializeAuth(): void {
    console.log('👤 Inicializando autenticação...');
    
    // Observar mudanças no usuário atual
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        const wasAuthenticated = this.isUserAuthenticated;
        this.currentUser = user;
        this.isUserAuthenticated = !!user;
        
        console.log('👤 Usuário atual:', user?.username, user?.role);
        
        // Se o usuário fez logout, desconectar SSE
        if (wasAuthenticated && !user) {
          console.log('🔒 Usuário deslogado - desconectando SSE');
          this.sseService.disconnect();
          this.isConnected = false;
        }
        
        // Se o usuário fez login, conectar SSE
        if (!wasAuthenticated && user) {
          console.log('🔓 Usuário logado - conectando SSE');
          this.initializeSSE();
          this.loadInitialData();
        }
      })
    );

    // Observar mudanças no status de autenticação
    this.subscriptions.push(
      this.authService.isAuthenticated$.subscribe(isAuth => {
        console.log('🔐 Status de autenticação:', isAuth ? 'Autenticado' : 'Não autenticado');
        
        if (!isAuth && this.isUserAuthenticated) {
          console.log('🔒 Perdeu autenticação - desconectando SSE');
          this.sseService.disconnect();
          this.isConnected = false;
          this.isUserAuthenticated = false;
        }
      })
    );
  }

  private initializeI18n(): void {
    console.log('🌍 Inicializando I18N...');
    this.availableLanguages = this.languageService.getAvailableLanguages();
    
    // Monitor language changes
    this.subscriptions.push(
      this.languageService.currentLanguage$.subscribe(lang => {
        this.currentLanguage = lang;
        console.log(`🗣️ Idioma atual: ${lang}`);
      })
    );

    // Load I18N demo info (não precisa de autenticação)
    this.languageService.demonstrateI18nBehavior().subscribe({
      next: (info) => {
        this.i18nInfo = info;
        console.log('🌍 Informações I18N:', info);
      },
      error: (error) => {
        console.error('Erro ao carregar informações I18N:', error);
      }
    });
  }

  private runConnectivityTest(): void {
    console.log('🔍 Executando teste de conectividade...');
    this.connectionTestService.runFullConnectivityTest();
  }

  private initializeSSE(): void {
    // Só inicializar SSE se o usuário estiver autenticado
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 Usuário não autenticado - SSE não será inicializado');
      return;
    }

    console.log('📡 Inicializando SSE para usuário autenticado...');
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
    // Só carregar dados se o usuário estiver autenticado
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 Usuário não autenticado - dados não serão carregados');
      return;
    }

    console.log('📊 Carregando dados iniciais para usuário autenticado...');
    this.loadAllData();
    this.loadExternalData();
    this.loadInternalData();
    this.loadStats();
  }

  loadAllData(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 Usuário não autenticado - não é possível carregar dados');
      return;
    }

    this.loading = true;
    this.dataService.getAllData().subscribe({
      next: (data) => {
        this.allData = data;
        this.loading = false;
        console.log('📊 Dados carregados (com ?lang=pt automático):', data.length, 'registros');
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.loading = false;
        
        // Se erro 401, o interceptor já vai tratar
        if (error.status !== 401) {
          alert('Erro ao carregar dados. Verifique sua conexão.');
        }
      }
    });
  }

  loadExternalData(): void {
    if (!this.authService.isAuthenticated()) return;

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
    if (!this.authService.isAuthenticated()) return;

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
    if (!this.authService.isAuthenticated()) return;

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
    if (!this.canEditData()) {
      alert('Você não tem permissão para criar dados');
      return;
    }

    if (!this.newItem.name.trim() || !this.newItem.value.trim()) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    console.log('📝 Criando item (mensagens virão em português via ?lang=pt)...');
    this.dataService.createData(this.newItem).subscribe({
      next: (created) => {
        console.log('✅ Item criado com mensagens em português:', created);
        this.newItem = { name: '', value: '' };
        this.loadAllData();
        this.loadInternalData();
        this.loadStats();
      },
      error: (error) => {
        console.error('❌ Erro ao criar item:', error);
        
        if (error.status === 403) {
          alert('Você não tem permissão para criar dados');
        } else {
          alert('Erro ao criar item');
        }
      }
    });
  }

  deleteItem(id: number): void {
    if (!this.canEditData()) {
      alert('Você não tem permissão para excluir dados');
      return;
    }

    if (confirm('Tem certeza que deseja excluir este item?')) {
      console.log('🗑️ Excluindo item (mensagens virão em português via ?lang=pt)...');
      this.dataService.deleteData(id).subscribe({
        next: () => {
          console.log('✅ Item excluído com mensagens em português');
          this.loadAllData();
          this.loadExternalData();
          this.loadInternalData();
          this.loadStats();
        },
        error: (error) => {
          console.error('❌ Erro ao excluir item:', error);
          
          if (error.status === 403) {
            alert('Você não tem permissão para excluir dados');
          } else {
            alert('Erro ao excluir item');
          }
        }
      });
    }
  }

  refreshData(): void {
    this.notificationService.markAsRead();
    this.loadInitialData();
  }

  forceExternalFetch(): void {
    if (!this.canManageSSE()) {
      alert('Você não tem permissão para esta ação');
      return;
    }

    console.log('🔄 Forçando busca externa (mensagens virão em português via ?lang=pt)...');
    this.notificationService.forceExternalDataFetch().subscribe({
      next: (response) => {
        console.log('✅ Busca forçada executada com mensagens em português:', response);
      },
      error: (error) => {
        console.error('❌ Erro na busca forçada:', error);
        
        if (error.status === 403) {
          alert('Você não tem permissão para esta ação');
        }
      }
    });
  }

  sendTestNotification(): void {
    const message = `Notificação de teste em português - ${new Date().toLocaleTimeString()}`;
    console.log('📢 Enviando notificação de teste (mensagens virão em português via ?lang=pt)...');
    this.notificationService.sendTestNotification(message).subscribe({
      next: (response) => {
        console.log('✅ Notificação de teste enviada com mensagens em português:', response);
      },
      error: (error) => {
        console.error('❌ Erro ao enviar notificação de teste:', error);
      }
    });
  }

  // I18N specific methods
  changeLanguage(language: string): void {
    console.log(`🌍 Alterando idioma para: ${language}`);
    this.languageService.setLanguage(language);
    
    // Reload I18N info
    this.languageService.demonstrateI18nBehavior().subscribe({
      next: (info) => {
        this.i18nInfo = info;
        console.log(`🗣️ Informações I18N atualizadas para ${language}:`, info);
      }
    });
  }

  testI18nMessages(): void {
    console.log('🧪 Testando mensagens I18N...');
    this.languageService.testI18nFunctionality().subscribe({
      next: (response) => {
        console.log('✅ Teste I18N executado:', response);
        alert(`Teste I18N executado!\nIdioma: ${response.currentLocale}\nMensagem: ${response.messages?.welcome}`);
      },
      error: (error) => {
        console.error('❌ Erro no teste I18N:', error);
        alert('Erro no teste I18N');
      }
    });
  }

  reconnectSSE(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 Usuário não autenticado - não é possível reconectar SSE');
      return;
    }
    
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

  // Permission methods
  canEditData(): boolean {
    return this.authService.canEditData();
  }

  canManageSSE(): boolean {
    return this.currentUser ? PermissionUtils.hasPermission(this.currentUser.role, 'canManageSSE') : false;
  }

  canManageUsers(): boolean {
    return this.authService.canManageUsers();
  }

  // Getter for template
  get languageFlag(): string {
    const lang = this.availableLanguages.find(l => l.code === this.currentLanguage);
    return lang ? lang.flag : '🌍';
  }

  get languageName(): string {
    const lang = this.availableLanguages.find(l => l.code === this.currentLanguage);
    return lang ? lang.name : 'Unknown';
  }

  get userRoleColor(): string {
    return this.currentUser ? PermissionUtils.getRoleColor(this.currentUser.role) : 'secondary';
  }
}