import { environment } from "../../environments/environment";

export const Global = {
  VERSION: '1.2.10',
  ENV_NAME: environment.envName,
  urlBackEnd: environment.urlBackEnd,
  urlDatosFactura: environment.urlDatosFactura,
  TIMER_OFF: 1500,
  OK: 200,
  AGREGAR_SUCURSAL: 'Agregar Sucursal',
  EDITAR_SUCURSAL: 'Editar Sucursal',
  Factura: {
    Moneda: 'MXN',
    Version: '4.0',
    TipoCambio: 1,
    TipoComprobante: 'I',
    Exportacion: '01',
    CondicionesPago: 'Un solo pago',
    MetodoPago: 'PUE',
    ImpuestoIVA: '002',
    ImpuestoISR: '001',
    Tasa: 'Tasa',
    Cuota: 'Cuota',
    TasaOCuotaIVA: '0.160000',
    TasaOCuotaISR: '0.000000',
    ObjectoImpuesto: '02',
    FP_EFECTIVO: '01',
    FP_TRANSFERENCIA: '03',
    FP_TARJETA: '04',
    IVA: 0.16,
    FACTOR_DIV: 1.16
  },
  DECIMAL_FIXED: 2,
  INACTIVITY_TIMEOUT_MINUTES: 15 * 60 * 1000, // 15 minutos
  CONFIGURACION: 'configuración',
  ACTUALIZACION: 'actualización',
  GUARDAR: 'Guardar',
  GUARDANDO: 'Guardando...',
  ACTUALIZAR: 'Actualizar',
  ACTUALIZANDO: 'Actualizando...'
};