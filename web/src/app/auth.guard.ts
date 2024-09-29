import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service'
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authservice = inject(AuthService);
  const router = inject(Router);
  if (authservice.isLoggedInGuard) {
    return true;
  }
  else {
    router.navigate(['/login']);
    return false
  }
};
