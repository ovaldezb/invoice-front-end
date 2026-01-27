import { Injectable } from '@angular/core';
import { Timbrado } from '../models/timbrado';
import { Emisor } from '../models/emisor';
import { Receptor } from '../models/receptor';
import { Concepto } from '../models/conceptos';
import { Impuestos } from '../models/impuestos';
import { ImpuestosConcepto } from '../models/impuestosConcepto';
import { Traslados } from '../models/traslados';
import { PaymentConfig } from '../models/payment-config';
import { Global } from './Global';

@Injectable({
    providedIn: 'root'
})
export class FacturaServicioCalculatorService {

    constructor() { }

    /**
     * Construye el objeto Timbrado para servicios configurados
     */
    buildTimbrado(
        configs: PaymentConfig[],
        receptor: Receptor,
        emisor: Emisor,
        serie: string,
        invoiceCount: number
    ): Timbrado {
        const conceptos = this.buildConceptos(configs, invoiceCount);
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
        // Convertir a hora de CDMX (UTC-6) para evitar error de rango de fecha del SAT
        // Usamos el metodo getFechaFactura para obtener fecha con offset, pero para el folio solo necesitamos fecha local o server
        // Para consistencia usamos la fecha ya ajustada
        const fechaFactura = this.getFechaFactura();
        // Extraer año, mes, dia del string ISO generado
        const folioYear = fechaFactura.substring(2, 4);
        const folioMonth = fechaFactura.substring(5, 7);
        const folioDay = fechaFactura.substring(8, 10);
        const folio = `${folioYear}${folioMonth}${folioDay}`;

        const timbrado = new Timbrado(
            Global.Factura.Version,
            serie,
            folio,
            fechaFactura,
            '03', // Transferencia electrónica de fondos 
            Global.Factura.CondicionesPago,
            subtotalRedondeado,
            0.00,
            Global.Factura.Moneda,
            Global.Factura.TipoCambio,
            totalFactura,
            'I', // Ingreso
            Global.Factura.Exportacion,
            'PUE', // Pago en una sola exhibición
            '23000', // LugarExpedicion (CP) - Fixed from Emisor.Rfc
            new Emisor(emisor.Rfc, emisor.Nombre, emisor.RegimenFiscal),
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

    private buildConceptos(configs: PaymentConfig[], invoiceCount: number): Concepto[] {
        return configs.map(config => {
            let cantidad = 1;
            let unidad = config.unidad;
            let claveUnidad = config.clave_unidad;

            // Ajuste para "Timbrado de Facturas"
            if (config.nombre_pago.toLowerCase().includes('timbrado de facturas')) {
                cantidad = invoiceCount;
            }

            // El precio en config es BRUTO (Total), necesitamos desglozarlo a UNITARIO SIN IVA
            // PrecioTotal = (ValorUnitario * Cantidad * 1.16)
            // ValorUnitario = (PrecioTotal / Cantidad) / 1.16
            const precioTotal = Number(config.costo) || 0;

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

    private buildImpuestosFromConceptos(conceptos: Concepto[]): Impuestos {
        let impuestoTrasladoBase = 0;
        let impuestoTrasladoImporte = 0;

        conceptos.forEach(concepto => {
            impuestoTrasladoBase += concepto.Importe;
            concepto.Impuestos.Traslados.forEach((traslado: Traslados) => {
                impuestoTrasladoImporte += traslado.Importe;
            });
        });

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
     * Genera la fecha en formato ISO para la factura (America/Mexico_City)
     */
    getFechaFactura(): string {
        const hoy = new Date();
        // Restar 1 hora para evitar error de "fecha futura" por discrepancia con el servidor del SAT
        hoy.setHours(hoy.getHours() - 1);

        // Obtener la fecha en formato CDMX (UTC-6)
        // El formato 'sv-SE' devuelve YYYY-MM-DD HH:mm:ss
        const cdmxString = hoy.toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' });
        return cdmxString.replace(' ', 'T');
    }

    private roundDecimal(value: number, decimals: number = Global.DECIMAL_FIXED): number {
        return Number(value.toFixed(decimals));
    }

    private padZero(value: number): string | number {
        return value < 10 ? `0${value}` : value;
    }
}
