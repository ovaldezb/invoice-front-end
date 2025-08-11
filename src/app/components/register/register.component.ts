import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  
  public usuario: Usuario = new Usuario('', '', '', '', '', '', '', '', '');
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
    private usuarioService: UsuariosService,
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
        return this.usuario.nombre.trim().length > 0;
      case 'apellido':
        return this.usuario.apellido.trim().length > 0;
      case 'razonSocial':
        return this.usuario.razon_social.trim().length > 0;
      case 'telefono':
        return this.usuario.telefono.trim().length > 0;
      case 'email':
        return this.usuario.email.trim().length > 0 && this.isValidEmail(this.usuario.email);
      case 'confirmEmail':
        return this.usuario.confirm_email.trim().length > 0 && this.usuario.email === this.usuario.confirm_email;
      case 'password':
        return this.usuario.password.length >= 8;
      case 'confirmPassword':
        return this.usuario.confirm_password.length >= 8 && this.usuario.password === this.usuario.confirm_password;
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
    if (!this.usuario.nombre || !this.usuario.apellido || !this.usuario.razon_social || !this.usuario.telefono || !this.usuario.email || !this.usuario.confirm_email || !this.usuario.password || !this.usuario.confirm_password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.usuario.email !== this.usuario.confirm_email) {
      this.error = 'Los correos electrónicos no coinciden';
      return;
    }

    if (this.usuario.password !== this.usuario.confirm_password) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.usuario.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.usuarioService.addUsuario(this.usuario).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Registro exitoso. Por favor, inicia sesión.';
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al registrar usuario:', error);
        this.error = 'Error al registrar usuario. Por favor, inténtalo de nuevo más tarde.';
      }
    });
    
  }
}
