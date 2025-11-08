/**
 * Modelo para tracking de errores de facturación
 * 
 * Este modelo representa los errores que ocurren durante el proceso de facturación
 * y deben ser almacenados en MongoDB para análisis y seguimiento por el administrador.
 */
export class ErrorFacturacion {
  constructor(
    public _id: string,
    public fecha: Date,
    public ticketNumber: string,
    public rfcReceptor: string,
    public nombreReceptor: string,
    public emailReceptor: string,
    public tipoError: TipoErrorFacturacion,
    public codigoError: string,
    public mensajeError: string,
    public detalleError: any, // JSON completo con toda la respuesta del error
    public sucursal: string,
    public intentos: number, // Contador de intentos del mismo ticket/RFC
    public estado: EstadoError,
    public notasAdmin?: string,
    public resueltoEn?: Date,
    public resueltoBy?: string,
    public idUsuarioCognito?: string
  ) { }
}

/**
 * Tipos de errores de facturación
 */
export type TipoErrorFacturacion = 
  | 'CFDI40147' // Código postal inválido
  | 'CFDI40116' // RFC inválido
  | 'CFDI40124' // Uso CFDI no válido para régimen fiscal
  | 'TIMEOUT' // Timeout al conectar con SAT
  | 'CERTIFICADO_VENCIDO' // Certificado CSD vencido
  | 'CERTIFICADO_INVALIDO' // Certificado CSD inválido
  | 'SIN_TIMBRES' // Sin timbres disponibles
  | 'ERROR_RED' // Error de conexión de red
  | 'ERROR_VALIDACION' // Error de validación de datos
  | 'ERROR_SAT' // Error general del SAT
  | 'ERROR_SERVIDOR' // Error interno del servidor
  | 'OTRO'; // Otros errores no clasificados

/**
 * Estados del seguimiento de errores
 */
export type EstadoError = 
  | 'pendiente' // Error registrado, sin revisar
  | 'en_revision' // Admin está revisando el error
  | 'contactado' // Cliente ya fue contactado
  | 'resuelto'; // Error resuelto exitosamente

/**
 * Estadísticas de errores para el dashboard
 */
export interface EstadisticasErrores {
  totalErrores: number;
  erroresPendientes: number;
  erroresEnRevision: number;
  erroresResueltos: number;
  erroresPorTipo: { tipo: TipoErrorFacturacion; cantidad: number; }[];
  erroresPorDia: { fecha: string; cantidad: number; }[];
  clientesMasAfectados: { rfc: string; nombre: string; cantidad: number; }[];
}

/**
 * Filtros para la búsqueda de errores
 */
export interface FiltrosErrores {
  fechaDesde?: Date;
  fechaHasta?: Date;
  tipoError?: TipoErrorFacturacion;
  estado?: EstadoError;
  rfc?: string;
  sucursal?: string;
  ticketNumber?: string;
}
