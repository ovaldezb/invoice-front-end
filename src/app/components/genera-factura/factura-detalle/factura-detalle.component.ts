import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { FacturacionService } from '../../../services/facturacion.service';
import { FacturaCalculatorService } from '../../../services/factura-calculator.service';
import { RegimenFiscal } from '../../../models/regimenfiscal';
import { UsoCFDI } from '../../../models/usoCfdi';
import { FormaPago } from '../../../models/formapago';
import { Timbrado } from '../../../models/timbrado';
import { Global } from '../../../services/Global';
import { Receptor } from '../../../models/receptor';
import { VentaTapete } from '../../../models/ventaTapete';
import { Certificado } from '../../../models/certificado';
import { Sucursal } from '../../../models/sucursal';
import { ParsePdfService } from '../../../services/parse-pdf.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-factura-detalle',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './factura-detalle.component.html',
  styleUrl: './factura-detalle.component.css'
})
export class FacturaDetalleComponent implements OnInit {
  public Global = Global;

  @Input() ventaTapete: VentaTapete = new VentaTapete('', { noVenta: '', fecha: '', subtotal: 0, impuesto: 0, total: 0, estado: 0 }, [], { formapago: '' });
  @Input() certificado: Certificado = {} as Certificado;
  @Input() sucursal: Sucursal = new Sucursal('', '', '', '', '', '', '', '', '');

  @Output() onReset = new EventEmitter<void>();

  public receptor: Receptor = new Receptor('', '', '', '', '', '', '');
  public timbrado: Timbrado = {} as Timbrado;
  public listaRegimenFiscal: RegimenFiscal[] = [];
  public listaRegimenFiscalBase: RegimenFiscal[] = [];
  public listaUsoCfdi: UsoCFDI[] = [];
  public listaUsoCfdiFiltrado: UsoCFDI[] = [];
  public listaFormaPago: FormaPago[] = [];

  public isLoadingFactura: boolean = false;
  public isLoadingReceptor: boolean = false;
  public showValidationErrors: boolean = false;

  // PDF processing
  selectedPdf: File | null = null;
  selectedPdfName: string = '';
  public isUploadingPdf: boolean = false;

  constructor(
    private facturacionService: FacturacionService,
    private facturaCalculator: FacturaCalculatorService,
    private pdfService: ParsePdfService
  ) { }

  ngOnInit(): void {
    this.obtieneDatosParaFacturar();
  }

  obtieneDatosParaFacturar() {
    this.facturacionService.getDatosParaFacturar()
      .subscribe({
        next: (response: HttpResponse<any>) => {
          this.listaRegimenFiscal = response.body.regimen_fiscal || [];
          this.listaRegimenFiscalBase = response.body.regimen_fiscal || [];
          this.listaUsoCfdi = response.body.uso_cfdi || [];
          this.listaFormaPago = response.body.forma_pago || [];
        },
        error: (error) => {
          console.error('Error al obtener datos base para facturar:', error);
        }
      });
  }

  onRfcBlur(): void {
    this.receptor.Rfc = this.receptor.Rfc ? this.receptor.Rfc.trim().toUpperCase() : '';
    if (this.receptor.Rfc && this.receptor.Rfc.length >= 12) {
      this.buscarReceptorPorRfc(this.receptor.Rfc);
    }
  }

  onRfcEnter(event: Event): void {
    event.preventDefault();
    this.receptor.Rfc = this.receptor.Rfc ? this.receptor.Rfc.trim().toUpperCase() : '';
    if (this.receptor.Rfc && this.receptor.Rfc.length >= 12) {
      this.buscarReceptorPorRfc(this.receptor.Rfc);
    }
  }

