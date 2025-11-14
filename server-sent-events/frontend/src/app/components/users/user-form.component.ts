import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User, UserRole, PermissionUtils } from '../../models/auth.model';

/**
 * Componente para criar/editar usuários (apenas ADMIN).
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{{ isEditMode ? '✏️ Editar Usuário' : '➕ Novo Usuário' }}</h2>
          <p class="text-muted">{{ isEditMode ? 'Altere os dados do usuário' : 'Preencha os dados do novo usuário' }}</p>
        </div>
        <button class="btn btn-outline-secondary" (click)="goBack()">
          <i class="fas fa-arrow-left me-2"></i>Voltar
        </button>
      </div>

      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">{{ isEditMode ? 'Dados do Usuário' : 'Novo Usuário' }}</h5>
            </div>
            <div class="card-body">
              <form (ngSubmit)="onSubmit()" #userForm="ngForm" *ngIf="user">
                <div class="row">
                  <!-- Username -->
                  <div class="col-md-6 mb-3">
                    <label for="username" class="form-label">Nome de Usuário *</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      class="form-control"
                      [(ngModel)]="user.username"
                      required
                      minlength="3"
                      maxlength="50"
                      #usernameInput="ngModel"
                      [class.is-invalid]="usernameInput.invalid && usernameInput.touched"
                      placeholder="Digite o nome de usuário">
                    <div class="invalid-feedback" *ngIf="usernameInput.invalid && usernameInput.touched">
                      <span *ngIf="usernameInput.errors?.['required']">Nome de usuário é obrigatório</span>
                      <span *ngIf="usernameInput.errors?.['minlength']">Mínimo 3 caracteres</span>
                      <span *ngIf="usernameInput.errors?.['maxlength']">Máximo 50 caracteres</span>
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      class="form-control"
                      [(ngModel)]="user.email"
                      required
                      email
                      #emailInput="ngModel"
                      [class.is-invalid]="emailInput.invalid && emailInput.touched"
                      placeholder="Digite o email">
                    <div class="invalid-feedback" *ngIf="emailInput.invalid && emailInput.touched">
                      <span *ngIf="emailInput.errors?.['required']">Email é obrigatório</span>
                      <span *ngIf="emailInput.errors?.['email']">Formato de email inválido</span>
                    </div>
                  </div>

                  <!-- First Name -->
                  <div class="col-md-6 mb-3">
                    <label for="firstName" class="form-label">Primeiro Nome *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      class="form-control"
                      [(ngModel)]="user.firstName"
                      required
                      maxlength="100"
                      #firstNameInput="ngModel"
                      [class.is-invalid]="firstNameInput.invalid && firstNameInput.touched"
                      placeholder="Digite o primeiro nome">
                    <div class="invalid-feedback" *ngIf="firstNameInput.invalid && firstNameInput.touched">
                      <span *ngIf="firstNameInput.errors?.['required']">Primeiro nome é obrigatório</span>
                      <span *ngIf="firstNameInput.errors?.['maxlength']">Máximo 100 caracteres</span>
                    </div>
                  </div>

                  <!-- Last Name -->
                  <div class="col-md-6 mb-3">
                    <label for="lastName" class="form-label">Sobrenome *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      class="form-control"
                      [(ngModel)]="user.lastName"
                      required
                      maxlength="100"
                      #lastNameInput="ngModel"
                      [class.is-invalid]="lastNameInput.invalid && lastNameInput.touched"
                      placeholder="Digite o sobrenome">
                    <div class="invalid-feedback" *ngIf="lastNameInput.invalid && lastNameInput.touched">
                      <span *ngIf="lastNameInput.errors?.['required']">Sobrenome é obrigatório</span>
                      <span *ngIf="lastNameInput.errors?.['maxlength']">Máximo 100 caracteres</span>
                    </div>
                  </div>

                  <!-- Password (apenas para criação) -->
                  <div class="col-md-6 mb-3" *ngIf="!isEditMode">
                    <label for="password" class="form-label">Senha *</label>
                    <div class="password-input">
                      <input
                        [type]="showPassword ? 'text' : 'password'"
                        id="password"
                        name="password"
                        class="form-control"
                        [(ngModel)]="user.password"
                        required
                        minlength="6"
                        #passwordInput="ngModel"
                        [class.is-invalid]="passwordInput.invalid && passwordInput.touched"
                        placeholder="Digite a senha">
                      <button
                        type="button"
                        class="password-toggle"
                        (click)="togglePasswordVisibility()">
                        <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                    <div class="invalid-feedback" *ngIf="passwordInput.invalid && passwordInput.touched">
                      <span *ngIf="passwordInput.errors?.['required']">Senha é obrigatória</span>
                      <span *ngIf="passwordInput.errors?.['minlength']">Mínimo 6 caracteres</span>
                    </div>
                    <div class="form-text">Mínimo 6 caracteres</div>
                  </div>

                  <!-- Role -->
                  <div class="col-md-6 mb-3">
                    <label for="role" class="form-label">Perfil de Acesso *</label>
                    <select
                      id="role"
                      name="role"
                      class="form-select"
                      [(ngModel)]="user.role"
                      required
                      #roleInput="ngModel"
                      [class.is-invalid]="roleInput.invalid && roleInput.touched">
                      <option value="">Selecione um perfil</option>
                      <option value="ADMIN">Administrador - Acesso total</option>
                      <option value="EDITOR">Editor - Pode editar dados</option>
                      <option value="VIEWER">Visualizador - Apenas leitura</option>
                    </select>
                    <div class="invalid-feedback" *ngIf="roleInput.invalid && roleInput.touched">
                      Perfil de acesso é obrigatório
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
                      #avatarInput="ngModel"
                      [class.is-invalid]="avatarInput.invalid && avatarInput.touched"
                      placeholder="https://exemplo.com/avatar.jpg">
                    <div class="form-text">
                      Deixe em branco para usar as iniciais do nome como avatar
                    </div>
                    <div class="invalid-feedback" *ngIf="avatarInput.invalid && avatarInput.touched">
                      URL inválida
                    </div>
                  </div>

                  <!-- Active Status (apenas para edição) -->
                  <div class="col-12 mb-3" *ngIf="isEditMode">
                    <div class="form-check">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        class="form-check-input"
                        [(ngModel)]="user.isActive">
                      <label for="isActive" class="form-check-label">
                        Usuário ativo
                      </label>
                    </div>
                    <div class="form-text">
                      Usuários inativos não podem fazer login no sistema
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

                <!-- Submit Buttons -->
                <div class="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    (click)="goBack()"
                    [disabled]="loading">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="userForm.invalid || loading">
                    <span class="spinner-border spinner-border-sm me-2" *ngIf="loading"></span>
                    <i [class]="isEditMode ? 'fas fa-save' : 'fas fa-plus'" class="me-2" *ngIf="!loading"></i>
                    {{ loading ? (isEditMode ? 'Salvando...' : 'Criando...') : (isEditMode ? 'Salvar Alterações' : 'Criar Usuário') }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Role Permissions Info -->
          <div class="card mt-4">
            <div class="card-header">
              <h6 class="mb-0">🎭 Permissões por Perfil</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <h6 class="text-danger">👑 Administrador</h6>
                  <ul class="list-unstyled small">
                    <li>✅ Gerenciar usuários</li>
                    <li>✅ CRUD completo de dados</li>
                    <li>✅ Gerenciar SSE</li>
                    <li>✅ Acesso total</li>
                  </ul>
                </div>
                <div class="col-md-4">
                  <h6 class="text-warning">✏️ Editor</h6>
                  <ul class="list-unstyled small">
                    <li>❌ Gerenciar usuários</li>
                    <li>✅ CRUD completo de dados</li>
                    <li>✅ Gerenciar SSE</li>
                    <li>✅ Ver próprio perfil</li>
                  </ul>
                </div>
                <div class="col-md-4">
                  <h6 class="text-info">👁️ Visualizador</h6>
                  <ul class="list-unstyled small">
                    <li>❌ Gerenciar usuários</li>
                    <li>👁️ Apenas visualizar dados</li>
                    <li>❌ Gerenciar SSE</li>
                    <li>✅ Ver próprio perfil</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid {
      max-width: 1000px;
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

    .password-input {
      position: relative;
    }

    .password-toggle {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      z-index: 10;
    }

    .password-toggle:hover {
      color: #333;
    }

    .form-control, .form-select {
      border-radius: 6px;
    }

    .form-control:focus, .form-select:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }

    .alert {
      border-radius: 6px;
    }

    .btn {
      border-radius: 6px;
    }

    .list-unstyled li {
      margin-bottom: 4px;
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
export class UserFormComponent implements OnInit {
  user: User = {
    id: 0,
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.VIEWER,
    avatarUrl: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    lastLogin: ''
  };

  isEditMode = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.params['id'];
    
    if (userId) {
      this.isEditMode = true;
      this.loadUser(parseInt(userId));
    }
  }

  private loadUser(id: number): void {
    this.loading = true;
    
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user = { ...user };
        this.loading = false;
        console.log('✅ Usuário carregado para edição:', user.username);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar usuário:', error);
        this.errorMessage = 'Erro ao carregar dados do usuário';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const operation = this.isEditMode ? 
      this.userService.updateUser(this.user.id!, this.user) :
      this.userService.createUser(this.user);

    operation.subscribe({
      next: (savedUser) => {
        const action = this.isEditMode ? 'atualizado' : 'criado';
        console.log(`✅ Usuário ${action} com sucesso:`, savedUser.username);
        
        this.successMessage = `Usuário ${action} com sucesso!`;
        this.loading = false;
        
        // Redirecionar após 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 1500);
      },
      error: (error) => {
        console.error(`❌ Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} usuário:`, error);
        
        if (error.status === 400 && error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = `Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} usuário. Tente novamente.`;
        }
        
        this.loading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}