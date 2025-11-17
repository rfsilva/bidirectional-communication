import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserInfo, UserRole, PermissionUtils } from '../../models/auth.model';

/**
 * Componente de avatar do usuário com menu dropdown melhorado.
 */
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-avatar-container" *ngIf="currentUser">
      <div class="dropdown">
        <button 
          class="btn btn-link user-avatar-btn" 
          type="button" 
          id="userDropdown" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
          [attr.aria-label]="'Menu do usuário ' + currentUser.fullName">
          
          <!-- Avatar -->
          <div class="avatar-wrapper">
            <img 
              *ngIf="currentUser.avatarUrl && !avatarError" 
              [src]="currentUser.avatarUrl" 
              [alt]="currentUser.fullName"
              class="avatar-img"
              (error)="onAvatarError($event)">
            
            <div 
              *ngIf="!currentUser.avatarUrl || avatarError" 
              class="avatar-initials"
              [class]="'bg-' + getRoleColor()">
              {{ currentUser.initials }}
            </div>
            
            <!-- Indicador de role -->
            <div class="role-indicator" [class]="'bg-' + getRoleColor()">
              {{ getRoleIcon() }}
            </div>
          </div>

          <!-- Nome e role (desktop) -->
          <div class="user-info d-none d-md-block">
            <div class="user-name">{{ currentUser.fullName }}</div>
            <div class="user-role">{{ currentUser.roleName }}</div>
          </div>

          <!-- Seta dropdown -->
          <i class="fas fa-chevron-down dropdown-arrow"></i>
        </button>

        <!-- Menu Dropdown -->
        <ul class="dropdown-menu dropdown-menu-end user-dropdown-menu" aria-labelledby="userDropdown">
          <!-- Informações do usuário -->
          <li class="dropdown-header">
            <div class="user-info-header">
              <strong>{{ currentUser.fullName }}</strong>
              <small class="text-muted">{{ currentUser.email }}</small>
              <span class="badge" [class]="'bg-' + getRoleColor()">
                {{ currentUser.roleName }}
              </span>
            </div>
          </li>
          
          <li><hr class="dropdown-divider"></li>

          <!-- Meu Perfil -->
          <li>
            <a class="dropdown-item" href="#" (click)="goToProfile($event)">
              <i class="fas fa-user me-2"></i>
              Meu Perfil
            </a>
          </li>

          <!-- Alterar Senha -->
          <li>
            <a class="dropdown-item" href="#" (click)="changePassword($event)">
              <i class="fas fa-key me-2"></i>
              Alterar Senha
            </a>
          </li>

          <!-- Gerenciar Usuários (apenas ADMIN) -->
          <li *ngIf="canManageUsers()">
            <a class="dropdown-item" href="#" (click)="manageUsers($event)">
              <i class="fas fa-users me-2"></i>
              Gerenciar Usuários
            </a>
          </li>

          <li><hr class="dropdown-divider"></li>

          <!-- Configurações -->
          <li>
            <a class="dropdown-item" href="#" (click)="openSettings($event)">
              <i class="fas fa-cog me-2"></i>
              Configurações
            </a>
          </li>

          <!-- Ajuda -->
          <li>
            <a class="dropdown-item" href="#" (click)="openHelp($event)">
              <i class="fas fa-question-circle me-2"></i>
              Ajuda
            </a>
          </li>

          <li><hr class="dropdown-divider"></li>

          <!-- Logout com loading -->
          <li>
            <a class="dropdown-item text-danger" 
               href="#" 
               (click)="logout($event)"
               [class.disabled]="isLoggingOut">
              <span *ngIf="!isLoggingOut">
                <i class="fas fa-sign-out-alt me-2"></i>
                Sair
              </span>
              <span *ngIf="isLoggingOut">
                <i class="fas fa-spinner fa-spin me-2"></i>
                Saindo...
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Loading overlay durante logout -->
    <div class="logout-overlay" *ngIf="isLoggingOut">
      <div class="logout-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Fazendo logout...</p>
      </div>
    </div>
  `,
  styles: [`
    .user-avatar-container {
      position: relative;
    }

    .user-avatar-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border: none;
      background: none;
      text-decoration: none;
      color: inherit;
      border-radius: 8px;
      transition: background-color 0.2s ease;
    }

    .user-avatar-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: inherit;
      text-decoration: none;
    }

    .user-avatar-btn:focus {
      outline: 2px solid #0d6efd;
      outline-offset: 2px;
    }

    .avatar-wrapper {
      position: relative;
      width: 40px;
      height: 40px;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .avatar-initials {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 16px;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .role-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
      border: 2px solid #fff;
    }

    .user-info {
      text-align: left;
      min-width: 120px;
    }

    .user-name {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.2;
      color: #333;
    }

    .user-role {
      font-size: 12px;
      color: #666;
      line-height: 1.2;
    }

    .dropdown-arrow {
      font-size: 12px;
      color: #666;
      transition: transform 0.2s ease;
    }

    .dropdown.show .dropdown-arrow {
      transform: rotate(180deg);
    }

    .user-dropdown-menu {
      min-width: 250px;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      padding: 8px 0;
      margin-top: 8px;
      z-index: 1050;
    }

    .dropdown-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
      margin: -8px 0 8px 0;
    }

    .user-info-header {
      text-align: center;
    }

    .user-info-header strong {
      display: block;
      margin-bottom: 4px;
      color: #333;
    }

    .user-info-header small {
      display: block;
      margin-bottom: 8px;
    }

    .dropdown-item {
      padding: 10px 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      transition: background-color 0.2s ease;
      cursor: pointer;
    }

    .dropdown-item:hover:not(.disabled) {
      background-color: #f8f9fa;
    }

    .dropdown-item.text-danger:hover:not(.disabled) {
      background-color: #f8d7da;
      color: #721c24;
    }

    .dropdown-item.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .dropdown-item i {
      width: 16px;
      text-align: center;
    }

    .badge {
      font-size: 10px;
      padding: 4px 8px;
    }

    /* Loading overlay */
    .logout-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .logout-spinner {
      background: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .logout-spinner i {
      font-size: 24px;
      color: #0d6efd;
      margin-bottom: 10px;
    }

    .logout-spinner p {
      margin: 0;
      color: #333;
      font-weight: 500;
    }

    /* Cores por role */
    .bg-danger { background-color: #dc3545 !important; }
    .bg-warning { background-color: #ffc107 !important; color: #000 !important; }
    .bg-info { background-color: #0dcaf0 !important; }
    .bg-success { background-color: #198754 !important; }
    .bg-primary { background-color: #0d6efd !important; }
    .bg-secondary { background-color: #6c757d !important; }

    @media (max-width: 768px) {
      .user-avatar-btn {
        padding: 6px 8px;
      }
      
      .avatar-wrapper {
        width: 36px;
        height: 36px;
      }
      
      .user-dropdown-menu {
        min-width: 200px;
      }

      .logout-spinner {
        margin: 20px;
        padding: 20px;
      }
    }

    /* Animações */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .user-dropdown-menu {
      animation: fadeIn 0.2s ease-out;
    }

    /* Acessibilidade */
    @media (prefers-reduced-motion: reduce) {
      .dropdown-arrow,
      .dropdown-item,
      .user-avatar-btn {
        transition: none;
      }
      
      .user-dropdown-menu {
        animation: none;
      }
    }
  `]
})
export class UserAvatarComponent implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  avatarError = false;
  isLoggingOut = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('👤 UserAvatar: Inicializando componente');
    
    // Observar mudanças no usuário atual
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.avatarError = false; // Reset avatar error when user changes
        console.log('👤 UserAvatar: Usuário atual:', user?.username || 'nenhum');
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onAvatarError(event: any): void {
    console.warn('👤 UserAvatar: Erro ao carregar avatar, usando iniciais');
    this.avatarError = true;
  }

  getRoleColor(): string {
    if (!this.currentUser) return 'secondary';
    return PermissionUtils.getRoleColor(this.currentUser.role);
  }

  getRoleIcon(): string {
    if (!this.currentUser) return '?';
    
    const roleIcons = {
      [UserRole.ADMIN]: 'A',
      [UserRole.EDITOR]: 'E',
      [UserRole.VIEWER]: 'V'
    };
    
    return roleIcons[this.currentUser.role] || '?';
  }

  canManageUsers(): boolean {
    return this.authService.canManageUsers();
  }

  goToProfile(event: Event): void {
    event.preventDefault();
    console.log('👤 UserAvatar: Navegando para perfil');
    this.router.navigate(['/profile']);
  }

  changePassword(event: Event): void {
    event.preventDefault();
    console.log('👤 UserAvatar: Navegando para alterar senha');
    this.router.navigate(['/profile/password']);
  }

  manageUsers(event: Event): void {
    event.preventDefault();
    if (this.canManageUsers()) {
      console.log('👤 UserAvatar: Navegando para gerenciar usuários');
      this.router.navigate(['/users']);
    } else {
      console.warn('👤 UserAvatar: Usuário não tem permissão para gerenciar usuários');
    }
  }

  openSettings(event: Event): void {
    event.preventDefault();
    console.log('👤 UserAvatar: Abrindo configurações (TODO)');
    // TODO: Implementar página de configurações
    alert('Configurações em desenvolvimento');
  }

  openHelp(event: Event): void {
    event.preventDefault();
    console.log('👤 UserAvatar: Abrindo ajuda (TODO)');
    // TODO: Implementar página de ajuda
    alert('Ajuda em desenvolvimento');
  }

  logout(event: Event): void {
    event.preventDefault();
    
    if (this.isLoggingOut) {
      console.log('👤 UserAvatar: Logout já em andamento, ignorando');
      return;
    }

    console.log('👤 UserAvatar: Iniciando processo de logout');
    
    const confirmMessage = `Tem certeza que deseja sair?\n\nUsuário: ${this.currentUser?.fullName}\nEmail: ${this.currentUser?.email}`;
    
    if (confirm(confirmMessage)) {
      this.isLoggingOut = true;
      console.log('👋 UserAvatar: Usuário confirmou logout, processando...');
      
      this.authService.logout().subscribe({
        next: () => {
          console.log('✅ UserAvatar: Logout realizado com sucesso');
          this.isLoggingOut = false;
          this.router.navigate(['/login'], { 
            queryParams: { 
              message: 'Logout realizado com sucesso' 
            } 
          });
        },
        error: (error) => {
          console.error('❌ UserAvatar: Erro no logout:', error);
          this.isLoggingOut = false;
          
          // Mesmo com erro no servidor, limpar dados locais e redirecionar
          console.log('🔒 UserAvatar: Forçando logout local devido a erro no servidor');
          this.authService.forceLogout();
          this.router.navigate(['/login'], { 
            queryParams: { 
              message: 'Sessão encerrada (erro no servidor)',
              type: 'warning'
            } 
          });
        }
      });
    } else {
      console.log('👤 UserAvatar: Logout cancelado pelo usuário');
    }
  }
}