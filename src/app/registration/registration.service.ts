import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface User {
  username: string;
  country: string;
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly API_URL = 'api'; // Or use environment.apiUrl

  constructor(private http: HttpClient) {}

  getCountries(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/countries`).pipe(
      catchError(this.handleError)
    );
  }

  checkUsername(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/username-available/${username}`).pipe(
      catchError(this.handleError)
    );
  }

  registerUser(data: User): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, data).pipe(
      catchError(this.handleError)
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`).pipe(
      catchError(this.handleError)
    );
  }

  // Trigger the HTTP POST request to reset the database
  resetDb(): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-db`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.error instanceof ErrorEvent
      ? `Client-side error: ${error.error.message}`
      : `Server Error: ${error.status}\nMessage: ${error.message}`;
    console.error(message);
    return throwError(() => new Error(message));
  }
}
