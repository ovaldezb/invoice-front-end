import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfiguraCsdComponent } from '../configura-csd/configura-csd.component';
import { ListaFacturasComponent } from "../lista-facturas/lista-facturas.component";
import { AdminErroresComponent } from "../admin-errores/admin-errores.component";
import { ErrorTrackingService } from '../../services/error-tracking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ConfiguraCsdComponent, ListaFacturasComponent, AdminErroresComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  givenName: string = '';
  familyName: string = '';
  activeTab: string = 'tab1';
  totalErroresPendientes: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private errorTrackingService: ErrorTrackingService
  ) {
    
  }
  ngOnInit(): void {
    this.authService.getCurrentUser().then(user => {
      this.givenName = user.tokens.idToken.payload.given_name;
      this.familyName = user.tokens.idToken.payload.family_name;
    }).catch(error => {
      console.error('Error al obtener el usuario actual:', error);
      this.router.navigate(['/login']);
    });

    // Cargar estadísticas de errores para mostrar badge
    this.cargarEstadisticasErrores();
  }

  cargarEstadisticasErrores(): void {
    this.errorTrackingService.obtenerEstadisticas()
      .subscribe({
        next: (response) => {
          if (response.body) {
            this.totalErroresPendientes = response.body.erroresPendientes;
          }
        },
        error: (error) => {
          console.error('Error al cargar estadísticas de errores:', error);
        }
      });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error en logout:', error);
      }
    });
  }
}