  private buscarReceptorPorRfc(rfc: string): void {
    this.isLoadingReceptor = true;
    this.facturacionService.obtieneDatosReceptorByRfc(rfc)
      .subscribe({
        next: (response) => {
          this.receptor = response.body ? response.body as Receptor : new Receptor(rfc, '', '', '', '', '', '');
          this.filtraUsoCfdi(this.receptor.RegimenFiscalReceptor);
          this.isLoadingReceptor = false;
        },
        error: (error) => {
          this.receptor = new Receptor(rfc, '', '', '', '', '', '');
          if (this.facturaCalculator.esPersonaFisica(rfc)) {
            this.listaRegimenFiscal = this.listaRegimenFiscalBase.filter(rf => rf.fisica === true);
          } else {
            this.listaRegimenFiscal = this.listaRegimenFiscalBase.filter(rf => rf.moral === true);
          }
          this.receptor.RegimenFiscalReceptor = '';
          this.isLoadingReceptor = false;
        }
      });
  }

  buscaUsoCfdi(event: any): void {
    const selectedIndex = event.target["selectedIndex"];
    if (selectedIndex > 0) {
      this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter(
        (cfdi) => cfdi.regfiscalreceptor.indexOf(this.listaRegimenFiscal[selectedIndex - 1].regimenfiscal) >= 0
      );
    }
  }

  filtraUsoCfdi(regimenfiscal: string): void {
    if (regimenfiscal) {
      this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter((cfdi) => cfdi.regfiscalreceptor.indexOf(regimenfiscal) >= 0);
    }
  }

  onCpChange(value: string): void {
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    if (this.receptor.DomicilioFiscalReceptor !== cleaned) {
      this.receptor.DomicilioFiscalReceptor = cleaned;
    }
  }

  isFormValid(): boolean {
    return this.facturaCalculator.isReceptorValid(this.receptor);
  }

  isValidEmail(email: string): boolean {
    return this.facturaCalculator.isValidEmail(email);
  }

  generarFactura() {
    this.showValidationErrors = true;
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Por favor, complete todos los campos obligatorios antes de generar la factura.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    this.isLoadingFactura = true;
    this.procedeAGenerarFactura();
  }

  private procedeAGenerarFactura(): void {
    this.trimReceptorFields();
    const timbrado: Timbrado = this.facturaCalculator.buildTimbrado(
      this.ventaTapete,
      this.receptor,
      this.certificado,
      this.sucursal
    );

    const factura = {
      timbrado: timbrado,
      sucursal: this.sucursal.codigo_sucursal,
      ticket: this.ventaTapete.ticket.noVenta,
      idCertificado: this.certificado._id,
      fechaVenta: this.ventaTapete.ticket.fecha,
      email: this.receptor.email,
      direccion: this.sucursal.direccion,
      empresa: this.certificado.nombre
    };

    this.facturacionService.generaFactura(factura)
      .subscribe({
        next: (response) => {
          if (this.receptor._id == '') {
            this.guardaReceptor();
          }
          this.handleSuccessResponse(response);
          this.isLoadingFactura = false;
        },
        error: (error) => {
          this.isLoadingFactura = false;
          Swal.fire({
            icon: 'error',
            title: 'Error al generar factura',
            text: error.error.message || 'Ocurrió un error inesperado.',
            confirmButtonColor: '#3b82f6',
          });
        }
      });
  }

  private handleSuccessResponse(response: any): void {
    const xmlContent = response.body?.cfdi;
    const uuid = response.body?.uuid;
    const pdfBase64 = response.body?.pdf_cfdi_b64;
    let xmlUrl = '';
    let pdfUrl = '';

    if (xmlContent && uuid) {
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      xmlUrl = window.URL.createObjectURL(blob);
    }

    if (pdfBase64 && uuid) {
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
      pdfUrl = window.URL.createObjectURL(pdfBlob);
    }

    if (uuid && (xmlUrl || pdfUrl)) {
      Swal.fire({
        icon: 'success',
        title: '¡Factura generada!',
        html: `
          <p class="mb-4 text-gray-700">Se adjuntan los archivos generados</p>
          <table style="width:100%;text-align:center;border-collapse: collapse;">
            <tr>
              <th style="text-align:center;width:50%;border: 1px solid #e5e7eb;padding: 8px;background-color: #f9fafb;">XML</th>
              <th style="text-align:center;width:50%;border: 1px solid #e5e7eb;padding: 8px;background-color: #f9fafb;">PDF</th>
            </tr>
            <tr>
              <td style="text-align:center;width:50%;border: 1px solid #e5e7eb;padding: 16px;">
                <a href="${xmlUrl}" download="${uuid}.xml" class="text-blue-600 hover:text-blue-700 font-semibold">Descargar XML</a>
              </td>
              <td style="text-align:center;width:50%;border: 1px solid #e5e7eb;padding: 16px;">
                <a href="${pdfUrl}" download="${uuid}.pdf" class="text-blue-600 hover:text-blue-700 font-semibold">Descargar PDF</a>
              </td>
            </tr>
          </table>
        `,
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Cerrar'
      }).then(() => {
        this.regresar();
      });
    }
  }

