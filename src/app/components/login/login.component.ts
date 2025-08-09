import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.authService.getCurrentUser().then(user => {
          switch(user.tokens.accessToken.payload['cognito:groups'][0]){
            case 'ADMIN':
              this.router.navigate(['/dashboard']);
              break;
            case 'USER':
              this.router.navigate(['/dashboard']);
              break;
            default:
              this.router.navigate(['/login']);
              break;
          }
        }).catch(error => {
          console.error('Error al obtener el usuario actual:', error);
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Error en el inicio de sesión';
        console.error('Error en login:', error);
      }
    });
  }

  onLogout(): void {
    this.loading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en logout:', error);
      }
    });
  }
}
