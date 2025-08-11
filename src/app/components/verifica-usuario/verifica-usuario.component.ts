import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verifica-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './verifica-usuario.component.html',
})
export class VerificaUsuarioComponent {

  constructor(private authService: AuthService,
              private router: Router) {}

  email: string = '';
  codigo: string = '';

  verificarUsuario(): void {
    this.authService.confirmRegistration(this.email,this.codigo).subscribe({
      next: (result) => {
        Swal.fire({
          title: 'Éxito',
          text: 'Usuario verificado correctamente',
          icon: 'success',
          timer: 1500,
        });
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al verificar usuario:', error);
        alert('Error al verificar usuario: ' + (error.message || 'Error desconocido'));
      }
    });
  }
}
