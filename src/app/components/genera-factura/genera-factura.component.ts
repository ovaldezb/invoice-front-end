import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturacionService } from '../../services/facturacion.service';
import { RegimenFiscal } from '../../models/regimenfiscal';
import { UsoCFDI } from '../../models/usoCfdi';
import { HttpResponse } from '@angular/common/http';
import { FormaPago } from '../../models/formapago';
import { Timbrado } from '../../models/timbrado';
import { Impuestos } from '../../models/impuestos';
import { ImpuestosConcepto } from '../../models/ImpuestosConcepto';
import { Global } from '../../services/Global';
import { Traslados } from '../../models/traslados';
import { Retenciones } from '../../models/retenciones';
import { Concepto } from '../../models/conceptos';
import { Emisor } from '../../models/emisor';
import { Receptor } from '../../models/receptor';
import { Venta } from '../../models/venta';
import { VentaTapete } from '../../models/ventaTapete';
import { Ticket } from '../../models/ticket';
import { Certificado } from '../../models/certificado';
import Swal from 'sweetalert2';
import { Folio } from '../../models/folio';
import { FolioService } from '../../services/folio.service';

@Component({
  selector: 'app-genera-factura',
  imports: [FormsModule,CommonModule],
  templateUrl: './genera-factura.component.html',
  styleUrl: './genera-factura.component.css'
})
export class GeneraFacturaComponent implements OnInit {
  public listaRegimenFiscal: RegimenFiscal[] = [];
  public listaUsoCfdi: UsoCFDI[] = [];
  public listaFormaPago: FormaPago[] = [];
  public listaUsoCfdiFiltrado:UsoCFDI[]=[];
  private timbrado       :Timbrado={} as Timbrado;
  public receptor        :Receptor= new Receptor('','','','','','');
  public venta           :Venta=new Venta('',[],new Date(),0,0,0,0,'','',0,'','','',false,false,false,new Date(),'');
  public ventaTapete     :VentaTapete=new VentaTapete('',new Ticket('','',0,0,0,0),[],[]);
  public certificado : Certificado = {} as Certificado;
  public ticketNumber: string = '';
  public isLoading: boolean = false;
  public isLoadingFactura: boolean = false;
  public isBusquedaTicket: boolean = true;
  public showValidationErrors: boolean = false;
  public folio: Folio = new Folio('', '', 0);

  constructor(private facturacionService: FacturacionService, private folioService: FolioService) { }

  ngOnInit(): void {
    this.obtieneDatosParaFacturar();
  }

