import { AuthService } from './auth.service';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, Subject, switchMap, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebReqInterceptorService implements HttpInterceptor {
  private refreshingAccessToken: boolean = false;
  private accessTokenRefreshed: Subject<void> = new Subject<void>();

  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = this.addAuthHeader(request);
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error);
        if (error.status === 401) {
          // Refresh the access token
          return this.refreshAccessToken().pipe(
            switchMap(() => {
              // Retry the failed request with the new access token
              request = this.addAuthHeader(request);
              return next.handle(request);
            }),
            catchError((err: any) => {
              console.log(err);
              this.authService.logout(); // Logout if refreshing fails
              return EMPTY;
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  private refreshAccessToken() {
    if (this.refreshingAccessToken) {
      // If we are already refreshing the access token, wait until it is done
      return new Observable((observer) => {
        this.accessTokenRefreshed.subscribe(() => {
          observer.next();
          observer.complete();
        });
      });
    } else {
      this.refreshingAccessToken = true; // Set the flag to indicate the token is being refreshed
      return this.authService.getNewAccessToken().pipe(
        tap(() => {
          this.refreshingAccessToken = false; // Reset the flag
          this.accessTokenRefreshed.next(); // Notify other requests waiting for the new token
        }),
        catchError((error) => {
          this.refreshingAccessToken = false; // Reset the flag in case of error
          return throwError(() => error);
        })
      );
    }
  }

  private addAuthHeader(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getAccessToken();
    if (token) {
      return request.clone({
        setHeaders: {
          'x-access-token': token,
        },
      });
    }
    return request;
  }
}
