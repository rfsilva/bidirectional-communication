import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthRequest } from '../../models/auth.model';

/**
 * Componente de login para autenticação de usuários.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>🔐 SSE Demo</h2>
          <p>Faça login para acessar o sistema</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <!-- Campo de Login -->
          <div class="form-group">
            <label for="login">Usuário ou Email</label>
            <input
              type="text"
              id="login"
              name="login"
              class="form-control"
              [(ngModel)]="credentials.login"
              required
              #loginInput="ngModel"
              [class.is-invalid]="loginInput.invalid && loginInput.touched"
              placeholder="Digite seu usuário ou email"
              autocomplete="username">
            <div class="invalid-feedback" *ngIf="loginInput.invalid && loginInput.touched">
              Usuário ou email é obrigatório
            </div>
          </div>

          <!-- Campo de Senha -->
          <div class="form-group">
            <label for="password">Senha</label>
            <div class="password-input">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                class="form-control"
                [(ngModel)]="credentials.password"
                required
                #passwordInput="ngModel"
                [class.is-invalid]="passwordInput.invalid && passwordInput.touched"
                placeholder="Digite sua senha"
                autocomplete="current-password">
              <button
                type="button"
                class="password-toggle"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <div class="invalid-feedback" *ngIf="passwordInput.invalid && passwordInput.touched">
              Senha é obrigatória
            </div>
          </div>

          <!-- Mensagem de Erro -->
          <div class="alert alert-danger" *ngIf="errorMessage">
            <strong>❌ Erro:</strong> {{ errorMessage }}
          </div>

          <!-- Botão de Login -->
          <button
            type="submit"
            class="btn btn-primary btn-login"
            [disabled]="loginForm.invalid || loading">
            <span class="spinner-border spinner-border-sm me-2" *ngIf="loading"></span>
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <!-- Informações de Teste -->
        <div class="test-accounts">
          <h6>👥 Contas de Teste:</h6>
          <div class="account-info">
            <div class="account-item" (click)="fillCredentials('admin', 'admin123')">
              <strong>Admin:</strong> admin / admin123
              <span class="badge bg-danger">ADMIN</span>
            </div>
            <div class="account-item" (click)="fillCredentials('editor', 'editor123')">
              <strong>Editor:</strong> editor / editor123
              <span class="badge bg-warning">EDITOR</span>
            </div>
            <div class="account-item" (click)="fillCredentials('viewer1', 'viewer123')">
              <strong>Viewer:</strong> viewer1 / viewer123
              <span class="badge bg-info">VIEWER</span>
            </div>
          </div>
          <small class="text-muted">Clique em uma conta para preencher automaticamente</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 15px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-header h2 {
      color: #333;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .login-header p {
      color: #666;
      margin: 0;
    }

    .login-form {
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
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
      font-size: 18px;
      color: #666;
    }

    .password-toggle:hover {
      color: #333;
    }

    .invalid-feedback {
      display: block;
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }

    .alert {
      padding: 12px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .alert-danger {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .btn-login {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .btn-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .test-accounts {
      border-top: 1px solid #e1e5e9;
      padding-top: 20px;
    }

    .test-accounts h6 {
      margin-bottom: 15px;
      color: #333;
      font-weight: 600;
    }

    .account-info {
      margin-bottom: 10px;
    }

    .account-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      margin-bottom: 5px;
      background: #f8f9fa;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-size: 14px;
    }

    .account-item:hover {
      background: #e9ecef;
    }

    .badge {
      font-size: 10px;
      padding: 4px 8px;
    }

    .text-muted {
      color: #6c757d;
      font-size: 12px;
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 30px 20px;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  credentials: AuthRequest = {
    login: '',
    password: ''
  };

  loading = false;
  errorMessage = '';
  showPassword = false;
  returnUrl = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Se já está logado, redirecionar
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Obter URL de retorno
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (!this.credentials.login || !this.credentials.password) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('✅ Login realizado com sucesso:', response.user.username);
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error('❌ Erro no login:', error);
        
        if (error.status === 401) {
          this.errorMessage = 'Usuário ou senha incorretos';
        } else if (error.status === 0) {
          this.errorMessage = 'Erro de conexão. Verifique se o servidor está rodando';
        } else {
          this.errorMessage = error.error?.message || 'Erro interno do servidor';
        }
        
        this.loading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fillCredentials(username: string, password: string): void {
    this.credentials.login = username;
    this.credentials.password = password;
    this.errorMessage = '';
  }
}