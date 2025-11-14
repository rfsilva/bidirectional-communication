import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

/**
 * Serviço para gerenciamento de usuários (apenas ADMIN).
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_BASE = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtém todos os usuários (apenas ADMIN).
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_BASE}/users`);
  }

  /**
   * Obtém usuário por ID (apenas ADMIN).
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/users/${id}`);
  }

  /**
   * Cria novo usuário (apenas ADMIN).
   */
  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.API_BASE}/users`, user);
  }

  /**
   * Atualiza usuário (apenas ADMIN).
   */
  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.API_BASE}/users/${id}`, user);
  }

  /**
   * Desativa usuário (apenas ADMIN).
   */
  deactivateUser(id: number): Observable<any> {
    return this.http.delete(`${this.API_BASE}/users/${id}`);
  }

  /**
   * Ativa usuário (apenas ADMIN).
   */
  activateUser(id: number): Observable<any> {
    return this.http.put(`${this.API_BASE}/users/${id}/activate`, {});
  }

  /**
   * Obtém estatísticas de usuários (apenas ADMIN).
   */
  getUserStats(): Observable<any> {
    return this.http.get(`${this.API_BASE}/users/stats`);
  }
}