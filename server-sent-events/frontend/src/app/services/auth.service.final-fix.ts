import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer, combineLatest } from 'rxjs';
import { map, catchError, tap, switchMap, retry, timeout, filter, take, shareReplay } from 'rxjs/operators';
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
 * Serviço de autenticação com correção definitiva para tokens expirados
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
      console.log('🔐 AuthService: Auth ready status:', { 
        initialized, 
        authenticated, 
        hasToken: !!token, 
        tokenExpired: this.isCurrentTokenExpired(),
        ready 
      });
      return ready;
    }),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {
    console.log('🔐 AuthService: Inicializando com verificação rigorosa de expiração...');
    this.initializeAuth();
  }

  /**
   * Inicializa o estado de autenticação verificando token salvo.
   */
  private initializeAuth(): void {
    console.log('🔐 AuthService: Verificando autenticação salva...');
    
    const token = this.getTokenFromStorage();
    const savedUser = this.getSavedUser();

    if (token && savedUser) {
      console.log('🔐 AuthService: Token e usuário encontrados, verificando expiração rigorosamente...');
      
      // VERIFICAÇÃO RIGOROSA DE EXPIRAÇÃO
      if (this.isTokenExpiredStrict(token)) {
        console.error('⚠️ AuthService: Token EXPIRADO detectado na inicialização, limpando dados');
        this.clearAuthData();
        this.initializationComplete.next(true);
        return;
      }
      
      console.log('✅ AuthService: Token não expirado, definindo estado inicial');
      
      // Definir token imediatamente se não estiver expirado
      this.tokenSubject.next(token);
      this.currentUserSubject.next(savedUser);
      this.isAuthenticatedSubject.next(true);
      
      // Validar token com o servidor em background (mas não bloquear)
      this.validateTokenInBackground(token);
      
      // Marcar inicialização como completa
      this.initializationComplete.next(true);
    } else {
      console.log('🔐 AuthService: Nenhum token/usuário salvo encontrado');
      this.clearAuthData();
      this.initializationComplete.next(true);
    }
  }

  /**
   * Valida token em background sem bloquear a inicialização
   */
  private validateTokenInBackground(token: string): void {
    console.log('🔐 AuthService: Validando token em background...');
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<TokenValidationResponse>(`${this.API_BASE}/auth/validate`, { headers })
      .pipe(
        timeout(5000),
        catchError(error => {
          console.warn('⚠️ AuthService: Erro na validação em background (mantendo estado atual):', error);
          return of({ valid: false });
        })
      )
      .subscribe(response => {
        if (!response.valid) {
          console.error('❌ AuthService: Token inválido no servidor, forçando logout');
          this.forceLogout();
        } else {
          console.log('✅ AuthService: Token confirmado como válido pelo servidor');
        }
      });
  }

  /**
   * Verifica se o token JWT está expirado (versão rigorosa)
   */
  private isTokenExpiredStrict(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Adicionar margem de segurança de 30 segundos
      const expirationWithMargin = payload.exp - 30;
      const isExpired = payload.exp && expirationWithMargin < now;
      
      if (isExpired) {
        console.error('⚠️ AuthService: Token expirado detectado (rigoroso):', {
          exp: payload.exp,
          now: now,
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
          timeLeft: payload.exp - now,
          expiredWithMargin: isExpired
        });
      }
      
      return isExpired;
    } catch (error) {
      console.error('❌ AuthService: Erro ao verificar expiração do token:', error);
      return true; // Se não conseguir decodificar, considerar expirado
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
      take(1),
      tap(() => console.log('✅ AuthService: Inicialização aguardada completa'))
    );
  }

  /**
   * Aguarda que a autenticação esteja completamente pronta
   */
  waitForAuthReady(): Observable<boolean> {
    return this.authReady$.pipe(
      filter(ready => ready),
      take(1),
      tap(() => console.log('✅ AuthService: Autenticação pronta'))
    );
  }

  /**
   * Realiza login do usuário.
   */
  login(credentials: AuthRequest): Observable<AuthResponse> {
    console.log('🔐 AuthService: Tentando fazer login para:', credentials.login);
    this.loadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE}/auth/login?lang=pt`, credentials)
      .pipe(
        timeout(10000),
        retry(1),
        tap(response => {
          console.log('✅ AuthService: Login realizado com sucesso:', response.user.username);
          
          // Log detalhado do novo token
          const tokenInfo = this.getTokenInfoFromString(response.token);
          if (tokenInfo) {
            console.log('🔍 AuthService: Novo token válido até:', tokenInfo.expiresAt?.toLocaleString());
            console.log('🔍 AuthService: Tempo de vida:', tokenInfo.timeLeft, 'segundos');
          }
          
          this.setAuthData(response.token, response.user);
        }),
        catchError(error => {
          console.error('❌ AuthService: Erro no login:', error);
          this.clearAuthData();
          return throwError(() => error);
        }),
        tap(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Realiza logout do usuário.
   */
  logout(): Observable<any> {
    console.log('🔐 AuthService: Fazendo logout...');
    
    return this.http.post(`${this.API_BASE}/auth/logout?lang=pt`, {})
      .pipe(
        timeout(5000),
        tap(() => {
          console.log('✅ AuthService: Logout realizado no servidor');
        }),
        catchError(error => {
          console.warn('⚠️ AuthService: Erro no logout do servidor (continuando com logout local):', error);
          return of(null);
        }),
        tap(() => {
          this.clearAuthData();
          console.log('✅ AuthService: Dados locais limpos');
        })
      );
  }

  /**
   * Valida token atual com o servidor.
   */
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      console.log('🔐 AuthService: Nenhum token para validar');
      return of(false);
    }

    // Verificar expiração local primeiro
    if (this.isTokenExpiredStrict(token)) {
      console.warn('⚠️ AuthService: Token expirado localmente, não validando no servidor');
      this.forceLogout();
      return of(false);
    }

    console.log('🔐 AuthService: Validando token no servidor...');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<TokenValidationResponse>(`${this.API_BASE}/auth/validate`, { headers })
      .pipe(
        timeout(5000),
        map(response => {
          console.log('🔐 AuthService: Resposta da validação:', response.valid);
          if (!response.valid) {
            console.error('❌ AuthService: Token rejeitado pelo servidor');
            this.forceLogout();
          }
          return response.valid;
        }),
        catchError(error => {
          console.error('❌ AuthService: Erro na validação do token:', error);
          if (error.status === 401) {
            console.warn('🔒 AuthService: Token rejeitado pelo servidor (401)');
            this.forceLogout();
          }
          return of(false);
        })
      );
  }

  /**
   * Verifica se usuário está autenticado.
   */
  isAuthenticated(): boolean {
    const isAuth = this.isAuthenticatedSubject.value;
    const hasToken = !!this.getToken();
    const hasUser = !!this.getSavedUser();
    const tokenValid = !this.isCurrentTokenExpired();
    
    const result = isAuth && hasToken && hasUser && tokenValid;
    
    if (!result) {
      console.log('🔐 AuthService: Verificação de autenticação:', {
        isAuth,
        hasToken,
        hasUser,
        tokenValid,
        result
      });
      
      // Se o token expirou, limpar automaticamente
      if (hasToken && !tokenValid) {
        console.warn('⚠️ AuthService: Token expirado detectado, limpando dados automaticamente');
        this.forceLogout();
      }
    }
    
    return result;
  }

  /**
   * Obtém usuário atual.
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtém role do usuário atual.
   */
  getCurrentUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  /**
   * Verifica se usuário tem uma role específica.
   */
  hasRole(role: UserRole): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole === role;
  }

  /**
   * Verifica se usuário tem uma das roles especificadas.
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole ? roles.includes(currentRole) : false;
  }

  /**
   * Verifica se usuário é admin.
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  /**
   * Verifica se usuário é editor.
   */
  isEditor(): boolean {
    return this.hasRole(UserRole.EDITOR);
  }

  /**
   * Verifica se usuário é viewer.
   */
  isViewer(): boolean {
    return this.hasRole(UserRole.VIEWER);
  }

  /**
   * Verifica se usuário pode editar dados.
   */
  canEditData(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.EDITOR]);
  }

  /**
   * Verifica se usuário pode gerenciar usuários.
   */
  canManageUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Obtém token JWT com verificação rigorosa de expiração.
   */
  getToken(): string | null {
    // Primeiro tenta do BehaviorSubject
    let token = this.tokenSubject.value;
    
    // Se não tem no subject, busca do localStorage
    if (!token) {
      token = this.getTokenFromStorage();
      if (token) {
        // Verificar se não está expirado antes de usar
        if (!this.isTokenExpiredStrict(token)) {
          this.tokenSubject.next(token);
        } else {
          console.warn('⚠️ AuthService: Token expirado encontrado no localStorage, limpando');
          this.forceLogout();
          return null;
        }
      }
    } else {
      // Verificar se o token atual não expirou
      if (this.isTokenExpiredStrict(token)) {
        console.warn('⚠️ AuthService: Token atual expirado, limpando');
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
      console.error('❌ AuthService: Erro ao acessar localStorage:', error);
      return null;
    }
  }

  /**
   * Obtém header de autorização.
   */
  getAuthHeader(): string | null {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Salva dados de autenticação.
   */
  private setAuthData(token: string, user: UserInfo): void {
    console.log('🔐 AuthService: Salvando dados de autenticação para:', user.username);
    
    // Log das informações do token
    const tokenInfo = this.getTokenInfoFromString(token);
    if (tokenInfo) {
      console.log('🔍 AuthService: Token expira em:', tokenInfo.expiresAt?.toLocaleString());
      console.log('🔍 AuthService: Tempo de vida:', tokenInfo.timeLeft, 'segundos');
    }
    
    try {
      // Salvar no localStorage
      localStorage.setItem(this.TOKEN_KEY, token);
      this.saveUser(user);
      
      // Atualizar subjects
      this.tokenSubject.next(token);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      
      console.log('✅ AuthService: Dados de autenticação salvos e subjects atualizados');
    } catch (error) {
      console.error('❌ AuthService: Erro ao salvar dados de autenticação:', error);
    }
  }

  /**
   * Obtém informações de um token específico
   */
  private getTokenInfoFromString(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return {
        payload,
        isExpired: payload.exp && payload.exp < now,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        timeLeft: payload.exp ? Math.max(0, payload.exp - now) : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Salva dados do usuário.
   */
  private saveUser(user: UserInfo): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('❌ AuthService: Erro ao salvar usuário:', error);
    }
  }

  /**
   * Obtém usuário salvo.
   */
  private getSavedUser(): UserInfo | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ AuthService: Erro ao recuperar usuário salvo:', error);
      return null;
    }
  }

  /**
   * Limpa dados de autenticação.
   */
  private clearAuthData(): void {
    console.log('🔐 AuthService: Limpando dados de autenticação');
    
    try {
      // Limpar localStorage
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('❌ AuthService: Erro ao limpar localStorage:', error);
    }
    
    // Limpar subjects
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    console.log('✅ AuthService: Dados de autenticação limpos');
  }

  /**
   * Obtém nome de exibição da role.
   */
  private getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.EDITOR]: 'Editor',
      [UserRole.VIEWER]: 'Visualizador'
    };
    return roleNames[role] || role;
  }

  /**
   * Força logout (para casos de token expirado).
   */
  forceLogout(): void {
    console.warn('🔒 AuthService: Forçando logout devido a token inválido/expirado');
    this.clearAuthData();
  }

  // Métodos adicionais para compatibilidade
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