import { Injectable } from '@angular/core';
import {
  InMemoryDbService,
  RequestInfo,
  ResponseOptions,
} from 'angular-in-memory-web-api';
import { Observable } from 'rxjs';

interface User {
  username: string;
  country: string;
  available?: boolean;
}

interface Database {
  users: User[];
  countries: string[];
}

@Injectable({
  providedIn: 'root',
})
export class MockApiService implements InMemoryDbService {
  // Method to create or reset the database
  createDb(): { countries: string[]; users: User[] } {
    return this.loadDataFromStorage();
  }

  // Consolidated method to handle loading users and countries from localStorage
  private loadDataFromStorage(): { countries: string[]; users: User[] } {
    const users = this.getStoredUsers();
    const countries = this.getCountries();

    return { countries, users };
  }

  private getStoredUsers(): User[] {
    try {
      const storedUsers = localStorage.getItem('users');
      return storedUsers ? JSON.parse(storedUsers) : this.getDefaultUsers();
    } catch (error) {
      console.error('Failed to load users from localStorage:', error);
      return this.getDefaultUsers();
    }
  }

  private getDefaultUsers(): User[] {
    return [{ username: 'testuser', country: 'USA', available: false }];
  }

  private getCountries(): string[] {
    return ['USA', 'Canada', 'Germany', 'India', 'UK', 'Netherlands'];
  }

  // Resets in-memory database and localStorage
  private resetInRequest(reqInfo: RequestInfo): Observable<ResponseOptions> {
    const db = this.getDb(reqInfo); // Access the in-memory DB

    // Clear users from in-memory database and localStorage
    db.users = [];
    localStorage.clear();

    // Reload default data
    const { users } = this.loadDataFromStorage();
    db.users = users; // Sync users back into in-memory DB
    localStorage.setItem('users', JSON.stringify(users)); // Sync back into localStorage

    return reqInfo.utils.createResponse$(() => ({
      body: { message: 'Database reset successfully', users },
      status: 200,
    }));
  }

  // Override GET method to handle requests
  get(reqInfo: RequestInfo): Observable<ResponseOptions> {
    const db = this.getDb(reqInfo); // Use the helper method

    if (reqInfo.url.includes('username-available')) {
      return this.checkUsernameAvailability(reqInfo, db);
    } else if (reqInfo.url.includes('countries')) {
      return this.getCountriesResponse(reqInfo, db);
    } else if (reqInfo.url.includes('users')) {
      return this.getUsersResponse(reqInfo, db);
    }

    return reqInfo.utils.createResponse$(() => ({ body: {}, status: 200 }));
  }

  private checkUsernameAvailability(
    reqInfo: RequestInfo,
    db: Database
  ): Observable<ResponseOptions> {
    const username = reqInfo.url.split('/').pop();
    const userExists = db.users.some((user) => user.username === username);
    const available = !userExists;

    return reqInfo.utils.createResponse$(() => ({
      body: available,
      status: 200,
    }));
  }

  private getCountriesResponse(
    reqInfo: RequestInfo,
    db: Database
  ): Observable<ResponseOptions> {
    return reqInfo.utils.createResponse$(() => ({
      body: db.countries,
      status: 200,
    }));
  }

  private getUsersResponse(
    reqInfo: RequestInfo,
    db: Database
  ): Observable<ResponseOptions> {
    return reqInfo.utils.createResponse$(() => ({
      body: db.users,
      status: 200,
    }));
  }

  // Override POST method to handle user registration and resetting the database
  post(reqInfo: RequestInfo): Observable<ResponseOptions> {
    if (/register/.test(reqInfo.url)) {
      return this.registerUser(reqInfo);
    }

    if (/reset-db/.test(reqInfo.url)) {
      return this.resetInRequest(reqInfo);
    }

    return reqInfo.utils.createResponse$(() => ({ body: {}, status: 200 }));
  }

  private registerUser(reqInfo: RequestInfo): Observable<ResponseOptions> {
    const db = this.getDb(reqInfo); // Use the helper method
    const newUser: User = reqInfo.utils.getJsonBody(reqInfo.req);

    db.users.push(newUser);
    this.updateLocalStorage(db.users);

    return reqInfo.utils.createResponse$(() => ({
      body: { message: 'User registered successfully', user: newUser },
      status: 201,
    }));
  }

  // DRY method to update localStorage
  private updateLocalStorage(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  // DRY method to get the in-memory database
  private getDb(reqInfo: RequestInfo): Database {
    return reqInfo.utils.getDb() as Database;
  }
}
