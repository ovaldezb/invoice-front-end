import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { getCurrentUser } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Revalidar la sesión en cada activación del guard
    return from(getCurrentUser()).pipe(
      map(user => {
        if (user) {
          // Usuario autenticado, permitir acceso
          return true;
        } else {
          // No autenticado, redirigir con replaceUrl para evitar historial
          this.router.navigate(['/login'], { replaceUrl: true });
          return false;
        }
      }),
      catchError(() => {
        // Error al verificar sesión, redirigir al login
        this.router.navigate(['/login'], { replaceUrl: true });
        return from([false]);
      })
    );
  }
}
