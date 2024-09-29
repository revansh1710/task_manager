import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Router } from '@angular/router';
import { BehaviorSubject, shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  LoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoggedInGuard: boolean = false;
  constructor(private webService: WebRequestService, private router: Router, private http: HttpClient) { }
  login(email: string, password: string) {
    return this.webService.login(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'));
        console.log('LoggedIn')
        this.LoggedIn.next(true);
        this.isLoggedInGuard = true;
      }),
    )
  }
  signUp(email: string, password: string) {
    return this.webService.signUp(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        this.setSession(res.body._id, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'));
        console.log('Successfully Signed In')
      }),
    )
  }
  logout() {
    this.removeSession();
    this.router.navigate(['/login'])
  }
  getAccessToken() {
    return localStorage.getItem('x-access-token');
  }
  getRefreshToken() {
    return localStorage.getItem('x-refresh-token');
  }
  setAccessToken(accessToken: string) {
    localStorage.setItem('x-access-token', accessToken)
  }
  getUserId() {
    return localStorage.getItem('user-id')
  }
  setSession(userId: string, accessToken: string | null, refreshToken: string | null) {
    if (userId) {
      localStorage.setItem('user-id', userId);
    }

    if (accessToken) {
      localStorage.setItem('x-access-token', accessToken);
    }

    if (refreshToken) {
      localStorage.setItem('x-refresh-token', refreshToken);
    }
  }
  removeSession() {
    localStorage.removeItem('user-id');
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('x-refresh-token');
  }
  getNewAccessToken() {
    return this.http.get(`${this.webService.ROOT_URL}/users/me/accessToken`, {
      headers: {
        'x-refresh-token': this.getRefreshToken() || '',
        '_id': this.getUserId() || ''
      },
      observe: 'response'
    }).pipe(
      tap((res: HttpResponse<any>) => {
        this.setAccessToken(res.headers.get('x-access-token') || '');
      }
      )
    )
  }
}