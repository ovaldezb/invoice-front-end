import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturacionService } from '../../services/facturacion.service';
import { FacturaCalculatorService } from '../../services/factura-calculator.service';
import { RegimenFiscal } from '../../models/regimenfiscal';
import { UsoCFDI } from '../../models/usoCfdi';
import { HttpResponse } from '@angular/common/http';
import { FormaPago } from '../../models/formapago';
import { Timbrado } from '../../models/timbrado';
import { Global } from '../../services/Global';
import { Receptor } from '../../models/receptor';
import { VentaTapete } from '../../models/ventaTapete';
import { Ticket } from '../../models/ticket';
import { Certificado } from '../../models/certificado';
import Swal from 'sweetalert2';
import { Folio } from '../../models/folio';
import { FolioService } from '../../services/folio.service';
import { Sucursal } from '../../models/sucursal';
import { ParsePdfService } from '../../services/parse-pdf.service';
import { EnvironmentService } from '../../services/environment.service';
import { ErrorTrackingService } from '../../services/error-tracking.service';
import { TipoErrorFacturacion } from '../../models/errorFacturacion';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-genera-factura',
  imports: [FormsModule,CommonModule],
  templateUrl: './genera-factura.component.html',
  styleUrl: './genera-factura.component.css'
})
export class GeneraFacturaComponent implements OnInit, OnDestroy {
  public Global = Global;
  public listaRegimenFiscal: RegimenFiscal[] = [];
  public listaRegimenFiscalBase: RegimenFiscal[] = [];
  public listaUsoCfdi: UsoCFDI[] = [];
  public listaFormaPago: FormaPago[] = [];
  public listaUsoCfdiFiltrado:UsoCFDI[]=[];
  public timbrado       :Timbrado={} as Timbrado;
  public receptor        :Receptor= new Receptor('','','','','','','');
  public ventaTapete     :VentaTapete=new VentaTapete('',new Ticket('','',0,0,0,0),[],{formapago:''});
  public certificado : Certificado = {} as Certificado;
  public ticketNumber: string = '';
  public isLoading: boolean = false;
  public isLoadingFactura: boolean = false;
  public isBusquedaTicket: boolean = true;
  public showValidationErrors: boolean = false;
  public folio: Folio = new Folio('', '', 0);
  public sucursal: Sucursal = new Sucursal('', '', '', '','','','','','');
  public isLoadingReceptor: boolean = false;

  
  selectedPdf: File | null = null;
  selectedPdfName: string = '';
  public isUploadingPdf: boolean = false;
  public backEndEnv: string = '';
  
  // Subject para implementar debounce en búsqueda de RFC
  private rfcSearchSubject = new Subject<string>();

  constructor(
    private facturacionService: FacturacionService,
    private facturaCalculator: FacturaCalculatorService,
    private folioService: FolioService,
    private pdfService: ParsePdfService,
    private environmentService: EnvironmentService,
    private errorTrackingService: ErrorTrackingService
  ) { }

  ngOnInit(): void {
    // Resetear listas para forzar carga fresca
    this.listaRegimenFiscal = [];
    this.listaRegimenFiscalBase = [];
    this.listaUsoCfdi = [];
    this.listaFormaPago = [];
    this.listaUsoCfdiFiltrado = [];
    
    this.obtieneDatosParaFacturar();
    this.getEnvironment();
    this.setupRfcDebounce();
  }

  ngOnDestroy(): void {
    this.rfcSearchSubject.complete();
  }

  /**
   * Configura el debounce para la búsqueda de RFC
   */
  private setupRfcDebounce(): void {
    this.rfcSearchSubject.pipe(
      debounceTime(800), // Espera 800ms después del último cambio
      distinctUntilChanged() // Solo emite si el valor cambió
    ).subscribe(rfc => {
      if (rfc && rfc.length >= 12) {
        this.buscarReceptorPorRfc(rfc);
      }
    });
  }

  /**
   * Método que se llama desde el template al cambiar el RFC
   */
  onRfcChange(rfc: string): void {
    this.rfcSearchSubject.next(rfc.toUpperCase());
  }

