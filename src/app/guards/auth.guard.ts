import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Esperar a que termine la verificación inicial del estado de autenticación
    return this.authService.authState$.pipe(
      filter(authState => !authState.loading), // Esperar a que loading sea false
      take(1), // Tomar solo el primer valor después de que loading sea false
      map(authState => {
        if (authState.isAuthenticated) {
          // Usuario autenticado, permitir acceso
          return true;
        } else {
          // No autenticado, guardar la URL actual y redirigir al login
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url },
            replaceUrl: true 
          });
          return false;
        }
      })
    );
  }
}