  guardaReceptor() {
    this.trimReceptorFields();
    this.facturacionService.guardaReceptor(this.receptor).subscribe();
  }

  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedPdf = input.files[0];
      this.selectedPdfName = this.selectedPdf.name;
    }
  }

  async uploadPdf() {
    if (!this.selectedPdf) return;
    try {
      this.isUploadingPdf = true;
      const formData = new FormData();
      formData.append('csf', this.selectedPdf, this.selectedPdf.name);
      this.pdfService.parsePdf(formData).subscribe({
        next: (response) => {
          this.isUploadingPdf = false;
          this.receptor.Rfc = response.body.csf.Rfc || '';
          this.receptor.Nombre = response.body.csf.razonSocial || '';
          this.receptor.DomicilioFiscalReceptor = response.body.csf.codigoPostal || '';

          const listaRegimenes = response.body.csf.regimenFiscal || [];
          this.listaRegimenFiscal = this.listaRegimenFiscalBase;
          const filteredRegimenes = this.listaRegimenFiscal.filter(
            rf => listaRegimenes.some((rffound: string) => rffound.includes(rf.descripcion))
          ).sort((a, b) => a.regimenfiscal.localeCompare(b.regimenfiscal));

          this.listaRegimenFiscal = filteredRegimenes;
          if (this.listaRegimenFiscal.length === 1) {
            this.receptor.RegimenFiscalReceptor = filteredRegimenes[0].regimenfiscal;
            this.filtraUsoCfdi(this.receptor.RegimenFiscalReceptor);
          } else {
            this.receptor.RegimenFiscalReceptor = '';
            this.listaUsoCfdiFiltrado = [];
          }
          this.receptor.UsoCFDI = '';
          Swal.fire({ icon: 'success', title: '¡PDF procesado!', text: 'El archivo PDF ha sido procesado exitosamente.', confirmButtonColor: '#3b82f6' });
          this.selectedPdf = null;
          this.selectedPdfName = '';
        },
        error: () => {
          this.isUploadingPdf = false;
          Swal.fire({ icon: 'error', title: 'Error al procesar PDF', text: 'Ocurrió un error al procesar el archivo PDF.', confirmButtonColor: '#3b82f6' });
        }
      });
    } catch (err) {
      this.isUploadingPdf = false;
    }
  }

  regresar() {
    this.onReset.emit();
  }

  trackByProducto(index: number, producto: any): any {
    return producto.claveproducto || index;
  }

  private trimReceptorFields(): void {
    if (this.receptor.Rfc) this.receptor.Rfc = this.receptor.Rfc.trim().toUpperCase();
    if (this.receptor.Nombre) this.receptor.Nombre = this.receptor.Nombre.trim();
    if (this.receptor.DomicilioFiscalReceptor) this.receptor.DomicilioFiscalReceptor = this.receptor.DomicilioFiscalReceptor.trim();
    if (this.receptor.email) this.receptor.email = this.receptor.email.trim().toLowerCase();
    if (this.receptor.RegimenFiscalReceptor) this.receptor.RegimenFiscalReceptor = this.receptor.RegimenFiscalReceptor.trim();
    if (this.receptor.UsoCFDI) this.receptor.UsoCFDI = this.receptor.UsoCFDI.trim();
  }
}
