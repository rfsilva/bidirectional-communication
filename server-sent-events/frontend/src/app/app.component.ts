import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { UserInfo } from './models/auth.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, UserAvatarComponent],
  template: `
    <div class="app-container">
      <!-- Header (apenas para páginas autenticadas) -->
      <header class="app-header" *ngIf="showHeader">
        <div class="container-fluid">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <h4 class="mb-0 me-3">
                <span class="text-primary">📡</span> SSE Demo
              </h4>
              <nav class="nav">
                <a class="nav-link" [routerLink]="['/dashboard']" routerLinkActive="active">
                  <i class="fas fa-tachometer-alt me-1"></i>Dashboard
                </a>
                <a class="nav-link" [routerLink]="['/profile']" routerLinkActive="active">
                  <i class="fas fa-user me-1"></i>Perfil
                </a>
                <a class="nav-link" 
                   [routerLink]="['/users']" 
                   routerLinkActive="active"
                   *ngIf="canManageUsers()">
                  <i class="fas fa-users me-1"></i>Usuários
                </a>
              </nav>
            </div>
            <app-user-avatar></app-user-avatar>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-main" [class.with-header]="showHeader">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background-color: #f8f9fa;
    }

    .app-header {
      background: white;
      border-bottom: 1px solid #dee2e6;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 1rem 0;
    }

    .app-main {
      min-height: calc(100vh - 80px);
    }

    .app-main.with-header {
      min-height: calc(100vh - 80px);
    }

    .nav-link {
      color: #6c757d;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .nav-link:hover {
      color: #0d6efd;
      background-color: rgba(13, 110, 253, 0.1);
    }

    .nav-link.active {
      color: #0d6efd;
      background-color: rgba(13, 110, 253, 0.1);
      font-weight: 600;
    }

    .container-fluid {
      max-width: 1400px;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .app-header .d-flex {
        flex-direction: column;
        gap: 1rem;
      }

      .nav {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .nav-link {
        padding: 0.5rem;
        font-size: 0.8rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'SSE Demo - Server-Sent Events';
  showHeader = false;
  currentUser: UserInfo | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Observar mudanças de rota para mostrar/ocultar header
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.showHeader = !event.url.includes('/login');
        }
      });

    // Observar mudanças no usuário atual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  canManageUsers(): boolean {
    return this.authService.canManageUsers();
  }
}