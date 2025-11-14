import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

/**
 * Guard para proteger rotas baseado em roles de usuário.
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredRoles = route.data['roles'] as UserRole[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Sem restrição de role
    }

    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      console.warn('🔒 Usuário não autenticado para verificação de role');
      this.router.navigate(['/login']);
      return false;
    }

    const hasRequiredRole = requiredRoles.includes(currentUser.role);
    
    if (!hasRequiredRole) {
      console.warn(`🚫 Acesso negado. Role necessária: ${requiredRoles.join(', ')}, Role atual: ${currentUser.role}`);
      this.router.navigate(['/dashboard']); // Redirecionar para página principal
      return false;
    }

    return true;
  }
}