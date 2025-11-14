import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { filter, take, switchMap, delay } from 'rxjs/operators';

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
  private authInitialized = false;
  
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
    console.log('🚀 Dashboard: Inicializando...');
    
    // Primeiro aguardar a inicialização do AuthService
    this.waitForAuthInitialization();
  }

  ngOnDestroy(): void {
    console.log('🔌 Dashboard: Destruindo - desconectando SSE...');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.sseService.disconnect();
  }

  private waitForAuthInitialization(): void {
    console.log('⏳ Dashboard: Aguardando inicialização do AuthService...');
    
    this.authService.waitForInitialization().subscribe(() => {
      console.log('✅ Dashboard: AuthService inicializado, configurando dashboard...');
      this.authInitialized = true;
      this.initializeAuth();
      this.initializeI18n();
      this.runConnectivityTest();
      this.setupSubscriptions();
      this.waitForAuthentication();
    });
  }

  private waitForAuthentication(): void {
    console.log('⏳ Dashboard: Verificando status de autenticação...');
    
    // Verificar se já está autenticado
    if (this.authService.isAuthenticated()) {
      console.log('✅ Dashboard: Usuário já autenticado - inicializando recursos protegidos');
      this.isUserAuthenticated = true;
      this.currentUser = this.authService.getCurrentUser();
      this.initializeProtectedResources();
      return;
    }

    // Aguardar autenticação
    const authSub = combineLatest([
      this.authService.isAuthenticated$,
      this.authService.currentUser$
    ]).pipe(
      filter(([isAuth, user]) => isAuth && !!user),
      take(1)
    ).subscribe(([isAuth, user]) => {
      console.log('✅ Dashboard: Usuário autenticado confirmado - inicializando recursos protegidos');
      this.isUserAuthenticated = true;
      this.currentUser = user;
      this.initializeProtectedResources();
    });

    this.subscriptions.push(authSub);
  }

  private initializeProtectedResources(): void {
    console.log('🔒 Dashboard: Inicializando recursos protegidos...');
    
    // Aguardar um pouco para garantir que o token está disponível
    setTimeout(() => {
      this.initializeSSE();
      this.loadInitialData();
    }, 100);
  }

  private initializeAuth(): void {
    console.log('👤 Dashboard: Configurando observadores de autenticação...');
    
    // Observar mudanças no usuário atual
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        const wasAuthenticated = this.isUserAuthenticated;
        this.currentUser = user;
        this.isUserAuthenticated = !!user;
        
        console.log('👤 Dashboard: Usuário atual:', user?.username, user?.role);
        
        // Se o usuário fez logout, desconectar SSE
        if (wasAuthenticated && !user) {
          console.log('🔒 Dashboard: Usuário deslogado - desconectando SSE');
          this.sseService.disconnect();
          this.isConnected = false;
        }
      })
    );

    // Observar mudanças no status de autenticação
    this.subscriptions.push(
      this.authService.isAuthenticated$.subscribe(isAuth => {
        console.log('🔐 Dashboard: Status de autenticação:', isAuth ? 'Autenticado' : 'Não autenticado');
        
        if (!isAuth && this.isUserAuthenticated) {
          console.log('🔒 Dashboard: Perdeu autenticação - desconectando SSE');
          this.sseService.disconnect();
          this.isConnected = false;
          this.isUserAuthenticated = false;
        }
      })
    );
  }

  private initializeI18n(): void {
    console.log('🌍 Dashboard: Inicializando I18N...');
    this.availableLanguages = this.languageService.getAvailableLanguages();
    
    // Monitor language changes
    this.subscriptions.push(
      this.languageService.currentLanguage$.subscribe(lang => {
        this.currentLanguage = lang;
        console.log(`🗣️ Dashboard: Idioma atual: ${lang}`);
      })
    );

    // Load I18N demo info (não precisa de autenticação)
    this.languageService.demonstrateI18nBehavior().subscribe({
      next: (info) => {
        this.i18nInfo = info;
        console.log('🌍 Dashboard: Informações I18N:', info);
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro ao carregar informações I18N:', error);
      }
    });
  }

  private runConnectivityTest(): void {
    console.log('🔍 Dashboard: Executando teste de conectividade...');
    this.connectionTestService.runFullConnectivityTest();
  }

  private initializeSSE(): void {
    // Só inicializar SSE se o usuário estiver autenticado
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 Dashboard: Usuário não autenticado - SSE não será inicializado');
      return;
    }

    console.log('📡 Dashboard: Inicializando SSE para usuário autenticado...');
    this.updateDebugInfo();
    this.sseService.connect();
  }

  private updateDebugInfo(): void {
    this.debugInfo = this.sseService.getDebugInfo();
    console.log('🔍 Dashboard: Debug Info SSE:', this.debugInfo);
  }

  private setupSubscriptions(): void {
    // Monitor SSE connection status
    this.subscriptions.push(
      this.sseService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
        this.updateDebugInfo();
        console.log('📊 Dashboard: Status da conexão SSE:', status ? '✅ Conectado' : '❌ Desconectado');
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
    console.log('📨 Dashboard: Notificação recebida:', notification);
    
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
    // Verificar autenticação antes de carregar dados
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 Dashboard: Usuário não autenticado - dados não serão carregados');
      return;
    }

    // Verificar se o token está disponível
    const token = this.authService.getToken();
    if (!token) {
      console.warn('🔒 Dashboard: Token não disponível - aguardando...');
      // Tentar novamente após um delay
      setTimeout(() => this.loadInitialData(), 500);
      return;
    }

    console.log('📊 Dashboard: Carregando dados iniciais para usuário autenticado...');
    this.loadAllData();
    this.loadExternalData();
    this.loadInternalData();
    this.loadStats();
  }

  loadAllData(): void {
    if (!this.isAuthenticationReady()) return;

    console.log('📊 Dashboard: Carregando todos os dados...');
    this.loading = true;
    
    this.dataService.getAllData().subscribe({
      next: (data) => {
        this.allData = data;
        this.loading = false;
        console.log('✅ Dashboard: Dados carregados:', data.length, 'registros');
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro ao carregar dados:', error);
        this.loading = false;
        
        // Se erro 401, o interceptor já vai tratar
        if (error.status !== 401) {
          alert('Erro ao carregar dados. Verifique sua conexão.');
        }
      }
    });
  }

  loadExternalData(): void {
    if (!this.isAuthenticationReady()) return;

    console.log('📊 Dashboard: Carregando dados externos...');
    this.dataService.getExternalData().subscribe({
      next: (data) => {
        this.externalData = data;
        console.log('✅ Dashboard: Dados externos carregados:', data.length, 'registros');
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro ao carregar dados externos:', error);
      }
    });
  }

  loadInternalData(): void {
    if (!this.isAuthenticationReady()) return;

    console.log('📊 Dashboard: Carregando dados internos...');
    this.dataService.getInternalData().subscribe({
      next: (data) => {
        this.internalData = data;
        console.log('✅ Dashboard: Dados internos carregados:', data.length, 'registros');
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro ao carregar dados internos:', error);
      }
    });
  }

  loadStats(): void {
    if (!this.isAuthenticationReady()) return;

    console.log('📊 Dashboard: Carregando estatísticas...');
    this.dataService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        console.log('✅ Dashboard: Estatísticas carregadas:', stats);
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro ao carregar estatísticas:', error);
      }
    });
  }

  private isAuthenticationReady(): boolean {
    const isAuth = this.authService.isAuthenticated();
    const hasToken = !!this.authService.getToken();
    const hasUser = !!this.currentUser;
    
    if (!isAuth || !hasToken || !hasUser) {
      console.warn('🔒 Dashboard: Autenticação não está pronta - isAuth:', isAuth, 'hasToken:', hasToken, 'hasUser:', hasUser);
      return false;
    }
    
    return true;
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

    console.log('📝 Dashboard: Criando item...');
    this.dataService.createData(this.newItem).subscribe({
      next: (created) => {
        console.log('✅ Dashboard: Item criado:', created);
        this.newItem = { name: '', value: '' };
        this.loadAllData();
        this.loadInternalData();
        this.loadStats();
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro ao criar item:', error);
        
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
      console.log('🗑️ Dashboard: Excluindo item...');
      this.dataService.deleteData(id).subscribe({
        next: () => {
          console.log('✅ Dashboard: Item excluído');
          this.loadAllData();
          this.loadExternalData();
          this.loadInternalData();
          this.loadStats();
        },
        error: (error) => {
          console.error('❌ Dashboard: Erro ao excluir item:', error);
          
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
    console.log('🔄 Dashboard: Atualizando dados...');
    this.notificationService.markAsRead();
    this.loadInitialData();
  }

  forceExternalFetch(): void {
    if (!this.canManageSSE()) {
      alert('Você não tem permissão para esta ação');
      return;
    }

    console.log('🔄 Dashboard: Forçando busca externa...');
    this.notificationService.forceExternalDataFetch().subscribe({
      next: (response) => {
        console.log('✅ Dashboard: Busca forçada executada:', response);
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro na busca forçada:', error);
        
        if (error.status === 403) {
          alert('Você não tem permissão para esta ação');
        }
      }
    });
  }

  sendTestNotification(): void {
    const message = `Notificação de teste - ${new Date().toLocaleTimeString()}`;
    console.log('📢 Dashboard: Enviando notificação de teste...');
    this.notificationService.sendTestNotification(message).subscribe({
      next: (response) => {
        console.log('✅ Dashboard: Notificação de teste enviada:', response);
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro ao enviar notificação de teste:', error);
      }
    });
  }

  // I18N specific methods
  changeLanguage(language: string): void {
    console.log(`🌍 Dashboard: Alterando idioma para: ${language}`);
    this.languageService.setLanguage(language);
    
    // Reload I18N info
    this.languageService.demonstrateI18nBehavior().subscribe({
      next: (info) => {
        this.i18nInfo = info;
        console.log(`🗣️ Dashboard: Informações I18N atualizadas para ${language}:`, info);
      }
    });
  }

  testI18nMessages(): void {
    console.log('🧪 Dashboard: Testando mensagens I18N...');
    this.languageService.testI18nFunctionality().subscribe({
      next: (response) => {
        console.log('✅ Dashboard: Teste I18N executado:', response);
        alert(`Teste I18N executado!\nIdioma: ${response.currentLocale}\nMensagem: ${response.messages?.welcome}`);
      },
      error: (error) => {
        console.error('❌ Dashboard: Erro no teste I18N:', error);
        alert('Erro no teste I18N');
      }
    });
  }

  reconnectSSE(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn('🔒 Dashboard: Usuário não autenticado - não é possível reconectar SSE');
      return;
    }
    
    console.log('🔄 Dashboard: Reconectando SSE...');
    this.sseService.forceReconnect();
  }

  testConnectivity(): void {
    console.log('🔍 Dashboard: Executando teste de conectividade manual...');
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