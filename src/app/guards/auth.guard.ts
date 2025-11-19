import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
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

  canActivate(): Observable<boolean> {
    // Esperar a que termine la verificación inicial del estado de autenticación
    return this.authService.authState$.pipe(
      filter(state => !state.loading), // Esperar a que loading sea false
      take(1), // Tomar solo el primer valor después de que loading sea false
      map(state => {
        if (state.isAuthenticated) {
          // Usuario autenticado, permitir acceso
          return true;
        } else {
          // No autenticado, redirigir con replaceUrl para evitar historial
          this.router.navigate(['/login'], { replaceUrl: true });
          return false;
        }
      })
    );
  }
}
