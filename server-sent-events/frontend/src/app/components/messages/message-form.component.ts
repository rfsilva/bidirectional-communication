import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { 
  Message, 
  MessageCreateRequest, 
  MessageUpdateRequest, 
  MessageType, 
  Priority, 
  MessageUtils 
} from '../../models/message.model';
import { User, UserRole } from '../../models/auth.model';

@Component({
  selector: 'app-message-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="message-form-container">
      <div class="form-header">
        <h2>{{ isEditMode ? 'Editar Mensagem' : 'Nova Mensagem' }}</h2>
        <button type="button" class="btn-close" (click)="goBack()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Carregando...
      </div>

      <div *ngIf="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
      </div>

      <form *ngIf="!loading" (ngSubmit)="onSubmit()" #messageForm="ngForm">
        
        <!-- Seleção de Usuário (apenas para ADMIN) -->
        <div class="form-group" *ngIf="canSelectUser()">
          <label for="userId">Usuário Destinatário *</label>
          <select 
            id="userId" 
            name="userId" 
            [(ngModel)]="formData.userId" 
            required 
            class="form-control"
            [disabled]="isEditMode">
            <option value="">Selecione um usuário</option>
            <option *ngFor="let user of users" [value]="user.id">
              {{ user.fullName }} ({{ user.username }})
            </option>
          </select>
        </div>

        <!-- Título -->
        <div class="form-group">
          <label for="title">Título *</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            [(ngModel)]="formData.title" 
            required 
            maxlength="200"
            class="form-control"
            placeholder="Digite o título da mensagem">
          <small class="form-text">{{ formData.title?.length || 0 }}/200 caracteres</small>
        </div>

        <!-- Conteúdo -->
        <div class="form-group">
          <label for="content">Conteúdo *</label>
          <textarea 
            id="content" 
            name="content" 
            [(ngModel)]="formData.content" 
            required 
            maxlength="1000"
            rows="6"
            class="form-control"
            placeholder="Digite o conteúdo da mensagem"></textarea>
          <small class="form-text">{{ formData.content?.length || 0 }}/1000 caracteres</small>
        </div>

        <!-- Tipo -->
        <div class="form-group">
          <label for="type">Tipo</label>
          <select 
            id="type" 
            name="type" 
            [(ngModel)]="formData.type" 
            class="form-control">
            <option *ngFor="let type of messageTypes" [value]="type">
              {{ MessageUtils.getTypeDisplayName(type) }}
            </option>
          </select>
        </div>

        <!-- Prioridade -->
        <div class="form-group">
          <label for="priority">Prioridade</label>
          <select 
            id="priority" 
            name="priority" 
            [(ngModel)]="formData.priority" 
            class="form-control">
            <option *ngFor="let priority of priorities" [value]="priority">
              {{ MessageUtils.getPriorityDisplayName(priority) }}
            </option>
          </select>
        </div>

        <!-- Botões -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Cancelar
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            [disabled]="!messageForm.form.valid || submitting">
            <i class="fas" [class.fa-spinner]="submitting" [class.fa-spin]="submitting" 
               [class.fa-save]="!submitting"></i>
            {{ submitting ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Criar') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .message-form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .form-header h2 {
      margin: 0;
      color: #333;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #666;
      cursor: pointer;
      padding: 5px;
    }

    .btn-close:hover {
      color: #333;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
      border: 1px solid #f5c6cb;
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
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .form-text {
      display: block;
      margin-top: 5px;
      color: #666;
      font-size: 12px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 120px;
    }

    @media (max-width: 768px) {
      .message-form-container {
        margin: 10px;
        padding: 15px;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class MessageFormComponent implements OnInit {
  
  isEditMode = false;
  messageId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  
  users: User[] = [];
  messageTypes = Object.values(MessageType);
  priorities = Object.values(Priority);
  
  formData: any = {
    userId: null,
    title: '',
    content: '',
    type: MessageType.INFO,
    priority: Priority.NORMAL
  };

  MessageUtils = MessageUtils;

  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar se é modo de edição
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.messageId = parseInt(id, 10);
      this.loadMessage();
    } else {
      // Modo criação - definir usuário atual se não for ADMIN
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && !this.canSelectUser()) {
        this.formData.userId = currentUser.id;
      }
    }

    // Carregar usuários se for ADMIN
    if (this.canSelectUser()) {
      this.loadUsers();
    }
  }

  /**
   * Carrega mensagem para edição.
   */
  loadMessage(): void {
    if (!this.messageId) return;

    this.loading = true;
    this.error = null;

    this.messageService.getMessageById(this.messageId).subscribe({
      next: (message) => {
        this.formData = {
          userId: message.userId,
          title: message.title,
          content: message.content,
          type: message.type,
          priority: message.priority
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar mensagem:', error);
        this.error = 'Erro ao carregar mensagem. Verifique se você tem permissão para acessá-la.';
        this.loading = false;
      }
    });
  }

  /**
   * Carrega lista de usuários (apenas para ADMIN).
   */
  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
      }
    });
  }

  /**
   * Submete o formulário.
   */
  onSubmit(): void {
    if (this.submitting) return;

    this.submitting = true;
    this.error = null;

    if (this.isEditMode && this.messageId) {
      // Atualizar mensagem existente
      const updateRequest: MessageUpdateRequest = {
        title: this.formData.title,
        content: this.formData.content,
        type: this.formData.type,
        priority: this.formData.priority
      };

      this.messageService.updateMessage(this.messageId, updateRequest).subscribe({
        next: () => {
          this.router.navigate(['/messages']);
        },
        error: (error) => {
          console.error('Erro ao atualizar mensagem:', error);
          this.error = 'Erro ao atualizar mensagem. Tente novamente.';
          this.submitting = false;
        }
      });
    } else {
      // Criar nova mensagem
      const createRequest: MessageCreateRequest = {
        userId: this.formData.userId,
        title: this.formData.title,
        content: this.formData.content,
        type: this.formData.type,
        priority: this.formData.priority
      };

      this.messageService.createMessage(createRequest).subscribe({
        next: () => {
          this.router.navigate(['/messages']);
        },
        error: (error) => {
          console.error('Erro ao criar mensagem:', error);
          this.error = 'Erro ao criar mensagem. Tente novamente.';
          this.submitting = false;
        }
      });
    }
  }

  /**
   * Volta para a lista de mensagens.
   */
  goBack(): void {
    this.router.navigate(['/messages']);
  }

  /**
   * Verifica se usuário pode selecionar destinatário.
   */
  canSelectUser(): boolean {
    return this.authService.hasRole(UserRole.ADMIN);
  }
}