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
import { Concepto } from '../../models/conceptos';
import { Emisor } from '../../models/emisor';
import { Receptor } from '../../models/receptor';
import { VentaTapete } from '../../models/ventaTapete';
import { Ticket } from '../../models/ticket';
import { Certificado } from '../../models/certificado';
import Swal from 'sweetalert2';
import { Folio } from '../../models/folio';
import { FolioService } from '../../services/folio.service';
import { Sucursal } from '../../models/sucursal';

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

  constructor(private facturacionService: FacturacionService, private folioService: FolioService) { }

  ngOnInit(): void {
    this.obtieneDatosParaFacturar();
  }

  generaFactura():void{
    const timbrado: Timbrado = this.llenaFactura();
    const factura = {
      timbrado: timbrado,
      sucursal: this.sucursal.codigo_sucursal,
      ticket: this.ventaTapete.ticket.noVenta,
      idCertificado: this.certificado._id
    }
    this.facturacionService.generaFactura(factura)
    .subscribe({
      next: (response) => {
        this.isLoadingFactura = false;
        this.isBusquedaTicket = true;

        this.timbrado = {} as Timbrado;
        this.incrementaFolio();
        if(this.receptor._id==undefined){
          this.guardaReceptor();
        }
        Swal.fire({
          icon: 'success',
          title: 'Factura generada',
          text: 'La factura se ha generado correctamente.',
          timer: Global.TIMER_OFF
        });
      },
      error: (error) => {
        this.isLoadingFactura = false;
        this.isBusquedaTicket = true;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error.message,
          timer: Global.TIMER_OFF
        });
      }
    });
  }

  obtieneReceptor(){
    if (!this.receptor.Rfc || this.receptor.Rfc.length < 12) {
      return;
    }
    
    this.isLoadingReceptor = true;
    this.facturacionService.obtieneDatosReceptorByRfc(this.receptor.Rfc)
    .subscribe({
      next: (response) => {
        this.receptor = response.body ? response.body as Receptor : new Receptor(this.receptor.Rfc, '', '', '', '');
        this.filtraUsoCfdi(this.receptor.RegimenFiscalReceptor);
        this.isLoadingReceptor = false;
      },
      error: (error) => {
        this.isLoadingReceptor = false;
        //console.error('Error al obtener receptor:', error);
      }
    });
  }

  guardaReceptor(){
    this.facturacionService.guardaReceptor(this.receptor)
    .subscribe({
      next: (response) => {
        console.log('Receptor guardado:', response.body);
      },
      error: (error) => {
        console.error('Error al guardar receptor:', error);
      }
    }); 
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
      },
      error: (error) => {
        console.error('Error al obtener folio:', error);
      }
    });
  }

  incrementaFolio():void{
    this.folioService.actualizaFolioBySucursal(this.sucursal.codigo_sucursal)
    .subscribe({
      next: (response) => {
      },
      error: (error) => {
        console.error('Error al incrementar folio:', error);
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
        this.sucursal = response.body.sucursal;
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
    this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter(
      (cfdi)=>cfdi.regfiscalreceptor.indexOf(this.listaRegimenFiscal[event.target["selectedIndex"]-1].regimenfiscal)>=0
    )
  }

  filtraUsoCfdi(regimenfiscal:string):void{
    this.listaUsoCfdiFiltrado = this.listaUsoCfdi.filter((cfdi)=>cfdi.regfiscalreceptor.indexOf(regimenfiscal)>=0)
  }

  llenaFactura():Timbrado{
    this.timbrado.Conceptos = [];
    let subTotal:number = 0;
    let total:number = 0;
    let totalImpuestos:number=0.0;
    let impuestoTrasladoBase:number=0.0;
    let impuestoTrasladoImporte:number=0.0;
    let impuestos:Impuestos= {} as Impuestos;
    impuestos.Traslados = [];
    this.ventaTapete.detalle.forEach(prod=>{
      let impuestosConcepto:ImpuestosConcepto = {} as ImpuestosConcepto;
      impuestosConcepto.Traslados = [];
      let subTotalProd:number = prod.precio/Global.Factura.FACTOR_DIV;
      totalImpuestos += Number((subTotalProd * Global.Factura.IVA * prod.cantidad).toFixed(Global.DECIMAL_FIXED));
      subTotal += Number((subTotalProd * prod.cantidad).toFixed(Global.DECIMAL_FIXED));
      total += prod.importe
      let ValorUnitario:number = subTotalProd;
      let base:number =  Number((subTotalProd*prod.cantidad).toFixed(Global.DECIMAL_FIXED));
      let importeConceptoImpuestoTraslado = Number((subTotalProd*Global.Factura.IVA*prod.cantidad).toFixed(2));
      let traslados = new Traslados(
        Number(base.toFixed(2)),
        Global.Factura.ImpuestoIVA,
        Global.Factura.Tasa,
        Global.Factura.TasaOCuotaIVA,
        Number(importeConceptoImpuestoTraslado.toFixed(Global.DECIMAL_FIXED))
      );
      impuestosConcepto.Traslados.push(traslados);
      
      let concepto = new Concepto(
        impuestosConcepto,
        prod.claveproducto,
        Number(prod.cantidad.toFixed(1)),
        prod.claveunidad,
        prod.unidad,
        prod.descripcio, 
        Number(ValorUnitario.toFixed(Global.DECIMAL_FIXED)),
        Number(base.toFixed(Global.DECIMAL_FIXED)),
        0.00,
        Global.Factura.ObjectoImpuesto
      );
      this.timbrado.Conceptos.push(concepto);
      impuestoTrasladoBase += base;
      impuestoTrasladoImporte += importeConceptoImpuestoTraslado;
    });
    
    let trasladoImpuesto = new Traslados(
      Number(impuestoTrasladoBase.toFixed(Global.DECIMAL_FIXED)),
      Global.Factura.ImpuestoIVA,
      Global.Factura.Tasa,
      Global.Factura.TasaOCuotaIVA,
      Number(impuestoTrasladoImporte.toFixed(Global.DECIMAL_FIXED)),
    )
    
    impuestos.TotalImpuestosTrasladados = Number(totalImpuestos.toFixed(2));
    impuestos.Traslados.push(trasladoImpuesto);
    this.timbrado.Version=Global.Factura.Version;
    this.timbrado.FormaPago=this.ventaTapete.pago.formapago;
    this.timbrado.Serie=this.sucursal.serie;
    this.timbrado.Folio=this.folio.noFolio.toString();
    this.timbrado.Fecha=this.getFechaFactura();
    this.timbrado.MetodoPago=Global.Factura.MetodoPago;
    this.timbrado.CondicionesDePago=Global.Factura.CondicionesPago;
    this.timbrado.SubTotal=Number(subTotal.toFixed(Global.DECIMAL_FIXED));
    this.timbrado.Descuento=0.00;
    this.timbrado.Moneda=Global.Factura.Moneda;
    this.timbrado.TipoCambio=Global.Factura.TipoCambio;
    this.timbrado.Total=Number(total.toFixed(Global.DECIMAL_FIXED));
    this.timbrado.TipoDeComprobante=Global.Factura.TipoComprobante;
    this.timbrado.Exportacion=Global.Factura.Exportacion;
    this.timbrado.LugarExpedicion=this.sucursal.codigo_postal;
    this.timbrado.Emisor = new Emisor(this.certificado.rfc,this.certificado.nombre,this.sucursal.regimen_fiscal);
    this.timbrado.Receptor = new Receptor(this.receptor.Rfc,this.receptor.Nombre,this.receptor.DomicilioFiscalReceptor,this.receptor.RegimenFiscalReceptor,this.receptor.UsoCFDI);
    this.timbrado.Impuestos = new Impuestos(impuestos.Traslados, impuestos.TotalImpuestosTrasladados);
    const timbradoEnviar = new Timbrado(
      this.timbrado.Version,
      this.timbrado.Serie,
      this.timbrado.Folio,
      this.timbrado.Fecha,
      this.timbrado.FormaPago,
      this.timbrado.CondicionesDePago,
      this.timbrado.SubTotal,
      this.timbrado.Descuento,
      this.timbrado.Moneda,
      this.timbrado.TipoCambio,
      this.timbrado.Total,
      this.timbrado.TipoDeComprobante,
      this.timbrado.Exportacion,
      this.timbrado.MetodoPago,
      this.timbrado.LugarExpedicion,
      this.timbrado.Emisor,
      this.timbrado.Receptor,
      this.timbrado.Conceptos,
      this.timbrado.Impuestos
    );
    return timbradoEnviar;
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
    this.ventaTapete = new VentaTapete('',new Ticket('','',0,0,0,0),[],{formapago:''});
    this.receptor = new Receptor('','','','','');
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
    this.generaFactura();
  }
}
