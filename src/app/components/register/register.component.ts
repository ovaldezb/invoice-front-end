import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  nombre: string = '';
  apellido: string = '';
  razonSocial: string = '';
  telefono: string = '';
  email: string = '';
  confirmEmail: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  // Estados de validación para cada campo
  touched = {
    nombre: false,
    apellido: false,
    razonSocial: false,
    telefono: false,
    email: false,
    confirmEmail: false,
    password: false,
    confirmPassword: false
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Método para marcar un campo como tocado
  markAsTouched(field: keyof typeof this.touched) {
    this.touched[field] = true;
  }

  // Método para validar si un campo es válido
  isFieldValid(field: string): boolean {
    switch (field) {
      case 'nombre':
        return this.nombre.trim().length > 0;
      case 'apellido':
        return this.apellido.trim().length > 0;
      case 'razonSocial':
        return this.razonSocial.trim().length > 0;
      case 'telefono':
        return this.telefono.trim().length > 0;
      case 'email':
        return this.email.trim().length > 0 && this.isValidEmail(this.email);
      case 'confirmEmail':
        return this.confirmEmail.trim().length > 0 && this.email === this.confirmEmail;
      case 'password':
        return this.password.length >= 8;
      case 'confirmPassword':
        return this.confirmPassword.length >= 8 && this.password === this.confirmPassword;
      default:
        return false;
    }
  }

  // Método para validar email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Método para obtener las clases CSS de un campo
  getFieldClasses(field: string): string {
    const baseClasses = 'block w-full pl-10 pr-3 py-3 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200';
    
    if (!this.touched[field as keyof typeof this.touched]) {
      // Campo no tocado - estilo por defecto
      return `${baseClasses} border border-gray-300 hover:border-gray-400 focus:ring-indigo-500 focus:border-indigo-500`;
    }
    
    if (this.isFieldValid(field)) {
      // Campo válido - verde suave
      return `${baseClasses} border border-green-300 bg-green-50 hover:border-green-400 focus:ring-green-500 focus:border-green-500`;
    } else {
      // Campo inválido - rojo claro
      return `${baseClasses} border border-red-300 bg-red-50 hover:border-red-400 focus:ring-red-500 focus:border-red-500`;
    }
  }

  // Método para verificar si todos los campos son válidos
  areAllFieldsValid(): boolean {
    return this.isFieldValid('nombre') &&
           this.isFieldValid('apellido') &&
           this.isFieldValid('razonSocial') &&
           this.isFieldValid('telefono') &&
           this.isFieldValid('email') &&
           this.isFieldValid('confirmEmail') &&
           this.isFieldValid('password') &&
           this.isFieldValid('confirmPassword');
  }

  onRegister(): void {
    if (!this.nombre || !this.apellido || !this.razonSocial || !this.telefono || !this.email || !this.confirmEmail || !this.password || !this.confirmPassword) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.email !== this.confirmEmail) {
      this.error = 'Los correos electrónicos no coinciden';
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

    this.authService.register(this.email, this.password,{
      nombreUsuario: this.nombre,
      apellido: this.apellido,
      razonSocial: this.razonSocial,
      telefono: this.telefono
    }).subscribe({
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
