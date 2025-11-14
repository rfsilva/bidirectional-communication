import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, combineLatest } from 'rxjs';
import { map, catchError, tap, filter, take, shareReplay, switchMap } from 'rxjs/operators';
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
 * Serviço de autenticação corrigido com inicialização robusta
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

  // Flag para evitar múltiplas inicializações
  private initializationStarted = false;

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
    console.log('🔐 AuthService: Construtor chamado - iniciando inicialização...');
    this.initializeAuth();
  }

  /**
   * Inicializa o estado de autenticação verificando token salvo.
   */
  private initializeAuth(): void {
    if (this.initializationStarted) {
      console.log('🔐 AuthService: Inicialização já iniciada, ignorando...');
      return;
    }

    this.initializationStarted = true;
    console.log('🔐 AuthService: Iniciando verificação de autenticação salva...');
    
    // Primeiro, verificar se há dados salvos
    const token = this.getTokenFromStorage();
    const savedUser = this.getSavedUser();

    console.log('🔐 AuthService: Dados encontrados:', {
      hasToken: !!token,
      hasUser: !!savedUser,
      username: savedUser?.username
    });

    if (token && savedUser) {
      console.log('🔐 AuthService: Token e usuário encontrados, definindo estado inicial...');
      
      // Definir estado inicial imediatamente
      this.tokenSubject.next(token);
      this.currentUserSubject.next(savedUser);
      this.isAuthenticatedSubject.next(true);
      
      console.log('🔐 AuthService: Estado inicial definido, validando token com servidor...');
      
      // Validar token com o servidor em background
      this.validateTokenWithServer(token).subscribe({
        next: (isValid) => {
          if (isValid) {
            console.log('✅ AuthService: Token válido confirmado pelo servidor');
            // Estado já está correto, apenas marcar como inicializado
            this.initializationComplete.next(true);
          } else {
            console.warn('❌ AuthService: Token inválido, limpando dados');
            this.clearAuthData();
            this.initializationComplete.next(true);
          }
        },
        error: (error) => {
          console.error('❌ AuthService: Erro na validação do token:', error);
          // Em caso de erro de rede, manter o estado atual mas marcar como inicializado
          console.warn('⚠️ AuthService: Mantendo estado atual devido a erro de rede');
          this.initializationComplete.next(true);
        }
      });
    } else {
      console.log('🔐 AuthService: Nenhum token/usuário salvo encontrado');
      this.clearAuthData();
      this.initializationComplete.next(true);
    }
  }

  /**
   * Valida token com o servidor (versão privada para inicialização)
   */
  private validateTokenWithServer(token: string): Observable<boolean> {
    console.log('🔐 AuthService: Validando token com servidor...');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<TokenValidationResponse>(`${this.API_BASE}/auth/validate`, { headers })
      .pipe(
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
   * Aguarda a inicialização completa do serviço
   */
  waitForInitialization(): Observable<boolean> {
    console.log('🔐 AuthService: Aguardando inicialização...');
    return this.initializationComplete$.pipe(
      filter(complete => complete),
      take(1),
      tap(() => console.log('✅ AuthService: Inicialização completa'))
    );
  }

  /**
   * Aguarda que a autenticação esteja completamente pronta
   */
  waitForAuthReady(): Observable<boolean> {
    console.log('🔐 AuthService: Aguardando autenticação pronta...');
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
   * Valida token atual com o servidor (versão pública).
   */
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      console.log('🔐 AuthService: Nenhum token para validar');
      return of(false);
    }

    return this.validateTokenWithServer(token);
  }

  /**
   * Obtém informações do usuário atual do servidor.
   */
  getCurrentUserFromServer(): Observable<UserInfo> {
    console.log('🔐 AuthService: Buscando dados do usuário no servidor...');
    
    return this.http.get<UserInfo>(`${this.API_BASE}/auth/me?lang=pt`)
      .pipe(
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
    const hasUser = !!this.getCurrentUser();
    
    const result = isAuth && hasToken && hasUser;
    
    if (!result) {
      console.log('🔐 AuthService: Verificação de autenticação:', {
        isAuth,
        hasToken,
        hasUser,
        result
      });
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
   * Obtém token JWT com garantia de sincronização.
   */
  getToken(): string | null {
    // Primeiro tenta do BehaviorSubject (mais rápido)
    let token = this.tokenSubject.value;
    
    // Se não tem no subject, busca do localStorage e sincroniza
    if (!token) {
      token = this.getTokenFromStorage();
      if (token) {
        console.log('🔐 AuthService: Token encontrado no localStorage, sincronizando...');
        this.tokenSubject.next(token);
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
    console.warn('🔒 AuthService: Forçando logout devido a token inválido');
    this.clearAuthData();
  }
}