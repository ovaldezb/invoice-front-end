import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { MercadoPagoService } from '../../services/mercado-pago.service';
import { FacturacionService } from '../../services/facturacion.service';
import { CertificadosService } from '../../services/certificados.service';
import { AuthService } from '../../services/auth.service';
//import { FacturaCalculatorService } from '../../services/factura-calculator.service';
import { FacturaServicioCalculatorService } from '../../services/factura-servicio-calculator.service';
import { TimbresService } from '../../services/timbres.service';
import { PaymentConfig } from '../../models/payment-config';
import { RegimenFiscal } from '../../models/regimenfiscal';
import { UsoCFDI } from '../../models/usoCfdi';
import { Certificado } from '../../models/certificado';
import { Sucursal } from '../../models/sucursal';
import { Receptor } from '../../models/receptor';
import { Emisor } from '../../models/emisor';

@Component({
  selector: 'app-emitir-factura',
  imports: [CommonModule, FormsModule],
  templateUrl: './emitir-factura.component.html',
  styleUrl: './emitir-factura.component.css'
})
export class EmitirFacturaComponent implements OnInit {
  paymentConfigs: PaymentConfig[] = [];
  isLoading: boolean = true;
  totalAmount: number = 0;

  // Receiver Data
  /*rfc: string = '';
  nombreRazonSocial: string = '';
  regimenFiscal: string = '';
  usoCfdi: string = '';
  codigoPostal: string = '';*/
  correo: string = '';

  //Receptor
  receptor: Receptor = new Receptor('', '', '', '', '');

  // Catalogs
  regimenesFiscales: RegimenFiscal[] = [];
  usosCfdi: UsoCFDI[] = [];
  filteredUsosCfdi: UsoCFDI[] = [];

  // Data for Stamping
  invoiceCount: number = 0;
  //idUsuarioCognito: string = '';
  //certificado: Certificado | null = null;
  emisor: Emisor = new Emisor('VABO780711D41', 'OMAR VALDEZ BECERRIL', '612');

  constructor(
    private mercadoPagoService: MercadoPagoService,
    private facturacionService: FacturacionService,
    //private facturaCalculatorService: FacturaCalculatorService,
    private facturaServicioCalculatorService: FacturaServicioCalculatorService,
    private timbresService: TimbresService
  ) { }

  ngOnInit(): void {
    this.loadPaymentConfig();
    this.loadCatalogs();
  }

  loadCatalogs(): void {
    this.facturacionService.getDatosParaFacturar().subscribe({
      next: (response: HttpResponse<any>) => {
        if (response.body) {
          this.regimenesFiscales = response.body.regimen_fiscal || [];
          this.usosCfdi = response.body.uso_cfdi || [];
        }
      },
      error: (error) => {
        console.error('Error loading catalogs:', error);
      }
    });
  }

  onRegimenChange(): void {
    if (this.receptor.RegimenFiscalReceptor) {
      this.filteredUsosCfdi = this.usosCfdi.filter(u =>
        u.regfiscalreceptor && u.regfiscalreceptor.includes(this.receptor.RegimenFiscalReceptor)
      );
      // Reset Uso CFDI if current selection is not valid for new regimen
      if (this.receptor.UsoCFDI) {
        const isValid = this.filteredUsosCfdi.some(u => u.usoCfdi === this.receptor.UsoCFDI);
        if (!isValid) {
          this.receptor.UsoCFDI = '';
        }
      }
    } else {
      this.filteredUsosCfdi = [];
      this.receptor.UsoCFDI = '';
    }
  }

  get isFormValid(): boolean {
    return !!(
      this.receptor.Rfc &&
      this.receptor.Nombre &&
      this.receptor.RegimenFiscalReceptor &&
      this.receptor.UsoCFDI &&
      this.receptor.DomicilioFiscalReceptor &&
      this.receptor.DomicilioFiscalReceptor.length === 5 &&
      this.correo &&
      this.isValidEmail(this.correo)
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generarFactura(): void {
    if (!this.isFormValid) return;

    this.isLoading = true;
    // Add email to receptor (not in constructor but needed for sending)
    this.receptor.email = this.correo;
    const timbradoPayload = this.facturaServicioCalculatorService.buildTimbrado(
      this.paymentConfigs,
      this.receptor,
      this.emisor,
      'F',
      this.invoiceCount
    );

    const payload = { timbrado: timbradoPayload };

    console.log('Sending Timbrado Payload:', payload);

    this.timbresService.timbrarFactura(payload).subscribe({
      next: (response) => {
        console.log('Timbrado Response:', response);
        this.isLoading = false;
        if (response.status === 200 || response.status === 201) {
          alert('Factura generada exitosamente!');
          // Optional: Clear form or redirect
        } else {
          alert('Error al generar factura');
        }
      },
      error: (error) => {
        console.error('Timbrado Error:', error);
        this.isLoading = false;
        alert('Ocurrió un error al generar la factura. Ver consola para más detalles.');
      }
    });
  }

  loadPaymentConfig(): void {
    this.isLoading = true;
    this.mercadoPagoService.getPaymentConfigs().subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          this.paymentConfigs = response.body.payment_config || [];
          this.loadInvoiceConsumption();
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading payment config:', error);
        this.isLoading = false;
      }
    });
  }

  loadInvoiceConsumption(): void {
    const today = new Date();
    // Logic to get previous month
    // const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // const month = lastMonthDate.getMonth() + 1;
    // const year = lastMonthDate.getFullYear();
    const month = 9;
    const year = 2025;

    this.mercadoPagoService.getInvoiceCount(month, year).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          const count = response.body.count;
          this.invoiceCount = count;
          if (count > 0) {
            const billingConfig = this.paymentConfigs.find(c => c.nombre_pago === 'Timbrado de Facturas');

            if (billingConfig) {
              const unitPrice = billingConfig.costo;
              const totalCost = count * unitPrice;

              billingConfig.nombre_pago = `Timbrado de Facturas (x${count})`;
              billingConfig.costo = totalCost;
            }
          }
        }
        this.calculateTotal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading invoice count:', error);
        this.isLoading = false;
        this.calculateTotal();
      }
    });
  }

  calculateTotal(): void {
    this.totalAmount = this.paymentConfigs.reduce((sum, config) => sum + config.costo, 0);
  }
}
