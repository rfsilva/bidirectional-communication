// Modelos para autenticação e usuários

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string; // Opcional, usado apenas na criação
  firstName: string;
  lastName: string;
  fullName?: string;
  initials?: string;
  role: UserRole;
  roleName?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

export interface AuthRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserInfo;
  authenticatedAt: string;
  expiresIn: number;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  fullName: string;
  initials: string;
  role: UserRole;
  roleName: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: {
    username: string;
    role: string;
    expiresIn: number;
  };
  message?: string;
}

// Permissões por role
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewData: true,
    canCreateData: true,
    canEditData: true,
    canDeleteData: true,
    canViewSSE: true,
    canManageSSE: true
  },
  [UserRole.EDITOR]: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewData: true,
    canCreateData: true,
    canEditData: true,
    canDeleteData: true,
    canViewSSE: true,
    canManageSSE: true
  },
  [UserRole.VIEWER]: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewData: true,
    canCreateData: false,
    canEditData: false,
    canDeleteData: false,
    canViewSSE: true,
    canManageSSE: false
  }
};

// Utilitários para verificação de permissões
export class PermissionUtils {
  static hasPermission(userRole: UserRole, permission: keyof typeof ROLE_PERMISSIONS[UserRole.ADMIN]): boolean {
    return ROLE_PERMISSIONS[userRole]?.[permission] || false;
  }

  static canAccessUserManagement(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN;
  }

  static canEditData(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN || userRole === UserRole.EDITOR;
  }

  static canViewData(userRole: UserRole): boolean {
    return Object.values(UserRole).includes(userRole);
  }

  static getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.EDITOR]: 'Editor',
      [UserRole.VIEWER]: 'Visualizador'
    };
    return roleNames[role] || role;
  }

  static getRoleColor(role: UserRole): string {
    const roleColors = {
      [UserRole.ADMIN]: 'danger',
      [UserRole.EDITOR]: 'warning',
      [UserRole.VIEWER]: 'info'
    };
    return roleColors[role] || 'secondary';
  }
}