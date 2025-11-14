import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { User, UserRole, PermissionUtils } from '../../models/auth.model';

/**
 * Componente para listagem e gerenciamento de usuários (apenas ADMIN).
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent],
  template: `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👥 Gerenciar Usuários</h2>
          <p class="text-muted">Administração de usuários do sistema</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left me-2"></i>Voltar
          </button>
          <button class="btn btn-success" (click)="createUser()">
            <i class="fas fa-plus me-2"></i>Novo Usuário
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4" *ngIf="stats">
        <div class="col-md-3">
          <div class="card stats-card">
            <div class="card-body text-center">
              <div class="stat-number">{{ stats.totalUsers }}</div>
              <div class="stat-label">Total de Usuários</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stats-card">
            <div class="card-body text-center">
              <div class="stat-number text-danger">{{ stats.adminCount }}</div>
              <div class="stat-label">Administradores</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stats-card">
            <div class="card-body text-center">
              <div class="stat-number text-warning">{{ stats.editorCount }}</div>
              <div class="stat-label">Editores</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card stats-card">
            <div class="card-body text-center">
              <div class="stat-number text-info">{{ stats.viewerCount }}</div>
              <div class="stat-label">Visualizadores</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Filtrar por Role</label>
              <select class="form-select" [(ngModel)]="selectedRole" (change)="filterUsers()">
                <option value="">Todos os perfis</option>
                <option value="ADMIN">Administradores</option>
                <option value="EDITOR">Editores</option>
                <option value="VIEWER">Visualizadores</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Filtrar por Status</label>
              <select class="form-select" [(ngModel)]="selectedStatus" (change)="filterUsers()">
                <option value="">Todos os status</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Buscar</label>
              <input 
                type="text" 
                class="form-control" 
                placeholder="Nome ou email..."
                [(ngModel)]="searchTerm"
                (input)="filterUsers()">
            </div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            Lista de Usuários 
            <span class="badge bg-primary ms-2">{{ filteredUsers.length }}</span>
          </h5>
        </div>
        <div class="card-body">
          <!-- Loading -->
          <div class="text-center py-4" *ngIf="loading">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-2">Carregando usuários...</p>
          </div>

          <!-- Error -->
          <div class="alert alert-danger" *ngIf="errorMessage">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ errorMessage }}
          </div>

          <!-- Empty State -->
          <div class="text-center py-4" *ngIf="!loading && filteredUsers.length === 0">
            <i class="fas fa-users fa-3x text-muted mb-3"></i>
            <h5>Nenhum usuário encontrado</h5>
            <p class="text-muted">Não há usuários que correspondam aos filtros aplicados.</p>
          </div>

          <!-- Users List -->
          <div class="table-responsive" *ngIf="!loading && filteredUsers.length > 0">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Último Login</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers">
                  <!-- User Info -->
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="user-avatar me-3">
                        <img 
                          *ngIf="user.avatarUrl" 
                          [src]="user.avatarUrl" 
                          [alt]="user.firstName + ' ' + user.lastName"
                          class="avatar-img"
                          (error)="onAvatarError($event)">
                        <div 
                          *ngIf="!user.avatarUrl" 
                          class="avatar-initials"
                          [class]="'bg-' + getRoleColor(user.role)">
                          {{ getInitials(user.firstName, user.lastName) }}
                        </div>
                      </div>
                      <div>
                        <div class="fw-bold">{{ user.firstName }} {{ user.lastName }}</div>
                        <small class="text-muted">{{ '@' + user.username }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Email -->
                  <td>{{ user.email }}</td>

                  <!-- Role -->
                  <td>
                    <span class="badge" [class]="'bg-' + getRoleColor(user.role)">
                      {{ getRoleDisplayName(user.role) }}
                    </span>
                  </td>

                  <!-- Status -->
                  <td>
                    <span class="badge" [class]="user.isActive ? 'bg-success' : 'bg-danger'">
                      {{ user.isActive ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>

                  <!-- Last Login -->
                  <td>
                    <span *ngIf="user.lastLogin">{{ formatDate(user.lastLogin) }}</span>
                    <span *ngIf="!user.lastLogin" class="text-muted">Nunca</span>
                  </td>

                  <!-- Actions -->
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-primary"
                        (click)="editUser(user.id!)"
                        title="Editar usuário">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        *ngIf="user.isActive"
                        class="btn btn-outline-warning"
                        (click)="toggleUserStatus(user)"
                        title="Desativar usuário"
                        [disabled]="isCurrentUser(user.id!)">
                        <i class="fas fa-user-slash"></i>
                      </button>
                      <button 
                        *ngIf="!user.isActive"
                        class="btn btn-outline-success"
                        (click)="toggleUserStatus(user)"
                        title="Ativar usuário">
                        <i class="fas fa-user-check"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid {
      max-width: 1400px;
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

    .stats-card {
      transition: transform 0.2s ease;
    }

    .stats-card:hover {
      transform: translateY(-2px);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      position: relative;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
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
      font-size: 14px;
    }

    .table th {
      border-top: none;
      font-weight: 600;
      color: #333;
    }

    .table td {
      vertical-align: middle;
    }

    .badge {
      font-size: 0.75em;
    }

    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
    }

    /* Role colors */
    .bg-danger { background-color: #dc3545 !important; }
    .bg-warning { background-color: #ffc107 !important; color: #000 !important; }
    .bg-info { background-color: #0dcaf0 !important; }

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

      .table-responsive {
        font-size: 0.9rem;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
      }

      .avatar-initials {
        font-size: 12px;
      }
    }
  `]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  stats: any = null;
  
  loading = false;
  errorMessage = '';
  
  // Filters
  selectedRole = '';
  selectedStatus = '';
  searchTerm = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  private loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
        console.log('✅ Usuários carregados:', users.length);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar usuários:', error);
        this.errorMessage = 'Erro ao carregar usuários';
        this.loading = false;
      }
    });
  }

  private loadStats(): void {
    this.userService.getUserStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        console.log('📊 Estatísticas carregadas:', stats);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar estatísticas:', error);
      }
    });
  }

  filterUsers(): void {
    let filtered = [...this.users];

    // Filter by role
    if (this.selectedRole) {
      filtered = filtered.filter(user => user.role === this.selectedRole);
    }

    // Filter by status
    if (this.selectedStatus !== '') {
      const isActive = this.selectedStatus === 'true';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = filtered;
  }

  createUser(): void {
    this.router.navigate(['/users/create']);
  }

  editUser(userId: number): void {
    this.router.navigate(['/users', userId, 'edit']);
  }

  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'desativar' : 'ativar';
    const confirmMessage = `Tem certeza que deseja ${action} o usuário ${user.firstName} ${user.lastName}?`;
    
    if (confirm(confirmMessage)) {
      const operation = user.isActive ? 
        this.userService.deactivateUser(user.id!) : 
        this.userService.activateUser(user.id!);

      operation.subscribe({
        next: () => {
          console.log(`✅ Usuário ${action}do com sucesso`);
          user.isActive = !user.isActive;
          this.loadStats(); // Reload stats
        },
        error: (error) => {
          console.error(`❌ Erro ao ${action} usuário:`, error);
          alert(`Erro ao ${action} usuário`);
        }
      });
    }
  }

  isCurrentUser(userId: number): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id === userId;
  }

  getRoleColor(role: UserRole): string {
    return PermissionUtils.getRoleColor(role);
  }

  getRoleDisplayName(role: UserRole): string {
    return PermissionUtils.getRoleDisplayName(role);
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  }

  onAvatarError(event: any): void {
    event.target.style.display = 'none';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}