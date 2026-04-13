import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FacturacionService } from '../../services/facturacion.service';
import { AuthService } from '../../services/auth.service';
import { HttpResponse } from '@angular/common/http';
import { Global } from '../../services/Global';
import { VentaTapete } from '../../models/ventaTapete';
import { Ticket } from '../../models/ticket';
import { Certificado } from '../../models/certificado';
import Swal from 'sweetalert2';
import { Sucursal } from '../../models/sucursal';
import { EnvironmentService } from '../../services/environment.service';
import { FacturaDetalleComponent } from './factura-detalle/factura-detalle.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-genera-factura',
  standalone: true,
  imports: [FormsModule, CommonModule, FacturaDetalleComponent],
  templateUrl: './genera-factura.component.html',
  styleUrl: './genera-factura.component.css'
})
export class GeneraFacturaComponent implements OnInit, OnDestroy {
  public Global = Global;
  public ventaTapete: VentaTapete = new VentaTapete('', new Ticket('', '', 0, 0, 0, 0), [], { formapago: '' });
  public certificado: Certificado = {} as Certificado;
  public ticketNumber: string = '';
  public isLoading: boolean = false;
  public isBusquedaTicket: boolean = true;
  public sucursal: Sucursal = new Sucursal('', '', '', '', '', '', '', '', '');
  public backEndEnv: string = '';
  public isAuthenticated: boolean = false;
  
  private queryParamsSubscription?: Subscription;

  constructor(
    private facturacionService: FacturacionService,
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    this.authService.authState$.subscribe(state => {
      if (!state.loading) {
        this.isAuthenticated = state.isAuthenticated;
      }
    });

    this.getEnvironment();

    // Detección de ticket por URL (QR) - Solo precargar el campo sin consultar automáticamente
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const ticketParam = params['ticket'];
      if (ticketParam) {
        this.ticketNumber = ticketParam;
        // Se elimina la llamada automática a consultarVenta() por requerimiento
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getEnvironment(): void {
    this.environmentService.getEnvironment()
      .subscribe({
        next: (response: HttpResponse<any>) => {
          this.backEndEnv = response.body.environment || '';
        },
        error: (error) => {
          this.backEndEnv = '';
          console.error(error);
        }
      });
  }

  consultarVenta() {
    this.ticketNumber = this.ticketNumber ? this.ticketNumber.trim() : '';
    if (!this.ticketNumber) return;

    this.isLoading = true;
    this.facturacionService.obtieneDatosVenta(this.ticketNumber)
      .subscribe({
        next: (response: HttpResponse<any>) => {
          this.ventaTapete = response.body.venta;
          this.certificado = response.body.certificado;
          this.sucursal = response.body.sucursal;
          this.ticketNumber = '';
          this.isBusquedaTicket = false;
        },
        error: (error) => {
          this.isLoading = false;
          Swal.fire({
            icon: 'warning',
            title: error.status != 500 ? error.error.message : 'Ticket no encontrado',
            confirmButtonColor: '#3b82f6',
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  regresarAConsulta() {
    this.isBusquedaTicket = true;
    this.ventaTapete = new VentaTapete('', new Ticket('', '', 0, 0, 0, 0), [], { formapago: '' });
    // Limpiar parámetros de la URL para evitar recargas accidentales
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ticket: null },
      queryParamsHandling: 'merge'
    });
  }
}
