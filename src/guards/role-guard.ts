import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/AuthService';

export const roleGuard = (allowed: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    const role = auth.getRole();
    if (!role) {
      return router.createUrlTree(['/login']);
    }

    if (allowed.includes(role)) return true;

   
    if (auth.isManager()) return router.createUrlTree(['/admin/users-counts']);
    if (auth.isEmployee()) return router.createUrlTree(['/employee']);
    return router.createUrlTree(['/client']);
  };
};
