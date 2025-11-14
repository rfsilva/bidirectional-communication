import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './models/auth.model';

export const routes: Routes = [
  // Rota pública de login
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    title: 'Login - SSE Demo'
  },

  // Dashboard principal (protegido por autenticação)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    title: 'Dashboard - SSE Demo'
  },

  // Perfil do usuário (todos os usuários autenticados)
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard],
    title: 'Meu Perfil - SSE Demo'
  },

  // Alteração de senha (todos os usuários autenticados)
  {
    path: 'profile/password',
    loadComponent: () => import('./components/profile/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [AuthGuard],
    title: 'Alterar Senha - SSE Demo'
  },

  // Gerenciamento de usuários (apenas ADMIN)
  {
    path: 'users',
    loadComponent: () => import('./components/users/user-list.component').then(m => m.UserListComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    title: 'Gerenciar Usuários - SSE Demo'
  },

  // Criar usuário (apenas ADMIN)
  {
    path: 'users/create',
    loadComponent: () => import('./components/users/user-form.component').then(m => m.UserFormComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    title: 'Criar Usuário - SSE Demo'
  },

  // Editar usuário (apenas ADMIN)
  {
    path: 'users/:id/edit',
    loadComponent: () => import('./components/users/user-form.component').then(m => m.UserFormComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    title: 'Editar Usuário - SSE Demo'
  },

  // Teste de componente I18N (todos os usuários autenticados)
  {
    path: 'language-test',
    loadComponent: () => import('./components/language-test/language-test.component').then(m => m.LanguageTestComponent),
    canActivate: [AuthGuard],
    title: 'Teste I18N - SSE Demo'
  },

  // Redirecionamentos
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];