import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordChangeRequest, UserInfo } from '../../models/auth.model';

/**
 * Componente para alteração de senha do usuário.
 */
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🔑 Alterar Senha</h2>
          <p class="text-muted">Altere sua senha de acesso ao sistema</p>
        </div>
        <button class="btn btn-outline-secondary" (click)="goBack()">
          <i class="fas fa-arrow-left me-2"></i>Voltar
        </button>
      </div>

      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Nova Senha</h5>
            </div>
            <div class="card-body">
              <form (ngSubmit)="onSubmit()" #passwordForm="ngForm">
                <!-- Current Password -->
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Senha Atual</label>
                  <div class="password-input">
                    <input
                      [type]="showCurrentPassword ? 'text' : 'password'"
                      id="currentPassword"
                      name="currentPassword"
                      class="form-control"
                      [(ngModel)]="passwordRequest.currentPassword"
                      required
                      #currentPasswordInput="ngModel"
                      [class.is-invalid]="currentPasswordInput.invalid && currentPasswordInput.touched"
                      placeholder="Digite sua senha atual">
                    <button
                      type="button"
                      class="password-toggle"
                      (click)="toggleCurrentPasswordVisibility()">
                      <i [class]="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" *ngIf="currentPasswordInput.invalid && currentPasswordInput.touched">
                    Senha atual é obrigatória
                  </div>
                </div>

                <!-- New Password -->
                <div class="mb-3">
                  <label for="newPassword" class="form-label">Nova Senha</label>
                  <div class="password-input">
                    <input
                      [type]="showNewPassword ? 'text' : 'password'"
                      id="newPassword"
                      name="newPassword"
                      class="form-control"
                      [(ngModel)]="passwordRequest.newPassword"
                      required
                      minlength="6"
                      #newPasswordInput="ngModel"
                      [class.is-invalid]="newPasswordInput.invalid && newPasswordInput.touched"
                      placeholder="Digite sua nova senha">
                    <button
                      type="button"
                      class="password-toggle"
                      (click)="toggleNewPasswordVisibility()">
                      <i [class]="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" *ngIf="newPasswordInput.invalid && newPasswordInput.touched">
                    <span *ngIf="newPasswordInput.errors?.['required']">Nova senha é obrigatória</span>
                    <span *ngIf="newPasswordInput.errors?.['minlength']">Nova senha deve ter pelo menos 6 caracteres</span>
                  </div>
                  <div class="form-text">
                    A senha deve ter pelo menos 6 caracteres
                  </div>
                </div>

                <!-- Confirm Password -->
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirmar Nova Senha</label>
                  <div class="password-input">
                    <input
                      [type]="showConfirmPassword ? 'text' : 'password'"
                      id="confirmPassword"
                      name="confirmPassword"
                      class="form-control"
                      [(ngModel)]="passwordRequest.confirmPassword"
                      required
                      #confirmPasswordInput="ngModel"
                      [class.is-invalid]="(confirmPasswordInput.invalid && confirmPasswordInput.touched) || (passwordRequest.newPassword !== passwordRequest.confirmPassword && confirmPasswordInput.touched)"
                      placeholder="Confirme sua nova senha">
                    <button
                      type="button"
                      class="password-toggle"
                      (click)="toggleConfirmPasswordVisibility()">
                      <i [class]="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" *ngIf="confirmPasswordInput.invalid && confirmPasswordInput.touched">
                    Confirmação de senha é obrigatória
                  </div>
                  <div class="invalid-feedback" *ngIf="passwordRequest.newPassword !== passwordRequest.confirmPassword && confirmPasswordInput.touched">
                    As senhas não conferem
                  </div>
                </div>

                <!-- Password Strength Indicator -->
                <div class="mb-3" *ngIf="passwordRequest.newPassword">
                  <small class="text-muted">Força da senha:</small>
                  <div class="progress" style="height: 5px;">
                    <div 
                      class="progress-bar" 
                      [class]="getPasswordStrengthClass()"
                      [style.width.%]="getPasswordStrength()">
                    </div>
                  </div>
                  <small [class]="getPasswordStrengthTextClass()">
                    {{ getPasswordStrengthText() }}
                  </small>
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
                <div class="d-grid">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="passwordForm.invalid || loading || passwordRequest.newPassword !== passwordRequest.confirmPassword">
                    <span class="spinner-border spinner-border-sm me-2" *ngIf="loading"></span>
                    <i class="fas fa-key me-2" *ngIf="!loading"></i>
                    {{ loading ? 'Alterando...' : 'Alterar Senha' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Security Tips -->
          <div class="card mt-4">
            <div class="card-header">
              <h6 class="mb-0">🛡️ Dicas de Segurança</h6>
            </div>
            <div class="card-body">
              <ul class="list-unstyled mb-0">
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  Use pelo menos 6 caracteres
                </li>
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  Combine letras maiúsculas e minúsculas
                </li>
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  Inclua números e símbolos
                </li>
                <li class="mb-2">
                  <i class="fas fa-check text-success me-2"></i>
                  Evite informações pessoais óbvias
                </li>
                <li>
                  <i class="fas fa-check text-success me-2"></i>
                  Não reutilize senhas de outros serviços
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid {
      max-width: 800px;
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

    .form-control {
      padding-right: 45px;
    }

    .form-control:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }

    .progress {
      border-radius: 3px;
    }

    .progress-bar {
      transition: width 0.3s ease;
    }

    .bg-danger { background-color: #dc3545 !important; }
    .bg-warning { background-color: #ffc107 !important; }
    .bg-success { background-color: #198754 !important; }

    .text-danger { color: #dc3545 !important; }
    .text-warning { color: #ffc107 !important; }
    .text-success { color: #198754 !important; }

    .alert {
      border-radius: 6px;
    }

    .btn {
      border-radius: 6px;
    }

    .list-unstyled li {
      font-size: 0.9em;
    }

    @media (max-width: 768px) {
      .container-fluid {
        padding: 10px;
      }
      
      .d-flex.justify-content-between {
        flex-direction: column;
        gap: 15px;
      }
    }
  `]
})
export class ChangePasswordComponent {
  passwordRequest: PasswordChangeRequest = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';
  
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  currentUser: UserInfo | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  onSubmit(): void {
    if (this.passwordRequest.newPassword !== this.passwordRequest.confirmPassword) {
      this.errorMessage = 'As senhas não conferem';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.changePassword(this.passwordRequest).subscribe({
      next: (response) => {
        console.log('✅ Senha alterada com sucesso');
        this.successMessage = 'Senha alterada com sucesso!';
        this.loading = false;
        
        // Limpar formulário
        this.passwordRequest = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Erro ao alterar senha:', error);
        
        if (error.status === 400 && error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Erro ao alterar senha. Tente novamente.';
        }
        
        this.loading = false;
      }
    });
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): number {
    const password = this.passwordRequest.newPassword;
    if (!password) return 0;

    let strength = 0;
    
    // Length
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;
    if (password.length >= 12) strength += 10;
    
    // Character types
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;

    return Math.min(strength, 100);
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 40) return 'bg-danger';
    if (strength < 70) return 'bg-warning';
    return 'bg-success';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength < 40) return 'Fraca';
    if (strength < 70) return 'Média';
    return 'Forte';
  }

  getPasswordStrengthTextClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 40) return 'text-danger';
    if (strength < 70) return 'text-warning';
    return 'text-success';
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}