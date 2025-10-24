import { Injectable } from '@angular/core';
import { Timbrado } from '../models/timbrado';
import { Emisor } from '../models/emisor';
import { Receptor } from '../models/receptor';
import { Concepto } from '../models/conceptos';
import { Impuestos } from '../models/impuestos';
import { ImpuestosConcepto } from '../models/ImpuestosConcepto';
import { Traslados } from '../models/traslados';
import { VentaTapete } from '../models/ventaTapete';
import { Certificado } from '../models/certificado';
import { Sucursal } from '../models/sucursal';
import { Global } from './Global';

/**
 * Servicio para cálculos y construcción de facturas.
 * Extrae la lógica de negocio del componente.
 */
@Injectable({
  providedIn: 'root'
})
export class FacturaCalculatorService {

  constructor() { }

  /**
   * Construye el objeto Timbrado completo para facturación
   */
  buildTimbrado(
    ventaTapete: VentaTapete,
    receptor: Receptor,
    certificado: Certificado,
    sucursal: Sucursal
  ): Timbrado {
    const conceptos = this.buildConceptos(ventaTapete);
    const impuestos = this.buildImpuestosFromConceptos(conceptos);
    const totales = this.calculateTotales(ventaTapete);

    const timbrado = new Timbrado(
      Global.Factura.Version,
      sucursal.serie,
      '', // Folio se genera en backend
      this.getFechaFactura(),
      ventaTapete.pago.formapago,
      Global.Factura.CondicionesPago,
      totales.subtotal,
      0.00, // Descuento
      Global.Factura.Moneda,
      Global.Factura.TipoCambio,
      totales.total,
      Global.Factura.TipoComprobante,
      Global.Factura.Exportacion,
      Global.Factura.MetodoPago,
      sucursal.codigo_postal,
      new Emisor(certificado.rfc, certificado.nombre, sucursal.regimen_fiscal),
      new Receptor(
        receptor.Rfc,
        receptor.Nombre,
        receptor.DomicilioFiscalReceptor,
        receptor.RegimenFiscalReceptor,
        receptor.UsoCFDI
      ),
      conceptos,
      impuestos
    );

    return timbrado;
  }

  /**
   * Construye la lista de conceptos con sus impuestos
   */
  private buildConceptos(ventaTapete: VentaTapete): Concepto[] {
    return ventaTapete.detalle.map(producto => {
      const valorUnitarioSinIva = this.roundDecimal(producto.precio / Global.Factura.FACTOR_DIV);
      const base = this.roundDecimal(valorUnitarioSinIva * producto.cantidad);
      const importeImpuestoTraslado = this.roundDecimal(
        valorUnitarioSinIva * Global.Factura.IVA * producto.cantidad
      );

      // Impuestos del concepto
      const impuestosConcepto: ImpuestosConcepto = {
        Traslados: [
          new Traslados(
            base,
            Global.Factura.ImpuestoIVA,
            Global.Factura.Tasa,
            Global.Factura.TasaOCuotaIVA,
            importeImpuestoTraslado
          )
        ]
      };

      return new Concepto(
        impuestosConcepto,
        producto.claveproducto,
        this.roundDecimal(producto.cantidad, 1),
        producto.claveunidad,
        producto.unidad,
        producto.descripcio,
        valorUnitarioSinIva,
        base,
        0.00, // Descuento
        Global.Factura.ObjectoImpuesto
      );
    });
  }

  /**
   * Construye el objeto de impuestos totales desde los conceptos
   * IMPORTANTE: Suma los importes YA redondeados de cada concepto (CFDI40221)
   * El SAT requiere que el total sea el redondeo de la suma de los traslados de conceptos
   */
  private buildImpuestosFromConceptos(conceptos: Concepto[]): Impuestos {
    let impuestoTrasladoBase = 0;
    let impuestoTrasladoImporte = 0;

    // Sumar los valores YA redondeados de cada concepto
    conceptos.forEach(concepto => {
      // Sumar la base (ya redondeada en el concepto)
      impuestoTrasladoBase += concepto.Importe;
      
      // Sumar los traslados (ya redondeados en el concepto)
      concepto.Impuestos.Traslados.forEach(traslado => {
        impuestoTrasladoImporte += traslado.Importe;
      });
    });

    // Redondear UNA SOLA VEZ la suma de todos los conceptos (validación SAT CFDI40221)
    const trasladoImpuesto = new Traslados(
      this.roundDecimal(impuestoTrasladoBase),
      Global.Factura.ImpuestoIVA,
      Global.Factura.Tasa,
      Global.Factura.TasaOCuotaIVA,
      this.roundDecimal(impuestoTrasladoImporte)
    );

    return new Impuestos(
      [trasladoImpuesto],
      this.roundDecimal(impuestoTrasladoImporte)
    );
  }

