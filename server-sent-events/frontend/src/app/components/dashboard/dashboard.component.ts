import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { SSEService } from '../../services/sse.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { DataEntity, NotificationMessage, Stats } from '../../models/data-entity.model';
import { UserInfo, PermissionUtils } from '../../models/auth.model';

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
  
  // NOVO: Paginação
  currentPage = 1;
  itemsPerPage = 12; // 12 itens por página (6 por linha x 2 linhas)
  totalPages = 0;
  paginatedData: DataEntity[] = [];
  
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
  private authReady = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private dataService: DataService,
    private sseService: SSEService,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Inicializar componentes não dependentes de autenticação
    this.initializeI18n();
    this.setupSubscriptions();
    
    // Aguardar autenticação estar completamente pronta
    this.waitForAuthenticationReady();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.sseService.disconnect();
  }

  private waitForAuthenticationReady(): void {
    // Aguardar que a autenticação esteja completamente pronta
    this.authService.waitForAuthReady().subscribe(() => {
      this.authReady = true;
      this.currentUser = this.authService.getCurrentUser();
      this.initializeProtectedResources();
    });

    // Observar mudanças no estado de autenticação
    this.subscriptions.push(
      this.authService.authReady$.subscribe(ready => {
        if (ready && !this.authReady) {
          this.authReady = true;
          this.currentUser = this.authService.getCurrentUser();
          this.initializeProtectedResources();
        } else if (!ready && this.authReady) {
          this.authReady = false;
          this.sseService.disconnect();
          this.isConnected = false;
        }
      })
    );
  }

  private initializeProtectedResources(): void {
    // Verificar se está tudo pronto
    if (!this.authService.isAuthenticated() || !this.authService.getToken()) {
      setTimeout(() => this.initializeProtectedResources(), 500);
      return;
    }
    
    this.loadInitialData();
    this.initializeSSE();
  }

  private initializeI18n(): void {
    this.availableLanguages = this.languageService.getAvailableLanguages();
    
    // Monitor language changes
    this.subscriptions.push(
      this.languageService.currentLanguage$.subscribe(lang => {
        this.currentLanguage = lang;
      })
    );

    // Load I18N demo info
    this.languageService.demonstrateI18nBehavior().subscribe({
      next: (info) => {
        this.i18nInfo = info;
      },
      error: (error) => {
        console.error('Erro ao carregar informações I18N:', error);
      }
    });
  }

  private initializeSSE(): void {
    if (!this.authReady || !this.authService.isAuthenticated()) {
      return;
    }

    this.updateDebugInfo();
    this.sseService.connect();
  }

  private updateDebugInfo(): void {
    this.debugInfo = this.sseService.getDebugInfo();
  }

  private setupSubscriptions(): void {
    // Monitor SSE connection status
    this.subscriptions.push(
      this.sseService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
        this.updateDebugInfo();
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

    // Monitor user changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  private handleSSENotification(notification: NotificationMessage): void {
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
    if (!this.isAuthenticationReady()) {
      return;
    }

    this.loadAllData();
    this.loadExternalData();
    this.loadInternalData();
    this.loadStats();
  }

  loadAllData(): void {
    if (!this.isAuthenticationReady()) return;
    
    this.loading = true;
    
    this.dataService.getAllData().subscribe({
      next: (data) => {
        this.allData = data;
        this.updatePagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.loading = false;
        
        if (error.status !== 401) {
          alert('Erro ao carregar dados. Verifique sua conexão.');
        }
      }
    });
  }

  loadExternalData(): void {
    if (!this.isAuthenticationReady()) return;

    this.dataService.getExternalData().subscribe({
      next: (data) => {
        this.externalData = data;
        this.updatePagination();
      },
      error: (error) => {
        console.error('Erro ao carregar dados externos:', error);
      }
    });
  }

  loadInternalData(): void {
    if (!this.isAuthenticationReady()) return;

    this.dataService.getInternalData().subscribe({
      next: (data) => {
        this.internalData = data;
        this.updatePagination();
      },
      error: (error) => {
        console.error('Erro ao carregar dados internos:', error);
      }
    });
  }

  loadStats(): void {
    if (!this.isAuthenticationReady()) return;

    this.dataService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
      }
    });
  }

  private isAuthenticationReady(): boolean {
    const isAuth = this.authService.isAuthenticated();
    const hasToken = !!this.authService.getToken();
    const hasUser = !!this.currentUser;
    const ready = this.authReady;
    
    return isAuth && hasToken && hasUser && ready;
  }

  // CORRIGIDO: Métodos de paginação (públicos)
  updatePagination(): void {
    const currentData = this.getCurrentData();
    this.totalPages = Math.ceil(currentData.length / this.itemsPerPage);
    
    // Ajustar página atual se necessário
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    this.updatePaginatedData();
  }

  private updatePaginatedData(): void {
    const currentData = this.getCurrentData();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = currentData.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Mostrar todas as páginas se forem poucas
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas ao redor da atual
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1; // Reset para primeira página ao trocar de aba
    this.updatePagination();
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

    this.dataService.createData(this.newItem).subscribe({
      next: (created) => {
        this.newItem = { name: '', value: '' };
        this.loadAllData();
        this.loadInternalData();
        this.loadStats();
      },
      error: (error) => {
        console.error('Erro ao criar item:', error);
        
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
      this.dataService.deleteData(id).subscribe({
        next: () => {
          this.loadAllData();
          this.loadExternalData();
          this.loadInternalData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Erro ao excluir item:', error);
          
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

    this.notificationService.forceExternalDataFetch().subscribe({
      next: (response) => {
        console.log('Busca forçada executada:', response);
      },
      error: (error) => {
        console.error('Erro na busca forçada:', error);
        
        if (error.status === 403) {
          alert('Você não tem permissão para esta ação');
        }
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

  // I18N methods
  changeLanguage(language: string): void {
    this.languageService.setLanguage(language);
    
    // Reload I18N info
    this.languageService.demonstrateI18nBehavior().subscribe({
      next: (info) => {
        this.i18nInfo = info;
      }
    });
  }

  testI18nMessages(): void {
    this.languageService.testI18nFunctionality().subscribe({
      next: (response) => {
        alert(`Teste I18N executado!\nIdioma: ${response.currentLocale}\nMensagem: ${response.messages?.welcome}`);
      },
      error: (error) => {
        console.error('Erro no teste I18N:', error);
        alert('Erro no teste I18N');
      }
    });
  }

  reconnectSSE(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    this.sseService.forceReconnect();
  }

  clearNotifications(): void {
    this.notificationService.clearNotifications();
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

  // NOVO: Getter para dados paginados
  getPaginatedData(): DataEntity[] {
    return this.paginatedData;
  }

  // CORRIGIDO: Getter para Math (para usar no template)
  get Math(): typeof Math {
    return Math;
  }

  // NOVO: Método para calcular o índice final da página
  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.getCurrentData().length);
  }

  // NOVO: Método para calcular o índice inicial da página
  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
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

  // Getters for template
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