  getEnvironment():void{
    this.environmentService.getEnvironment()
    .subscribe({
      next: (response:HttpResponse<any>) => {      
          this.backEndEnv = response.body.environment || '';
          console.log(response.body);
      },
      error: (error) => {
        this.backEndEnv = '';
        console.error(error);
      }
    }); 
  }

  generaFactura():void{
    // Limpiar espacios en blanco de todos los campos del receptor
    this.trimReceptorFields();
    
    // Usar el servicio de cálculo para construir el timbrado
    const timbrado: Timbrado = this.facturaCalculator.buildTimbrado(
      this.ventaTapete,
      this.receptor,
      this.certificado,
      this.sucursal
    );
    
    const factura = {
      timbrado:      timbrado,
      sucursal:      this.sucursal.codigo_sucursal,
      ticket:        this.ventaTapete.ticket.noVenta,
      idCertificado: this.certificado._id,
      fechaVenta:    this.ventaTapete.ticket.fecha,
      email:         this.receptor.email,
      direccion:     this.sucursal.direccion,
      empresa:       this.certificado.nombre
    }
    this.facturacionService.generaFactura(factura)
    .subscribe({
      next: (response) => {
        if(this.receptor._id==''){
          this.guardaReceptor();
        }
        // Descargar el archivo XML CFDI
        const xmlContent = response.body != undefined ? (response.body as any).cfdi : null;
        const uuid = response.body != undefined ? (response.body as any).uuid : '';
        const pdfBase64 = response.body != undefined ? (response.body as any).pdf_cfdi_b64 : null;
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
                    <a href="${xmlUrl}" download="${uuid}.xml" class="text-blue-600 hover:text-blue-700 font-semibold" style="display:inline-flex;align-items:center;gap:8px;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px;height:24px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Descargar XML</span>
                    </a>
                  </td>
                  <td style="text-align:center;width:50%;border: 1px solid #e5e7eb;padding: 16px;">
                    <a href="${pdfUrl}" download="${uuid}.pdf" class="text-blue-600 hover:text-blue-700 font-semibold" style="display:inline-flex;align-items:center;gap:8px;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;">
                        <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-5.828-5.828A2 2 0 0 0 13.172 2H6zm7 1.414L18.586 9H15a2 2 0 0 1-2-2V3.414zM8 14h1v4H8v-4zm2 0h1v4h-1v-4zm2 0h1v4h-1v-4z"/>
                      </svg>
                      <span>Descargar PDF</span>
                    </a>
                  </td>
                </tr>
              </table>
            `,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Cerrar'
          });
        }
        this.limpiaDatosVentaFactura();
      },
      error: (error) => {
        this.isLoadingFactura = false;
        
        // 🆕 Registrar error en el sistema de tracking
        this.registrarError(error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error al generar factura',
          html: `
            <p class="mb-2">${error.error?.message || 'Error desconocido'}</p>
            <small class="text-gray-500">Este error ha sido registrado para seguimiento del administrador</small>
          `,
          confirmButtonColor: '#3b82f6',
        });
      }
    });
  }

  limpiaDatosVentaFactura():void{
    this.isLoadingFactura = false;
    this.showValidationErrors = false;
    this.isBusquedaTicket = true;
    this.timbrado = {} as Timbrado;
    this.receptor = new Receptor('','','','','','','');
    this.ventaTapete = new VentaTapete('',new Ticket('','',0,0,0,0),[],{formapago:''});
  }

  /**
   * Busca los datos del receptor por RFC (método interno con lógica)
   */
  private buscarReceptorPorRfc(rfc: string): void {
    this.isLoadingReceptor = true;
    this.facturacionService.obtieneDatosReceptorByRfc(rfc)
    .subscribe({
      next: (response) => {
        this.receptor = response.body ? response.body as Receptor : new Receptor(rfc, '', '', '', '','','');
        this.filtraUsoCfdi(this.receptor.RegimenFiscalReceptor);
        this.isLoadingReceptor = false;
      },
      error: (error) => {
        // Limpiar receptor si hay error para evitar datos obsoletos
        const rfcActual = rfc;
        this.receptor = new Receptor(rfcActual, '', '', '', '','','');
        
        if(this.facturaCalculator.esPersonaFisica(rfcActual)){
          this.listaRegimenFiscal = this.listaRegimenFiscalBase.filter(rf=>rf.fisica===true);
        }else{
          this.listaRegimenFiscal = this.listaRegimenFiscalBase.filter(rf=>rf.moral===true);
        }
        this.receptor.RegimenFiscalReceptor = '';
        this.isLoadingReceptor = false;
      }
    });
  }

  /**
   * Método público para compatibilidad con blur event (deprecated)
   * @deprecated Usa onRfcChange en su lugar
   */
  obtieneReceptor(){
    if (!this.receptor.Rfc || this.receptor.Rfc.length < 12) {
      return;
    }
    this.buscarReceptorPorRfc(this.receptor.Rfc.toUpperCase());
  }

  guardaReceptor(){
    // Limpiar espacios en blanco antes de guardar
    this.trimReceptorFields();
    
    this.facturacionService.guardaReceptor(this.receptor)
    .subscribe({
      next: (response) => {
        //console.log('Receptor guardado:', response.body);
      },
      error: (error) => {
        //console.error('Error al guardar receptor:', error);
      }
    }); 
  }

  obtieneDatosParaFacturar() {
    // Resetear listas antes de cargar para evitar datos antiguos
    this.listaRegimenFiscal = [];
    this.listaRegimenFiscalBase = [];
    this.listaUsoCfdi = [];
    this.listaFormaPago = [];
    
    this.facturacionService.getDatosParaFacturar()
    .subscribe({
      next: (response: HttpResponse<any>) => {      
          this.listaRegimenFiscal = response.body.regimen_fiscal || [];
          this.listaRegimenFiscalBase = response.body.regimen_fiscal || [];
          this.listaUsoCfdi = response.body.uso_cfdi || [];
          this.listaFormaPago = response.body.forma_pago || [];
      },
      error: (error) => {
        this.listaRegimenFiscal = [];
        this.listaRegimenFiscalBase = [];
        this.listaUsoCfdi = [];
        this.listaFormaPago = [];
        console.error(error);
      }
    });
  }

  consultarVenta() {
    // Limpiar espacios en blanco del número de ticket
    this.ticketNumber = this.ticketNumber ? this.ticketNumber.trim() : '';
    
    if (!this.ticketNumber) {
      return;
    }
    
    this.isLoading = true;
    // Resetear datos antes de consultar para evitar mostrar datos antiguos
    this.ventaTapete = new VentaTapete('',new Ticket('','',0,0,0,0),[],{formapago:''});
    this.certificado = {} as Certificado;
    this.sucursal = new Sucursal('', '', '', '','','','','','');
    
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
        this.ticketNumber = '';
        Swal.fire({
          icon: 'warning',
          title: 'Venta no encontrada',
          text: error.error.message,
          confirmButtonColor: '#3b82f6',
        });
      },
      complete: () => {
        this.isLoading = false;
      } 
    });
  }

  buscaUsoCfdi(event:any):void{
    this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter(
      (cfdi)=>cfdi.regfiscalreceptor.indexOf(this.listaRegimenFiscal[event.target["selectedIndex"]-1].regimenfiscal)>=0
    )
  }

  filtraUsoCfdi(regimenfiscal:string):void{
    this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter((cfdi)=>cfdi.regfiscalreceptor.indexOf(regimenfiscal)>=0)
  }

  isFormValid(): boolean {
    return this.facturaCalculator.isReceptorValid(this.receptor);
  }

  isValidEmail(email: string): boolean {
    return this.facturaCalculator.isValidEmail(email);
  }

  /**
   * TrackBy function para optimizar el rendimiento del *ngFor
   */
  trackByProducto(index: number, producto: any): any {
    return producto.claveproducto || index;
  }

  regresarAConsulta() {
    this.ventaTapete = new VentaTapete('',new Ticket('','',0,0,0,0),[],{formapago:''});
    this.receptor = new Receptor('','','','','','','');
    this.listaUsoCfdiFiltrado = [];
    this.showValidationErrors = false;
    this.isBusquedaTicket = true;
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
    this.generaFactura();
  }

  // Maneja la selección de archivo desde el input (solo PDF)
  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || input.files.length === 0) {
      this.selectedPdf = null;
      this.selectedPdfName = '';
      return;
    }
    const file = input.files[0];
    this.selectedPdf = file;
    this.selectedPdfName = file.name;
  }

  // Sube el PDF (muestra spinner mientras dura la operación)
  async uploadPdf() {
    if (!this.selectedPdf) {
      return;
    }
    
    try {
      this.isUploadingPdf = true;
      const formData = new FormData();
      formData.append('csf', this.selectedPdf, this.selectedPdf.name);
      this.pdfService.parsePdf(formData).subscribe({
        next: (response) => {
          this.isUploadingPdf = false;
          // Manejar la respuesta del servidor
          this.receptor.Rfc = response.body.csf.Rfc || '';
          this.receptor.Nombre = response.body.csf.razonSocial || '';
          this.receptor.DomicilioFiscalReceptor = response.body.csf.codigoPostal || '';
          const listaRegimenes = response.body.csf.regimenFiscal ? response.body.csf.regimenFiscal : [];
          //buscar el regimen fiscal recibido del PDF en la lista de regimenes fiscales
          let filteredRegimenes = []
          this.listaRegimenFiscal = this.listaRegimenFiscalBase;
          filteredRegimenes = this.listaRegimenFiscal.filter(
            rf => {
              return listaRegimenes.some(
                (rffound: string) => {
                  return rffound.includes(rf.descripcion);
                }
              );
            }
          ).sort((a, b) => a.regimenfiscal.localeCompare(b.regimenfiscal));
          
          this.listaRegimenFiscal = filteredRegimenes;
          if(this.listaRegimenFiscal.length === 1) {
            this.receptor.RegimenFiscalReceptor = filteredRegimenes[0].regimenfiscal;
            this.filtraUsoCfdi(this.receptor.RegimenFiscalReceptor);
          } else {
            this.receptor.RegimenFiscalReceptor = '';
            this.listaUsoCfdiFiltrado = [];
          }
          this.receptor.UsoCFDI = '';
          Swal.fire({
            icon: 'success',
            title: '¡PDF procesado!',
            text: 'El archivo PDF ha sido procesado exitosamente.',
            confirmButtonColor: '#3b82f6',
            timer: Global.TIMER_OFF
          });
          this.selectedPdf = null;
        },
        error: (error) => {
          //console.error('Error subiendo PDF:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al procesar PDF',
            text: 'Ocurrió un error al procesar el archivo PDF. Verifica que sea válido.',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
      this.selectedPdfName = '';
    } catch (error) {
      //console.error('Error subiendo PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al subir PDF',
        text: 'Ocurrió un error al subir el archivo PDF.',
        confirmButtonColor: '#3b82f6'
      });
    } 
  }

  /**
   * Limpia espacios en blanco de todos los campos de texto del receptor
   */
  private trimReceptorFields(): void {
    if (this.receptor.Rfc) {
      this.receptor.Rfc = this.receptor.Rfc.trim().toUpperCase();
    }
    if (this.receptor.Nombre) {
      this.receptor.Nombre = this.receptor.Nombre.trim();
    }
    if (this.receptor.DomicilioFiscalReceptor) {
      this.receptor.DomicilioFiscalReceptor = this.receptor.DomicilioFiscalReceptor.trim();
    }
    if (this.receptor.email) {
      this.receptor.email = this.receptor.email.trim().toLowerCase();
    }
    if (this.receptor.RegimenFiscalReceptor) {
      this.receptor.RegimenFiscalReceptor = this.receptor.RegimenFiscalReceptor.trim();
    }
    if (this.receptor.UsoCFDI) {
      this.receptor.UsoCFDI = this.receptor.UsoCFDI.trim();
    }
  }

  /**
   * Registra un error de facturación en el sistema de tracking
   * Esto permite al administrador ver errores y ser proactivo con los clientes
   */
  private registrarError(error: any): void {
    // Clasificar el tipo de error basado en el código o mensaje
    const tipoError = this.clasificarTipoError(error);
    
    // Preparar los datos del error
    const errorData = {
      fecha: new Date(),
      ticketNumber: this.ventaTapete?.ticket?.noVenta || 'N/A',
      rfcReceptor: this.receptor?.Rfc || 'N/A',
      nombreReceptor: this.receptor?.Nombre || 'N/A',
      emailReceptor: this.receptor?.email || 'N/A',
      tipoError: tipoError,
      codigoError: error.status?.toString() || error.error?.code || 'UNKNOWN',
      mensajeError: error.error?.message || error.message || 'Error desconocido',
      detalleError: {
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        url: error.url,
        timestamp: new Date().toISOString()
      },
      sucursal: this.sucursal?.codigo_sucursal || 'N/A',
      intentos: 1, // TODO: Incrementar si ya existe el mismo ticket/RFC
      estado: 'pendiente' as const
    };

    // Guardar el error en el backend (o simular si el backend no está listo)
    this.errorTrackingService.guardarError(errorData).subscribe({
      next: (response) => {
        console.log('✅ Error registrado exitosamente:', response.body);
      },
      error: (err) => {
        console.error('❌ Error al registrar el error:', err);
        // No mostrar mensaje al usuario para no confundir más
      }
    });
  }

  /**
   * Clasifica el tipo de error basándose en el código o mensaje de error
   */
  private clasificarTipoError(error: any): TipoErrorFacturacion {
    const codigo = error.error?.code || '';
    const mensaje = (error.error?.message || '').toLowerCase();
    
    // Errores CFDI específicos
    if (codigo === 'CFDI40147' || mensaje.includes('código postal') || mensaje.includes('domicilio fiscal')) {
      return 'CFDI40147';
    }
    if (codigo === 'CFDI40116' || mensaje.includes('rfc') && mensaje.includes('inválido')) {
      return 'CFDI40116';
    }
    if (codigo === 'CFDI40124' || mensaje.includes('uso cfdi') || mensaje.includes('régimen fiscal')) {
      return 'CFDI40124';
    }
    
    // Errores de certificado
    if (codigo === 'CERT_EXPIRED' || mensaje.includes('certificado') && (mensaje.includes('vencido') || mensaje.includes('expirado'))) {
      return 'CERTIFICADO_VENCIDO';
    }
    if (codigo === 'CERT_INVALID' || mensaje.includes('certificado') && mensaje.includes('inválido')) {
      return 'CERTIFICADO_INVALIDO';
    }
    
    // Errores de timbres
    if (codigo === 'NO_STAMPS' || mensaje.includes('timbre') || mensaje.includes('stamp')) {
      return 'SIN_TIMBRES';
    }
    
    // Errores de red/timeout
    if (error.status === 504 || mensaje.includes('timeout') || mensaje.includes('tiempo agotado')) {
      return 'TIMEOUT';
    }
    if (error.status === 0 || mensaje.includes('network') || mensaje.includes('conexión')) {
      return 'ERROR_RED';
    }
    
    // Errores de validación
    if (error.status === 400 || mensaje.includes('validación') || mensaje.includes('validation')) {
      return 'ERROR_VALIDACION';
    }
    
    // Errores del SAT
    if (mensaje.includes('sat') || mensaje.includes('pac')) {
      return 'ERROR_SAT';
    }
    
    // Errores del servidor
    if (error.status >= 500 && error.status < 600) {
      return 'ERROR_SERVIDOR';
    }
    
    // Otros errores no clasificados
    return 'OTRO';
  }
}
