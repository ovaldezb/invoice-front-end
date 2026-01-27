import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MercadoPagoService } from '../../services/mercado-pago.service';
import { PaymentConfig } from '../../models/payment-config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagos.component.html'
})
export class PagosComponent implements OnInit {
  @Output() navigateToConfig = new EventEmitter<void>();

  montoAPagar: number = 0;
  conceptoPago: string = 'Pago de Servicios';
  recentPayments: any[] = [];
  paymentConfigs: PaymentConfig[] = [];
  isLoading: boolean = false;

  constructor(private mercadoPagoService: MercadoPagoService) { }

  ngOnInit(): void {
    this.cargarDatosPagos();
  }

  cargarDatosPagos(): void {
    this.cargarHistorialPagos();
    this.cargarConfiguracionPagos();
  }

  cargarHistorialPagos(): void {
    this.mercadoPagoService.getLastPayments().subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          this.recentPayments = response.body;
        }
      },
      error: (error) => {
        console.error('Error al cargar pagos:', error);
      }
    });
  }

  cargarConfiguracionPagos(): void {
    this.isLoading = true;
    this.mercadoPagoService.getPaymentConfigs().subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          this.paymentConfigs = response.body.payment_config || [];
          this.cargarConsumoTimbres();
        }
      },
      error: (error) => {
        console.error('Error al cargar configuración de pagos:', error);
        this.cargarConsumoTimbres();
      }
    });
  }

  cargarConsumoTimbres(): void {
    const today = new Date();
    // Logic to get previous month
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const month = lastMonthDate.getMonth() + 1;
    const year = lastMonthDate.getFullYear();

    this.mercadoPagoService.getInvoiceCount(month, year).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          const count = response.body.count;

          if (count > 0) {
            // Buscamos el concepto de timbrado (ignorando mayúsculas/minúsculas)
            const billingConfig = this.paymentConfigs.find(c =>
              c.nombre_pago.toLowerCase().includes('timbrado de facturas')
            );

            if (billingConfig) {
              const unitPrice = billingConfig.costo;
              const totalCost = count * unitPrice;

              billingConfig.nombre_pago = `Timbrado de Facturas (x${count})`;
              billingConfig.costo = totalCost;
            }
          }

          this.calcularTotalAPagar();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar consumo de timbres:', error);
        this.isLoading = false;
      }
    });
  }

  calcularTotalAPagar(): void {
    this.montoAPagar = this.paymentConfigs.reduce((total, config) => total + config.costo, 0);
  }

  iniciarPago(): void {
    const monto = this.montoAPagar;
    if (monto <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin monto a pagar',
        text: 'No hay servicios configurados o el monto es 0.'
      });
      return;
    }

    const titulo = this.conceptoPago || 'Pago de Servicios';

    Swal.fire({
      title: 'Procesando pago...',
      text: 'Generando enlace de pago con Mercado Pago',
      icon: 'info',
      showConfirmButton: false,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.mercadoPagoService.createPreference(titulo, 1, monto).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          const initPoint = response.body.init_point;
          Swal.close();
          window.open(initPoint, '_blank');
          Swal.fire({
            icon: 'success',
            title: 'Pestaña de pago abierta',
            text: 'Hemos abierto la página de Mercado Pago en una nueva pestaña.',
            confirmButtonText: 'Entendido'
          });
        } else {
          Swal.fire('Error', 'No se pudo generar el pago. Inténtalo de nuevo.', 'error');
        }
      },
      error: (error) => {
        console.error('Error al generar preferencia:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor de pagos.'
        });
      }
    });
  }

  formatearFechaHora(fechaHora: string): string {
    try {
      const fecha = new Date(fechaHora);
      if (isNaN(fecha.getTime())) {
        return fechaHora;
      }
      fecha.setHours(fecha.getHours() + 6);
      return fecha.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return fechaHora;
    }
  }

  irAConfiguracion(): void {
    this.navigateToConfig.emit();
  }
}
