import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataEntity, Stats } from '../models/data-entity.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly apiUrl = 'http://localhost:8080/api/data';

  constructor(private http: HttpClient) {}

  getAllData(): Observable<DataEntity[]> {
    return this.http.get<DataEntity[]>(this.apiUrl);
  }

  getDataById(id: number): Observable<DataEntity> {
    return this.http.get<DataEntity>(`${this.apiUrl}/${id}`);
  }

  createData(data: DataEntity): Observable<DataEntity> {
    return this.http.post<DataEntity>(this.apiUrl, data);
  }

  updateData(id: number, data: DataEntity): Observable<DataEntity> {
    return this.http.put<DataEntity>(`${this.apiUrl}/${id}`, data);
  }

  deleteData(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getExternalData(): Observable<DataEntity[]> {
    return this.http.get<DataEntity[]>(`${this.apiUrl}/external`);
  }

  getInternalData(): Observable<DataEntity[]> {
    return this.http.get<DataEntity[]>(`${this.apiUrl}/internal`);
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.apiUrl}/stats`);
  }
}