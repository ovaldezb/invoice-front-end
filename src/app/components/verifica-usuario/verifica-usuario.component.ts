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
  public email: string = '';
  public codigo: string = '';
  public isVerifying: boolean = false;

  constructor(private authService: AuthService,
              private router: Router) {}

  verificarUsuario(): void {
    this.isVerifying = true;

    this.authService.confirmRegistration(this.email, this.codigo).subscribe({
      next: (result) => {
        this.isVerifying = false;
        Swal.fire({
          title: 'Éxito',
          text: 'Usuario verificado correctamente',
          icon: 'success',
          timer: 1500,
        });
        // Redirigir al login después de 2 segundos con replaceUrl
        setTimeout(() => {
          this.router.navigate(['/login'], { replaceUrl: true });
        }, 2000);
      },
      error: (error) => {
        this.isVerifying = false;
        console.error('Error al verificar usuario:', error);
        alert('Error al verificar usuario: ' + (error.message || 'Error desconocido'));
      }
    });
  }
}
