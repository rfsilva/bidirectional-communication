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
 * Serviço de autenticação final e robusto para gerenciar login, logout e estado do usuário.
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
      const ready = initialized && authenticated && !!token;
      console.log('🔐 AuthService: Auth ready status:', { initialized, authenticated, hasToken: !!token, ready });
      return ready;
    }),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {
    console.log('🔐 AuthService: Inicializando...');
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
      console.log('🔐 AuthService: Token e usuário encontrados, validando...');
      
      // Definir token imediatamente
      this.tokenSubject.next(token);
      
      // Validar token com o servidor
      this.validateToken().subscribe({
        next: (isValid) => {
          if (isValid) {
            console.log('✅ AuthService: Token válido, usuário autenticado:', savedUser.username);
            this.currentUserSubject.next(savedUser);
            this.isAuthenticatedSubject.next(true);
          } else {
            console.warn('❌ AuthService: Token inválido, limpando dados');
            this.clearAuthData();
          }
          this.initializationComplete.next(true);
        },
        error: (error) => {
          console.error('❌ AuthService: Erro na validação do token:', error);
          this.clearAuthData();
          this.initializationComplete.next(true);
        }
      });
    } else {
      console.log('🔐 AuthService: Nenhum token/usuário salvo encontrado');
      this.initializationComplete.next(true);
    }
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
   * Realiza login do usuário.
   */
  login(credentials: AuthRequest): Observable<AuthResponse> {
    console.log('🔐 AuthService: Tentando fazer login para:', credentials.login);
    this.loadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE}/auth/login?lang=pt`, credentials)
      .pipe(
        timeout(10000), // 10 segundos de timeout
        retry(1), // Tenta novamente uma vez em caso de erro
        tap(response => {
          console.log('✅ AuthService: Login realizado com sucesso:', response.user.username);
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

    console.log('🔐 AuthService: Validando token...');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<TokenValidationResponse>(`${this.API_BASE}/auth/validate`, { headers })
      .pipe(
        timeout(5000),
        map(response => {
          console.log('🔐 AuthService: Resposta da validação:', response.valid);
          return response.valid;
        }),
        catchError(error => {
          console.error('❌ AuthService: Erro na validação do token:', error);
          return of(false);
        })
      );
  }

  /**
   * Obtém informações do usuário atual do servidor.
   */
  getCurrentUserFromServer(): Observable<UserInfo> {
    console.log('🔐 AuthService: Buscando dados do usuário no servidor...');
    
    return this.http.get<UserInfo>(`${this.API_BASE}/auth/me?lang=pt`)
      .pipe(
        timeout(5000),
        tap(user => {
          console.log('✅ AuthService: Dados do usuário atualizados:', user.username);
          this.saveUser(user);
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          console.error('❌ AuthService: Erro ao buscar dados do usuário:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Atualiza perfil do usuário.
   */
  updateProfile(user: User): Observable<User> {
    return this.http.put<User>(`${this.API_BASE}/profile?lang=pt`, user)
      .pipe(
        tap(updatedUser => {
          // Atualizar dados locais
          const userInfo: UserInfo = {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
            initials: `${updatedUser.firstName[0]}${updatedUser.lastName[0]}`.toUpperCase(),
            role: updatedUser.role,
            roleName: this.getRoleDisplayName(updatedUser.role),
            avatarUrl: updatedUser.avatarUrl,
            isActive: updatedUser.isActive,
            lastLogin: updatedUser.lastLogin
          };
          
          this.saveUser(userInfo);
          this.currentUserSubject.next(userInfo);
        })
      );
  }

  /**
   * Altera senha do usuário.
   */
  changePassword(passwordRequest: PasswordChangeRequest): Observable<any> {
    return this.http.put(`${this.API_BASE}/profile/password?lang=pt`, passwordRequest);
  }

  /**
   * Verifica se usuário está autenticado.
   */
  isAuthenticated(): boolean {
    const isAuth = this.isAuthenticatedSubject.value;
    const hasToken = !!this.getToken();
    const hasUser = !!this.getSavedUser();
    
    const result = isAuth && hasToken && hasUser;
    console.log('🔐 AuthService: Verificando autenticação - isAuth:', isAuth, 'hasToken:', hasToken, 'hasUser:', hasUser, 'result:', result);
    
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
   * Obtém token JWT.
   */
  getToken(): string | null {
    // Primeiro tenta do BehaviorSubject (mais rápido)
    let token = this.tokenSubject.value;
    
    // Se não tem no subject, busca do localStorage
    if (!token) {
      token = this.getTokenFromStorage();
      if (token) {
        this.tokenSubject.next(token);
      }
    }
    
    if (token) {
      console.log('🔐 AuthService: Token encontrado');
    } else {
      console.log('🔐 AuthService: Token não encontrado');
    }
    
    return token;
  }

  /**
   * Obtém token do localStorage
   */
  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
    
    // Salvar no localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    this.saveUser(user);
    
    // Atualizar subjects
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    console.log('✅ AuthService: Dados de autenticação salvos e subjects atualizados');
  }

  /**
   * Salva dados do usuário.
   */
  private saveUser(user: UserInfo): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtém usuário salvo.
   */
  private getSavedUser(): UserInfo | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Limpa dados de autenticação.
   */
  private clearAuthData(): void {
    console.log('🔐 AuthService: Limpando dados de autenticação');
    
    // Limpar localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
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
    console.warn('🔒 AuthService: Forçando logout devido a token inválido');
    this.clearAuthData();
  }
}