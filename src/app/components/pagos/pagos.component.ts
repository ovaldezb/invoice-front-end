import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagosService } from '../../services/pagos.service';
import { OpenPayService } from '../../services/openpay.service';
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

  constructor(
    private pagosService: PagosService,
    private openPayService: OpenPayService
  ) { }

  ngOnInit(): void {
    this.cargarDatosPagos();
  }

  cargarDatosPagos(): void {
    this.cargarHistorialPagos();
    this.cargarConfiguracionPagos();
  }

  cargarHistorialPagos(): void {
    this.pagosService.getLastPayments().subscribe({
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
    this.pagosService.getPaymentConfigs().subscribe({
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

    this.pagosService.getInvoiceCount(month, year).subscribe({
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


  iniciarPagoOpenPay(): void {
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

    const customer = {
      name: 'Cliente Farzin',
      last_name: 'Facturas',
      phone_number: '7876765654',
      email: 'farzin@correo.com'
    };

    Swal.fire({
      title: 'Procesando pago...',
      text: 'Generando enlace de pago con OpenPay',
      icon: 'info',
      showConfirmButton: false,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.openPayService.createCheckout(titulo, 1, monto, customer).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          const checkoutUrl = response.body.checkout_url;
          Swal.close();
          window.open(checkoutUrl, '_blank');
          Swal.fire({
            icon: 'success',
            title: 'Pestaña de pago abierta',
            text: 'Hemos abierto la página de OpenPay en una nueva pestaña.',
            confirmButtonText: 'Entendido'
          });
        } else {
          Swal.fire('Error', 'No se pudo generar el pago con OpenPay. Inténtalo de nuevo.', 'error');
        }
      },
      error: (error) => {
        console.error('Error al generar checkout de OpenPay:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor de pagos de OpenPay.'
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
      // Ajuste de zona horaria si es necesario (el servidor suele devolver UTC)
      fecha.setHours(fecha.getHours() + 6);

      const day = fecha.getDate();
      const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const month = monthNames[fecha.getMonth()];
      const year = fecha.getFullYear();

      return `${day} de ${month} de ${year}`;
    } catch (e) {
      return fechaHora;
    }
  }

  irAConfiguracion(): void {
    this.navigateToConfig.emit();
  }
}
