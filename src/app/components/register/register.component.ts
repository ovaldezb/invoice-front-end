import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  nombreUsuario: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister(): void {
    if (!this.email || !this.password || !this.confirmPassword) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.email, this.password,{nombreUsuario:this.nombreUsuario,apellido:this.apellido}).subscribe({
      next: (result) => {
        this.loading = false;
        this.success = result.message;
        console.log('Registro exitoso:', result);
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/verifica-usuario']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Error en el registro';
        console.error('Error en registro:', error);
      }
    });
  }
}
