import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { User, UserInfo, UserRole, PermissionUtils } from '../../models/auth.model';

/**
 * Componente para visualização e edição do perfil do usuário.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👤 Meu Perfil</h2>
          <p class="text-muted">Gerencie suas informações pessoais</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left me-2"></i>Voltar
          </button>
          <button class="btn btn-warning" (click)="changePassword()">
            <i class="fas fa-key me-2"></i>Alterar Senha
          </button>
        </div>
      </div>

      <div class="row">
        <!-- Profile Form -->
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Informações Pessoais</h5>
            </div>
            <div class="card-body">
              <form (ngSubmit)="onSubmit()" #profileForm="ngForm" *ngIf="user">
                <div class="row">
                  <!-- Username -->
                  <div class="col-md-6 mb-3">
                    <label for="username" class="form-label">Nome de Usuário</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      class="form-control"
                      [(ngModel)]="user.username"
                      required
                      #usernameInput="ngModel"
                      [class.is-invalid]="usernameInput.invalid && usernameInput.touched">
                    <div class="invalid-feedback" *ngIf="usernameInput.invalid && usernameInput.touched">
                      Nome de usuário é obrigatório
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      class="form-control"
                      [(ngModel)]="user.email"
                      required
                      email
                      #emailInput="ngModel"
                      [class.is-invalid]="emailInput.invalid && emailInput.touched">
                    <div class="invalid-feedback" *ngIf="emailInput.invalid && emailInput.touched">
                      <span *ngIf="emailInput.errors?.['required']">Email é obrigatório</span>
                      <span *ngIf="emailInput.errors?.['email']">Formato de email inválido</span>
                    </div>
                  </div>

                  <!-- First Name -->
                  <div class="col-md-6 mb-3">
                    <label for="firstName" class="form-label">Primeiro Nome</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      class="form-control"
                      [(ngModel)]="user.firstName"
                      required
                      #firstNameInput="ngModel"
                      [class.is-invalid]="firstNameInput.invalid && firstNameInput.touched">
                    <div class="invalid-feedback" *ngIf="firstNameInput.invalid && firstNameInput.touched">
                      Primeiro nome é obrigatório
                    </div>
                  </div>

                  <!-- Last Name -->
                  <div class="col-md-6 mb-3">
                    <label for="lastName" class="form-label">Sobrenome</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      class="form-control"
                      [(ngModel)]="user.lastName"
                      required
                      #lastNameInput="ngModel"
                      [class.is-invalid]="lastNameInput.invalid && lastNameInput.touched">
                    <div class="invalid-feedback" *ngIf="lastNameInput.invalid && lastNameInput.touched">
                      Sobrenome é obrigatório
                    </div>
                  </div>

                  <!-- Avatar URL -->
                  <div class="col-12 mb-3">
                    <label for="avatarUrl" class="form-label">URL do Avatar (opcional)</label>
                    <input
                      type="url"
                      id="avatarUrl"
                      name="avatarUrl"
                      class="form-control"
                      [(ngModel)]="user.avatarUrl"
                      placeholder="https://exemplo.com/meu-avatar.jpg"
                      #avatarInput="ngModel"
                      [class.is-invalid]="avatarInput.invalid && avatarInput.touched">
                    <div class="form-text">
                      Deixe em branco para usar as iniciais do seu nome como avatar
                    </div>
                    <div class="invalid-feedback" *ngIf="avatarInput.invalid && avatarInput.touched">
                      URL inválida
                    </div>
                  </div>
                </div>

                <!-- Error Message -->
                <div class="alert alert-danger" *ngIf="errorMessage">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  {{ errorMessage }}
                </div>

                <!-- Success Message -->
                <div class="alert alert-success" *ngIf="successMessage">
                  <i class="fas fa-check-circle me-2"></i>
                  {{ successMessage }}
                </div>

                <!-- Submit Button -->
                <div class="d-flex justify-content-end">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="profileForm.invalid || loading">
                    <span class="spinner-border spinner-border-sm me-2" *ngIf="loading"></span>
                    <i class="fas fa-save me-2" *ngIf="!loading"></i>
                    {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Profile Info -->
        <div class="col-lg-4">
          <!-- Avatar Preview -->
          <div class="card mb-4">
            <div class="card-header">
              <h6 class="mb-0">Preview do Avatar</h6>
            </div>
            <div class="card-body text-center">
              <app-user-avatar></app-user-avatar>
              <div class="mt-3" *ngIf="currentUser">
                <h6>{{ currentUser.fullName }}</h6>
                <span class="badge" [class]="'bg-' + getRoleColor()">
                  {{ currentUser.roleName }}
                </span>
              </div>
            </div>
          </div>

          <!-- Account Info -->
          <div class="card mb-4">
            <div class="card-header">
              <h6 class="mb-0">Informações da Conta</h6>
            </div>
            <div class="card-body">
              <div class="mb-3" *ngIf="currentUser">
                <small class="text-muted">Perfil de Acesso</small>
                <div>
                  <span class="badge" [class]="'bg-' + getRoleColor()">
                    {{ currentUser.roleName }}
                  </span>
                </div>
              </div>

              <div class="mb-3" *ngIf="currentUser && currentUser.lastLogin">
                <small class="text-muted">Último Login</small>
                <div class="small">{{ formatDate(currentUser.lastLogin) }}</div>
              </div>

              <div class="mb-3" *ngIf="user && user.createdAt">
                <small class="text-muted">Membro desde</small>
                <div class="small">{{ formatDate(user.createdAt) }}</div>
              </div>

              <div class="mb-3" *ngIf="user && user.isActive !== undefined">
                <small class="text-muted">Status da Conta</small>
                <div>
                  <span class="badge" [class]="user.isActive ? 'bg-success' : 'bg-danger'">
                    {{ user.isActive ? 'Ativa' : 'Inativa' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Permissions -->
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">Suas Permissões</h6>
            </div>
            <div class="card-body">
              <div class="d-flex flex-wrap gap-1">
                <span class="badge bg-info">👁️ Visualizar Dados</span>
                <span class="badge bg-success" *ngIf="canEditData()">✏️ Editar Dados</span>
                <span class="badge bg-warning" *ngIf="canManageSSE()">📡 Gerenciar SSE</span>
                <span class="badge bg-danger" *ngIf="canManageUsers()">👥 Gerenciar Usuários</span>
              </div>
              <div class="mt-2">
                <small class="text-muted">
                  Suas permissões são baseadas no seu perfil de acesso.
                  Entre em contato com um administrador para alterações.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .card {
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      border-radius: 8px 8px 0 0 !important;
    }

    .form-label {
      font-weight: 600;
      color: #333;
    }

    .form-control:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }

    .badge {
      font-size: 0.75em;
    }

    .alert {
      border-radius: 6px;
    }

    .btn {
      border-radius: 6px;
    }

    @media (max-width: 768px) {
      .container-fluid {
        padding: 10px;
      }
      
      .d-flex.justify-content-between {
        flex-direction: column;
        gap: 15px;
      }
      
      .d-flex.gap-2 {
        justify-content: stretch;
      }
      
      .d-flex.gap-2 .btn {
        flex: 1;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  currentUser: UserInfo | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadUserProfile(): void {
    // Carregar dados atuais do servidor
    this.authService.getCurrentUserFromServer().subscribe({
      next: (userInfo) => {
        // Converter UserInfo para User para edição
        this.user = {
          id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          firstName: userInfo.fullName.split(' ')[0] || '',
          lastName: userInfo.fullName.split(' ').slice(1).join(' ') || '',
          role: userInfo.role,
          avatarUrl: userInfo.avatarUrl,
          isActive: userInfo.isActive,
          createdAt: '', // Será preenchido pelo servidor
          lastLogin: userInfo.lastLogin
        } as User;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.errorMessage = 'Erro ao carregar dados do perfil';
      }
    });
  }

  onSubmit(): void {
    if (!this.user) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.updateProfile(this.user).subscribe({
      next: (updatedUser) => {
        console.log('✅ Perfil atualizado com sucesso');
        this.successMessage = 'Perfil atualizado com sucesso!';
        this.loading = false;
        
        // Atualizar dados locais
        this.currentUser = this.authService.getCurrentUser();
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Erro ao atualizar perfil:', error);
        
        if (error.status === 400 && error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Erro ao atualizar perfil. Tente novamente.';
        }
        
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  changePassword(): void {
    this.router.navigate(['/profile/password']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  getRoleColor(): string {
    return this.currentUser ? PermissionUtils.getRoleColor(this.currentUser.role) : 'secondary';
  }

  canEditData(): boolean {
    return this.authService.canEditData();
  }

  canManageSSE(): boolean {
    return this.currentUser ? PermissionUtils.hasPermission(this.currentUser.role, 'canManageSSE') : false;
  }

  canManageUsers(): boolean {
    return this.authService.canManageUsers();
  }
}