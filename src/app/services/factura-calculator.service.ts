import { Injectable } from '@angular/core';
import { Timbrado } from '../models/timbrado';
import { Emisor } from '../models/emisor';
import { Receptor } from '../models/receptor';
import { Concepto } from '../models/conceptos';
import { Impuestos } from '../models/impuestos';
import { ImpuestosConcepto } from '../models/impuestosConcepto';
import { Traslados } from '../models/traslados';
import { VentaTapete } from '../models/ventaTapete';
import { Certificado } from '../models/certificado';
import { Sucursal } from '../models/sucursal';
import { PaymentConfig } from '../models/payment-config';
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
   * Construye el objeto Timbrado para servicios configurados
   */
  buildTimbradoServices(
    configs: PaymentConfig[],
    receptor: Receptor,
    emisor: Emisor,
    serie: string,
    invoiceCount: number
  ): Timbrado {
    const conceptos = this.buildConceptosServices(configs, invoiceCount);
    const impuestos = this.buildImpuestosFromConceptos(conceptos);

    // Calcular subtotal
    let subtotal = 0;
    conceptos.forEach(concepto => {
      subtotal += concepto.Importe;
    });
    const subtotalRedondeado = this.roundDecimal(subtotal);

    // Total = Subtotal + Impuestos Trasladados
    const totalFactura = this.roundDecimal(
      subtotalRedondeado + impuestos.TotalImpuestosTrasladados
    );

    // Generar Folio YYMMDD
    const hoy = new Date();
    const folio = `${hoy.getFullYear().toString().slice(-2)}${this.padZero(hoy.getMonth() + 1)}${this.padZero(hoy.getDate())}`;

    const timbrado = new Timbrado(
      Global.Factura.Version,
      serie,
      folio,
      this.getFechaFactura(),
      '03', // Transferencia electrónica de fondos (formapago default para servicios?) - Ajustar si es necesario, user didn't specify
      Global.Factura.CondicionesPago,
      subtotalRedondeado,
      0.00,
      Global.Factura.Moneda,
      Global.Factura.TipoCambio,
      totalFactura,
      'I', // Ingreso
      Global.Factura.Exportacion,
      'PUE', // Pago en una sola exhibición
      emisor.Rfc,
      new Emisor(emisor.Rfc, emisor.Nombre, emisor.RegimenFiscal), // Fallback regimen
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

  private buildConceptosServices(configs: PaymentConfig[], invoiceCount: number): Concepto[] {
    return configs.map(config => {
      let cantidad = 1;
      let unidad = 'Servicio';
      let claveUnidad = 'E48'; // Unidad de servicio

      // Ajuste para "Timbrado de Facturas"
      if (config.nombre_pago.toLowerCase().includes('timbrado de facturas')) {
        cantidad = invoiceCount;
        unidad = 'Actividad';
        claveUnidad = 'ACT';
      }

      // El precio en config es BRUTO (Total), necesitamos desglozarlo a UNITARIO SIN IVA
      // PrecioTotal = (ValorUnitario * Cantidad * 1.16)
      // ValorUnitario = (PrecioTotal / Cantidad) / 1.16
      const precioTotal = config.cantidad; // Este es el importe total con iva de la BD

      // NOTA: Si es Timbrado de facturas, el precio total en BD es por el TOTAL del consumo
      // Si la cantidad es > 1, necesitamos el precio unitario real.
      // Si el precio en BD ya es el total a pagar, entonces para el unitario dividimos entre cantidad

      const valorUnitarioConIva = precioTotal / cantidad;
      const valorUnitarioSinIva = this.roundDecimal(valorUnitarioConIva / Global.Factura.FACTOR_DIV);

      const base = this.roundDecimal(valorUnitarioSinIva * cantidad);
      const importeImpuestoTraslado = this.roundDecimal(
        valorUnitarioSinIva * Global.Factura.IVA * cantidad
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
        config.codigo_sat,
        this.roundDecimal(cantidad, 2),
        claveUnidad,
        unidad,
        config.descripcion_sat || config.nombre_pago,
        valorUnitarioSinIva,
        base,
        0.00,
        Global.Factura.ObjectoImpuesto
      );
    });
  }

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

    // Calcular subtotal desde los conceptos
    let subtotal = 0;
    conceptos.forEach(concepto => {
      subtotal += concepto.Importe;
    });
    const subtotalRedondeado = this.roundDecimal(subtotal);

    // Total = Subtotal + Impuestos Trasladados (validación CFDI40119)
    const totalFactura = this.roundDecimal(
      subtotalRedondeado + impuestos.TotalImpuestosTrasladados
    );

    const timbrado = new Timbrado(
      Global.Factura.Version,
      sucursal.serie,
      '', // Folio se genera en backend
      this.getFechaFactura(),
      ventaTapete.pago.formapago,
      Global.Factura.CondicionesPago,
      subtotalRedondeado,
      0.00, // Descuento
      Global.Factura.Moneda,
      Global.Factura.TipoCambio,
      totalFactura,
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
      concepto.Impuestos.Traslados.forEach((traslado: Traslados) => {
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
   * IMPORTANTE: El total debe ser la suma de valores YA redondeados (CFDI40119)
   * Total = Subtotal(redondeado) + Impuestos(redondeados) según el SAT
   */
  calculateTotales(ventaTapete: VentaTapete): { subtotal: number; total: number; impuestos: number } {
    let subtotal = 0;
    let impuestos = 0;

    // Sumar SIN redondear
    ventaTapete.detalle.forEach(producto => {
      const subtotalProducto = producto.precio / Global.Factura.FACTOR_DIV;
      subtotal += subtotalProducto * producto.cantidad;
      impuestos += subtotalProducto * Global.Factura.IVA * producto.cantidad;
    });

    // Redondear subtotal e impuestos primero
    const subtotalRedondeado = this.roundDecimal(subtotal);
    const impuestosRedondeados = this.roundDecimal(impuestos);

    // Total = suma de valores YA redondeados (validación SAT CFDI40119)
    return {
      subtotal: subtotalRedondeado,
      total: this.roundDecimal(subtotalRedondeado + impuestosRedondeados),
      impuestos: impuestosRedondeados
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
    const codigoPostalValido = !!receptor.DomicilioFiscalReceptor && /^\d{5}$/.test(receptor.DomicilioFiscalReceptor);
    return !!(
      receptor.Rfc &&
      codigoPostalValido &&
      receptor.Nombre &&
      receptor.email &&
      this.isValidEmail(receptor.email) &&
      receptor.RegimenFiscalReceptor &&
      receptor.UsoCFDI
    );
  }
}
