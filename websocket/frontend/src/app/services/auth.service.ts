import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, combineLatest } from 'rxjs';
import { map, catchError, tap, retry, timeout, filter, take, shareReplay } from 'rxjs/operators';
import { 
  AuthRequest, 
  AuthResponse, 
  User, 
  UserInfo, 
  UserRole, 
  TokenValidationResponse,
  PasswordChangeRequest 
} from '../models/auth.model';

/**
 * Serviço de autenticação para gerenciar login, logout e estado do usuário
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE = 'http://localhost:8080/api';
  private readonly TOKEN_KEY = 'sse-demo-token';
  private readonly USER_KEY = 'sse-demo-user';

  // Estado do usuário atual
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Estado de autenticação
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Estado de carregamento
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Estado de inicialização
  private initializationComplete = new BehaviorSubject<boolean>(false);
  public initializationComplete$ = this.initializationComplete.asObservable();

  // Estado do token
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  // Observable combinado para aguardar autenticação completa
  public authReady$ = combineLatest([
    this.initializationComplete$,
    this.isAuthenticated$,
    this.token$
  ]).pipe(
    map(([initialized, authenticated, token]) => {
      const ready = initialized && authenticated && !!token && !this.isCurrentTokenExpired();
      return ready;
    }),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  /**
   * Inicializa o estado de autenticação verificando token salvo
   */
  private initializeAuth(): void {
    const token = this.getTokenFromStorage();
    const savedUser = this.getSavedUser();

    if (token && savedUser) {
      // Verificar se o token não está expirado
      if (this.isTokenExpiredStrict(token)) {
        this.clearAuthData();
        this.initializationComplete.next(true);
        return;
      }
      
      // Definir estado inicial
      this.tokenSubject.next(token);
      this.currentUserSubject.next(savedUser);
      this.isAuthenticatedSubject.next(true);
      
      // Validar token com o servidor em background
      this.validateTokenInBackground(token);
      
      this.initializationComplete.next(true);
    } else {
      this.clearAuthData();
      this.initializationComplete.next(true);
    }
  }

  /**
   * Valida token em background sem bloquear a inicialização
   */
  private validateTokenInBackground(token: string): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<TokenValidationResponse>(`${this.API_BASE}/auth/validate`, { headers })
      .pipe(
        timeout(5000),
        catchError(() => of({ valid: false }))
      )
      .subscribe(response => {
        if (!response.valid) {
          this.forceLogout();
        }
      });
  }

  /**
   * Verifica se o token JWT está expirado
   */
  private isTokenExpiredStrict(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Margem de segurança de 30 segundos
      const expirationWithMargin = payload.exp - 30;
      return payload.exp && expirationWithMargin < now;
    } catch (error) {
      return true;
    }
  }

  /**
   * Verifica se o token atual está expirado
   */
  private isCurrentTokenExpired(): boolean {
    const token = this.tokenSubject.value;
    return token ? this.isTokenExpiredStrict(token) : true;
  }

  /**
   * Aguarda a inicialização completa do serviço
   */
  waitForInitialization(): Observable<boolean> {
    return this.initializationComplete$.pipe(
      filter(complete => complete),
      take(1)
    );
  }

  /**
   * Aguarda que a autenticação esteja completamente pronta
   */
  waitForAuthReady(): Observable<boolean> {
    return this.authReady$.pipe(
      filter(ready => ready),
      take(1)
    );
  }

  /**
   * Realiza login do usuário
   */
  login(credentials: AuthRequest): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE}/auth/login?lang=pt`, credentials)
      .pipe(
        timeout(10000),
        retry(1),
        tap(response => {
          this.setAuthData(response.token, response.user);
        }),
        catchError(error => {
          this.clearAuthData();
          return throwError(() => error);
        }),
        tap(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Realiza logout do usuário
   */
  logout(): Observable<any> {
    return this.http.post(`${this.API_BASE}/auth/logout?lang=pt`, {})
      .pipe(
        timeout(5000),
        catchError(() => of(null)),
        tap(() => this.clearAuthData())
      );
  }

  /**
   * Valida token atual com o servidor
   */
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    if (this.isTokenExpiredStrict(token)) {
      this.forceLogout();
      return of(false);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<TokenValidationResponse>(`${this.API_BASE}/auth/validate`, { headers })
      .pipe(
        timeout(5000),
        map(response => {
          if (!response.valid) {
            this.forceLogout();
          }
          return response.valid;
        }),
        catchError(error => {
          if (error.status === 401) {
            this.forceLogout();
          }
          return of(false);
        })
      );
  }

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated(): boolean {
    const isAuth = this.isAuthenticatedSubject.value;
    const hasToken = !!this.getToken();
    const hasUser = !!this.getSavedUser();
    const tokenValid = !this.isCurrentTokenExpired();
    
    const result = isAuth && hasToken && hasUser && tokenValid;
    
    // Se o token expirou, limpar automaticamente
    if (hasToken && !tokenValid) {
      this.forceLogout();
    }
    
    return result;
  }

  /**
   * Obtém usuário atual
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtém role do usuário atual
   */
  getCurrentUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  /**
   * Verifica se usuário tem uma role específica
   */
  hasRole(role: UserRole): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole === role;
  }

  /**
   * Verifica se usuário tem uma das roles especificadas
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole ? roles.includes(currentRole) : false;
  }

  /**
   * Verifica se usuário é admin
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  /**
   * Verifica se usuário é editor
   */
  isEditor(): boolean {
    return this.hasRole(UserRole.EDITOR);
  }

  /**
   * Verifica se usuário é viewer
   */
  isViewer(): boolean {
    return this.hasRole(UserRole.VIEWER);
  }

  /**
   * Verifica se usuário pode editar dados
   */
  canEditData(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.EDITOR]);
  }

  /**
   * Verifica se usuário pode gerenciar usuários
   */
  canManageUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Obtém token JWT
   */
  getToken(): string | null {
    let token = this.tokenSubject.value;
    
    if (!token) {
      token = this.getTokenFromStorage();
      if (token) {
        if (!this.isTokenExpiredStrict(token)) {
          this.tokenSubject.next(token);
        } else {
          this.forceLogout();
          return null;
        }
      }
    } else {
      if (this.isTokenExpiredStrict(token)) {
        this.forceLogout();
        return null;
      }
    }
    
    return token;
  }

  /**
   * Obtém token do localStorage
   */
  private getTokenFromStorage(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtém header de autorização
   */
  getAuthHeader(): string | null {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Salva dados de autenticação
   */
  private setAuthData(token: string, user: UserInfo): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.saveUser(user);
      
      this.tokenSubject.next(token);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
    }
  }

  /**
   * Salva dados do usuário
   */
  private saveUser(user: UserInfo): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  }

  /**
   * Obtém usuário salvo
   */
  private getSavedUser(): UserInfo | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Limpa dados de autenticação
   */
  private clearAuthData(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
    
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Força logout (para casos de token expirado)
   */
  forceLogout(): void {
    this.clearAuthData();
  }

  // Métodos adicionais
  updateProfile(user: User): Observable<User> {
    return this.http.put<User>(`${this.API_BASE}/profile?lang=pt`, user);
  }

  changePassword(passwordRequest: PasswordChangeRequest): Observable<any> {
    return this.http.put(`${this.API_BASE}/profile/password?lang=pt`, passwordRequest);
  }

  getCurrentUserFromServer(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.API_BASE}/auth/me?lang=pt`);
  }
}