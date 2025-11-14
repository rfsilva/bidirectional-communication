import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rotas que requerem autenticação.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    // Se já está autenticado localmente, verificar com servidor
    if (this.authService.isAuthenticated()) {
      return this.authService.validateToken().pipe(
        map(isValid => {
          if (isValid) {
            return true;
          } else {
            console.warn('🔒 Token inválido, redirecionando para login');
            this.authService.forceLogout();
            this.router.navigate(['/login'], { queryParams: { returnUrl: url } });
            return false;
          }
        }),
        catchError(() => {
          console.warn('🔒 Erro na validação do token, redirecionando para login');
          this.authService.forceLogout();
          this.router.navigate(['/login'], { queryParams: { returnUrl: url } });
          return of(false);
        })
      );
    }

    // Não autenticado, redirecionar para login
    console.log('🔒 Usuário não autenticado, redirecionando para login');
    this.router.navigate(['/login'], { queryParams: { returnUrl: url } });
    return of(false);
  }
}