  obtieneDatosParaFacturar() {
    this.facturacionService.getDatosParaFacturar()
    .subscribe({
      next: (response: HttpResponse<any>) => {      
          this.listaRegimenFiscal = response.body.regimen_fiscal || [];
          this.listaUsoCfdi = response.body.uso_cfdi || [];
          this.listaFormaPago = response.body.forma_pago || [];
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  obtieneFolio(sucursal: string) {
    this.folioService.obtieneFolioBySucursal(sucursal)
    .subscribe({
      next: (response) => {
        this.folio = response.body;
        console.log('Folio obtenido:', this.folio);
      },
      error: (error) => {
        console.error('Error al obtener folio:', error);
      }
    });
  }

  consultarVenta() {
    this.isLoading = true;
    this.facturacionService.obtieneDatosVenta(this.ticketNumber)
    .subscribe({
      next: (response: HttpResponse<any>) => {
        this.ventaTapete = response.body.venta;
        this.certificado = response.body.certificado;
        this.ticketNumber = '';
        this.isBusquedaTicket = false;
        this.obtieneFolio(this.ventaTapete.sucursal);
      },
      error: (error) => {
        this.isLoading = false;
        this.ticketNumber = '';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error.message,
          timer: Global.TIMER_OFF
        });
      },
      complete: () => {
        this.isLoading = false;
      } 
    });
  }

  buscaUsoCfdi(event:any):void{
    this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter((cfdi)=>cfdi.regfiscalreceptor.indexOf(this.listaRegimenFiscal[event.target["selectedIndex"]].regimenfiscal)>=0)
  }

  filtraUsoCfdi(regimenfiscal:string):void{
    this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter((cfdi)=>cfdi.regfiscalreceptor.indexOf(regimenfiscal)>=0)
  }

  llenaFactura():Timbrado{
    this.timbrado = {} as Timbrado;
    this.timbrado.Conceptos = [];
    let subTotal:number = 0;
    let total:number = 0;
    let totalImpuestos:number=0.0;
    let impuestoTrasladoBase:number=0.0;
    let impuestoTrasladoImporte:number=0.0;
    let impuestos:Impuestos= {} as Impuestos;
    impuestos.Traslados = [];
    impuestos.Retenciones = [];
    this.venta.ventaProducto.forEach(prod=>{
      let impuestosConcepto:ImpuestosConcepto = {} as ImpuestosConcepto;
      impuestosConcepto.Traslados = [];
      impuestosConcepto.Retenciones = [];
      let subTotalProd:number = prod.producto.precioVenta/Global.Factura.FACTOR_DIV;
      totalImpuestos += Number((subTotalProd * Global.Factura.IVA * prod.cantidad).toFixed(Global.DECIMAL_FIXED));
      subTotal += Number((subTotalProd * prod.cantidad).toFixed(Global.DECIMAL_FIXED));
      total += (prod.producto.precioVenta * prod.cantidad);
      let ValorUnitario:number = subTotalProd;
      let base:number =  Number((subTotalProd*prod.cantidad).toFixed(Global.DECIMAL_FIXED));
      let importeConceptoImpuestoTraslado = Number((subTotalProd*Global.Factura.IVA*prod.cantidad).toFixed(2));
      let traslados = new Traslados(
        base.toFixed(2),
        importeConceptoImpuestoTraslado.toFixed(Global.DECIMAL_FIXED),
        Global.Factura.ImpuestoIVA,
        Global.Factura.TasaOCuotaIVA,
        Global.Factura.Tasa);
      impuestosConcepto.Traslados.push(traslados);
      let retenciones = new Retenciones(
        base.toFixed(Global.DECIMAL_FIXED),
        '0.00',
        Global.Factura.ImpuestoISR,
        Global.Factura.TasaOCuotaISR,
        Global.Factura.Tasa);
      impuestosConcepto.Retenciones.push(retenciones);
      let concepto = new Concepto(
        '51142001',
        'X001',
        prod.cantidad.toFixed(1),
        'H87',
        'Pieza',
        prod.producto.descripcion, //Ojo con este porque puede estar incorrecto
        ValorUnitario.toFixed(Global.DECIMAL_FIXED),
        base.toFixed(Global.DECIMAL_FIXED),
        '0.00',
        Global.Factura.ObjectoImpuesto,
        impuestosConcepto
      );
      this.timbrado.Conceptos.push(concepto);
      impuestoTrasladoBase += base;
      impuestoTrasladoImporte += importeConceptoImpuestoTraslado;
    });
    
    let trasladoImpuesto = new Traslados(
      impuestoTrasladoBase.toFixed(Global.DECIMAL_FIXED),
      impuestoTrasladoImporte.toFixed(Global.DECIMAL_FIXED),
      Global.Factura.ImpuestoIVA,
      Global.Factura.TasaOCuotaIVA,
      Global.Factura.Tasa
    )
    let retencionImpuesto = new Retenciones(
        impuestoTrasladoBase.toFixed(Global.DECIMAL_FIXED),
        '0.00',
        Global.Factura.ImpuestoISR,
        Global.Factura.TasaOCuotaISR,
        Global.Factura.Tasa
      );
    impuestos.TotalImpuestosTrasladados = totalImpuestos.toFixed(2);
    impuestos.TotalImpuestosRetenidos = '0.00';
    impuestos.Traslados.push(trasladoImpuesto);
    impuestos.Retenciones.push(retencionImpuesto);
    
    this.timbrado.Version=Global.Factura.Version;
    this.timbrado.FormaPago=this.venta.formaPago;
    this.timbrado.Serie='SW';
    this.timbrado.Folio=this.venta.noTicket;
    this.timbrado.Fecha=this.getFechaFactura();
    this.timbrado.MetodoPago=Global.Factura.MetodoPago;
    this.timbrado.Sello='';
    this.timbrado.NoCertificado='';
    this.timbrado.Certificado='';
    this.timbrado.CondicionesDePago=Global.Factura.CondicionesPago;
    this.timbrado.SubTotal=subTotal.toFixed(Global.DECIMAL_FIXED);
    this.timbrado.Descuento='0.00';
    this.timbrado.Moneda=Global.Factura.Moneda;
    this.timbrado.TipoCambio=Global.Factura.TipoCambio;
    this.timbrado.Total=total.toFixed(Global.DECIMAL_FIXED);
    this.timbrado.TipoDeComprobante=Global.Factura.TipoComprobante;
    this.timbrado.Exportacion=Global.Factura.Exportacion;
    this.timbrado.LugarExpedicion='45610';
    this.timbrado.Emisor = new Emisor('XOCHILT CASAS CHAVEZ','CACX7605101P8','605');
    this.timbrado.Receptor = new Receptor(this.receptor.Rfc,this.receptor.Nombre,this.receptor.DomicilioFiscalReceptor,this.receptor.RegimenFiscalReceptor,this.receptor.UsoCFDI,'',this.receptor.email);
    this.timbrado.Impuestos = impuestos;
    return this.timbrado;
  }

  getFechaFactura():String{
    let hoy = new Date();
    let dia = hoy.getDate() < 10 ? '0'+hoy.getDate() : hoy.getDate();
    let mes = (hoy.getMonth() + 1) < 10 ? '0'+(hoy.getMonth() + 1) : (hoy.getMonth() + 1);
    let year = hoy.getFullYear();
    let hora = hoy.getHours() < 10 ? '0'+hoy.getHours() :hoy.getHours();
    let minuto = hoy.getMinutes() < 10 ? '0'+hoy.getMinutes() : hoy.getMinutes();
    let segundos = hoy.getSeconds() < 10 ? '0'+hoy.getSeconds() : hoy.getSeconds();
    return year+'-'+mes+'-'+dia+'T'+hora+':'+minuto+':'+segundos;
  }

  isFormValid(): boolean {
    return !!(
      this.receptor.Rfc &&
      this.receptor.DomicilioFiscalReceptor &&
      this.receptor.Nombre &&
      this.receptor.email &&
      this.isValidEmail(this.receptor.email) &&
      this.receptor.RegimenFiscalReceptor &&
      this.receptor.UsoCFDI
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  regresarAConsulta() {
    this.ventaTapete = new VentaTapete('',new Ticket('','',0,0,0,0),[],[]);
    this.receptor = new Receptor('','','','','','');
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
        text: 'Por favor, complete todos los campos obligatorios antes de generar la factura.'
      });
      return;
    }

    this.isLoadingFactura = true;
    console.log('Generar factura para ticket:', this.ventaTapete.ticket);
    
    setTimeout(() => {
      this.isLoadingFactura = false;
      Swal.fire({
        icon: 'success',
        title: 'Factura generada',
        text: 'La factura se ha generado exitosamente.'
      });
    }, 3000);
  }
}