  /**
   * Construye el objeto de impuestos totales
   * IMPORTANTE: NO redondear hasta el final para cumplir con CFDI40221
   */
  private buildImpuestos(ventaTapete: VentaTapete): Impuestos {
    let impuestoTrasladoBase = 0;
    let impuestoTrasladoImporte = 0;

    // Sumar SIN redondear para evitar acumulación de errores
    ventaTapete.detalle.forEach(producto => {
      const subtotalProducto = producto.precio / Global.Factura.FACTOR_DIV;
      const base = subtotalProducto * producto.cantidad;
      const importeImpuesto = subtotalProducto * Global.Factura.IVA * producto.cantidad;

      impuestoTrasladoBase += base;
      impuestoTrasladoImporte += importeImpuesto;
    });

    // Redondear UNA SOLA VEZ al final (validación SAT CFDI40221)
    const trasladoImpuesto = new Traslados(
      this.roundDecimal(impuestoTrasladoBase),
      Global.Factura.ImpuestoIVA,
      Global.Factura.Tasa,
      Global.Factura.TasaOCuotaIVA,
      this.roundDecimal(impuestoTrasladoImporte)
    );

    return new Impuestos(
      [trasladoImpuesto],
      this.roundDecimal(impuestoTrasladoImporte)
    );
  }

  /**
   * Calcula los totales de la factura
   * IMPORTANTE: NO redondear hasta el final para cumplir con CFDI40221
   */
  calculateTotales(ventaTapete: VentaTapete): { subtotal: number; total: number; impuestos: number } {
    let subtotal = 0;
    let impuestos = 0;

    // Sumar SIN redondear para evitar acumulación de errores
    ventaTapete.detalle.forEach(producto => {
      const subtotalProducto = producto.precio / Global.Factura.FACTOR_DIV;
      subtotal += subtotalProducto * producto.cantidad;
      impuestos += subtotalProducto * Global.Factura.IVA * producto.cantidad;
    });

    // Redondear UNA SOLA VEZ al final (validación SAT CFDI40221)
    return {
      subtotal: this.roundDecimal(subtotal),
      total: this.roundDecimal(subtotal + impuestos),
      impuestos: this.roundDecimal(impuestos)
    };
  }

  /**
   * Genera la fecha en formato ISO para la factura
   */
  getFechaFactura(): string {
    const hoy = new Date();
    const dia = this.padZero(hoy.getDate());
    const mes = this.padZero(hoy.getMonth() + 1);
    const year = hoy.getFullYear();
    const hora = this.padZero(hoy.getHours());
    const minuto = this.padZero(hoy.getMinutes());
    const segundos = this.padZero(hoy.getSeconds());
    
    return `${year}-${mes}-${dia}T${hora}:${minuto}:${segundos}`;
  }

  /**
   * Valida el formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Determina si un RFC es de persona física
   */
  esPersonaFisica(rfc: string): boolean {
    const rfcFisicoRegex = /^([A-ZÑ&]{4})(\d{6})([A-Z0-9]{3})$/;
    return rfcFisicoRegex.test(rfc);
  }

  /**
   * Redondea un número a decimales específicos
   */
  private roundDecimal(value: number, decimals: number = Global.DECIMAL_FIXED): number {
    return Number(value.toFixed(decimals));
  }

  /**
   * Agrega ceros a la izquierda para fechas
   */
  private padZero(value: number): string | number {
    return value < 10 ? `0${value}` : value;
  }

  /**
   * Valida que todos los campos obligatorios del receptor estén completos
   */
  isReceptorValid(receptor: Receptor): boolean {
    return !!(
      receptor.Rfc &&
      receptor.DomicilioFiscalReceptor &&
      receptor.Nombre &&
      receptor.email &&
      this.isValidEmail(receptor.email) &&
      receptor.RegimenFiscalReceptor &&
      receptor.UsoCFDI
    );
  }
}
