import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { ErrorFacturacion, EstadisticasErrores, FiltrosErrores, TipoErrorFacturacion, EstadoError } from '../models/errorFacturacion';
import { Global } from './Global';

/**
 * Servicio para gestión y tracking de errores de facturación
 * 
 * NOTA PARA EL DESARROLLADOR BACKEND:
 * Este servicio simula las respuestas que deben venir de AWS Lambda + MongoDB.
 * Los datos simulados muestran la estructura esperada de los endpoints.
 * 
 * ENDPOINTS REQUERIDOS:
 * 
 * 1. POST /errores-facturacion
 *    Body: ErrorFacturacion (sin _id)
 *    Response: { _id: string, mensaje: string }
 * 
 * 2. GET /errores-facturacion?fechaDesde=&fechaHasta=&tipoError=&estado=&rfc=&sucursal=
 *    Response: ErrorFacturacion[]
 * 
 * 3. GET /errores-facturacion/:id
 *    Response: ErrorFacturacion
 * 
 * 4. PUT /errores-facturacion/:id
 *    Body: Partial<ErrorFacturacion>
 *    Response: ErrorFacturacion
 * 
 * 5. GET /errores-facturacion/estadisticas
 *    Query: fechaDesde, fechaHasta
 *    Response: EstadisticasErrores
 * 
 * 6. DELETE /errores-facturacion/:id
 *    Response: { mensaje: string }
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {

  // URLs que el backend debe implementar
  private readonly baseUrl = Global.urlBackEnd + 'errores-facturacion';

  constructor(private http: HttpClient) { }

  /**
   * Guarda un nuevo error de facturación en la base de datos
   * 
   * BACKEND: Lambda debe insertar en MongoDB collection "errores_facturacion"
   * Debe incrementar el contador de "intentos" si ya existe un error con el mismo ticketNumber
   */
  guardarError(error: Omit<ErrorFacturacion, '_id'>): Observable<HttpResponse<any>> {
    // TODO: Descomentar cuando el backend esté listo
    // return this.http.post(this.baseUrl, error, { observe: 'response' });

    // SIMULACIÓN - Eliminar cuando el backend esté listo
    console.log('🔴 SIMULACIÓN: Guardando error en MongoDB via Lambda');
    console.log('📤 POST ' + this.baseUrl);
    console.log('📦 Body:', error);
    
    const response = {
      _id: this.generarIdSimulado(),
      mensaje: 'Error registrado exitosamente'
    };
    
    console.log('📥 Response simulada:', response);
    return of({
      body: response,
      status: 201,
      statusText: 'Created'
    } as HttpResponse<any>).pipe(delay(500));
  }

  /**
   * Obtiene la lista de errores con filtros opcionales
   * 
   * BACKEND: Lambda debe consultar MongoDB con los filtros aplicados
   * Ordenar por fecha descendente (más recientes primero)
   */
  obtenerErrores(filtros?: FiltrosErrores): Observable<HttpResponse<ErrorFacturacion[]>> {
    // TODO: Descomentar cuando el backend esté listo
    // const params = this.construirParams(filtros);
    // return this.http.get<ErrorFacturacion[]>(this.baseUrl, { params, observe: 'response' });

    // SIMULACIÓN - Eliminar cuando el backend esté listo
    console.log('🔴 SIMULACIÓN: Consultando errores de MongoDB via Lambda');
    console.log('📤 GET ' + this.baseUrl);
    console.log('🔍 Filtros:', filtros);
    
    const erroresSimulados = this.generarErroresSimulados();
    const erroresFiltrados = this.aplicarFiltrosSimulados(erroresSimulados, filtros);
    
    console.log(`📥 Response simulada: ${erroresFiltrados.length} errores`);
    return of({
      body: erroresFiltrados,
      status: 200,
      statusText: 'OK'
    } as HttpResponse<ErrorFacturacion[]>).pipe(delay(800));
  }

  /**
   * Obtiene un error específico por su ID
   * 
   * BACKEND: Lambda debe consultar MongoDB por _id
   */
  obtenerErrorPorId(id: string): Observable<HttpResponse<ErrorFacturacion>> {
    // TODO: Descomentar cuando el backend esté listo
    // return this.http.get<ErrorFacturacion>(`${this.baseUrl}/${id}`, { observe: 'response' });

    // SIMULACIÓN - Eliminar cuando el backend esté listo
    console.log('🔴 SIMULACIÓN: Consultando error específico de MongoDB via Lambda');
    console.log(`📤 GET ${this.baseUrl}/${id}`);
    
    const error = this.generarErroresSimulados().find(e => e._id === id) || this.generarErroresSimulados()[0];
    
    console.log('📥 Response simulada:', error);
    return of({
      body: error,
      status: 200,
      statusText: 'OK'
    } as HttpResponse<ErrorFacturacion>).pipe(delay(500));
  }

  /**
   * Actualiza un error existente
   * 
   * BACKEND: Lambda debe actualizar el documento en MongoDB
   * Típicamente usado para cambiar estado, agregar notas del admin, o marcar como resuelto
   */
  actualizarError(id: string, actualizacion: Partial<ErrorFacturacion>): Observable<HttpResponse<ErrorFacturacion>> {
    // TODO: Descomentar cuando el backend esté listo
    // return this.http.put<ErrorFacturacion>(`${this.baseUrl}/${id}`, actualizacion, { observe: 'response' });

    // SIMULACIÓN - Eliminar cuando el backend esté listo
    console.log('🔴 SIMULACIÓN: Actualizando error en MongoDB via Lambda');
    console.log(`📤 PUT ${this.baseUrl}/${id}`);
    console.log('📦 Body:', actualizacion);
    
    const errorActualizado = { ...this.generarErroresSimulados()[0], ...actualizacion, _id: id };
    
    console.log('📥 Response simulada:', errorActualizado);
    return of({
      body: errorActualizado,
      status: 200,
      statusText: 'OK'
    } as HttpResponse<ErrorFacturacion>).pipe(delay(600));
  }

  /**
   * Obtiene estadísticas agregadas de errores
   * 
   * BACKEND: Lambda debe usar MongoDB aggregation pipeline para calcular:
   * - Total de errores por estado
   * - Errores por tipo
   * - Errores por día (últimos 30 días)
   * - Top 10 clientes con más errores
   */
  obtenerEstadisticas(fechaDesde?: Date, fechaHasta?: Date): Observable<HttpResponse<EstadisticasErrores>> {
    // TODO: Descomentar cuando el backend esté listo
    // const params: any = {};
    // if (fechaDesde) params.fechaDesde = fechaDesde.toISOString();
    // if (fechaHasta) params.fechaHasta = fechaHasta.toISOString();
    // return this.http.get<EstadisticasErrores>(`${this.baseUrl}/estadisticas`, { params, observe: 'response' });

    // SIMULACIÓN - Eliminar cuando el backend esté listo
    console.log('🔴 SIMULACIÓN: Consultando estadísticas de MongoDB via Lambda');
    console.log(`📤 GET ${this.baseUrl}/estadisticas`);
    console.log('📅 Rango:', { fechaDesde, fechaHasta });
    
    const estadisticas = this.generarEstadisticasSimuladas();
    
    console.log('📥 Response simulada:', estadisticas);
    return of({
      body: estadisticas,
      status: 200,
      statusText: 'OK'
    } as HttpResponse<EstadisticasErrores>).pipe(delay(700));
  }

  /**
   * Elimina un error de la base de datos
   * 
   * BACKEND: Lambda debe eliminar el documento de MongoDB
   * NOTA: Considerar si es mejor un soft delete (marcar como eliminado) en lugar de eliminación física
   */
  eliminarError(id: string): Observable<HttpResponse<any>> {
    // TODO: Descomentar cuando el backend esté listo
    // return this.http.delete(`${this.baseUrl}/${id}`, { observe: 'response' });

    // SIMULACIÓN - Eliminar cuando el backend esté listo
    console.log('🔴 SIMULACIÓN: Eliminando error de MongoDB via Lambda');
    console.log(`📤 DELETE ${this.baseUrl}/${id}`);
    
    const response = { mensaje: 'Error eliminado exitosamente' };
    
    console.log('📥 Response simulada:', response);
    return of({
      body: response,
      status: 200,
      statusText: 'OK'
    } as HttpResponse<any>).pipe(delay(500));
  }

  // ========================================================================
  // MÉTODOS PRIVADOS PARA SIMULACIÓN - ELIMINAR CUANDO EL BACKEND ESTÉ LISTO
  // ========================================================================

  private generarIdSimulado(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generarErroresSimulados(): ErrorFacturacion[] {
    const ahora = new Date();
    const errores: ErrorFacturacion[] = [];

    // Error 1: Código postal inválido (común)
    errores.push(new ErrorFacturacion(
      'err_' + this.generarIdSimulado(),
      new Date(ahora.getTime() - 2 * 60 * 60 * 1000), // Hace 2 horas
      'MKTLV4243-1382723',
      'XAXX010101000',
      'PUBLICO EN GENERAL',
      'cliente1@example.com',
      'CFDI40147',
      'CFDI40147',
      'El código postal 00000 no es válido para el RFC del receptor',
      {
        status: 400,
        error: {
          code: 'CFDI40147',
          message: 'El código postal 00000 no es válido para el RFC del receptor',
          details: 'Validación SAT: El domicilio fiscal no corresponde con el RFC'
        }
      },
      'MKTLV4243',
      3, // 3 intentos
      'pendiente',
      undefined,
      undefined,
      undefined,
      'us-east-1_abc123def'
    ));

    // Error 2: RFC inválido
    errores.push(new ErrorFacturacion(
      'err_' + this.generarIdSimulado(),
      new Date(ahora.getTime() - 5 * 60 * 60 * 1000), // Hace 5 horas
      'MKTLV4243-1382724',
      'INVALIDO123',
      'EMPRESA TEST SA DE CV',
      'cliente2@example.com',
      'CFDI40116',
      'CFDI40116',
      'El RFC proporcionado no es válido',
      {
        status: 400,
        error: {
          code: 'CFDI40116',
          message: 'El RFC proporcionado no es válido',
          details: 'El RFC no cumple con el formato establecido por el SAT'
        }
      },
      'MKTLV4243',
      1,
      'pendiente',
      undefined,
      undefined,
      undefined,
      'us-east-1_abc123def'
    ));

    // Error 3: Certificado vencido
    errores.push(new ErrorFacturacion(
      'err_' + this.generarIdSimulado(),
      new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
      'MKTLV4243-1382725',
      'VABO780711D41',
      'OMAR VALDEZ BECERRIL',
      'ovaldez@example.com',
      'CERTIFICADO_VENCIDO',
      'CERT_EXPIRED',
      'El certificado CSD ha expirado',
      {
        status: 401,
        error: {
          code: 'CERT_EXPIRED',
          message: 'El certificado CSD ha expirado',
          details: 'Fecha de vencimiento: 2025-11-01. Por favor renueva tu certificado en el SAT'
        }
      },
      'MKTLV4243',
      5, // 5 intentos
      'en_revision',
      'Contactar al cliente para renovar certificado',
      undefined,
      undefined,
      'us-east-1_abc123def'
    ));

    // Error 4: Sin timbres
    errores.push(new ErrorFacturacion(
      'err_' + this.generarIdSimulado(),
      new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
      'MKTLV4243-1382726',
      'GOME900101ABC',
      'MARIA GOMEZ HERNANDEZ',
      'mgomez@example.com',
      'SIN_TIMBRES',
      'NO_STAMPS',
      'No hay timbres disponibles para esta sucursal',
      {
        status: 402,
        error: {
          code: 'NO_STAMPS',
          message: 'No hay timbres disponibles para esta sucursal',
          details: 'Timbres restantes: 0. Por favor compra más timbres'
        }
      },
      'MKTLV4243',
      2,
      'contactado',
      'Cliente notificado por email. Pendiente de compra de timbres',
      undefined,
      undefined,
      'us-east-1_abc123def'
    ));

    // Error 5: Timeout SAT
    errores.push(new ErrorFacturacion(
      'err_' + this.generarIdSimulado(),
      new Date(ahora.getTime() - 12 * 60 * 60 * 1000), // Hace 12 horas
      'MKTLV4243-1382727',
      'PECJ850101XYZ',
      'JUAN PEREZ CASTRO',
      'jperez@example.com',
      'TIMEOUT',
      'GATEWAY_TIMEOUT',
      'Timeout al conectar con el servidor del SAT',
      {
        status: 504,
        error: {
          code: 'GATEWAY_TIMEOUT',
          message: 'Timeout al conectar con el servidor del SAT',
          details: 'No se pudo establecer conexión con el PAC después de 30 segundos'
        }
      },
      'MKTLV4243',
      1,
      'pendiente',
      undefined,
      undefined,
      undefined,
      'us-east-1_abc123def'
    ));

    // Error 6: Uso CFDI inválido para régimen
    errores.push(new ErrorFacturacion(
      'err_' + this.generarIdSimulado(),
      new Date(ahora.getTime() - 6 * 60 * 60 * 1000), // Hace 6 horas
      'MKTLV4243-1382728',
      'SABC900101DEF',
      'SERVICIOS ABC SA DE CV',
      'contacto@abc.com',
      'CFDI40124',
      'CFDI40124',
      'El uso de CFDI seleccionado no es válido para el régimen fiscal del receptor',
      {
        status: 400,
        error: {
          code: 'CFDI40124',
          message: 'El uso de CFDI seleccionado no es válido para el régimen fiscal del receptor',
          details: 'Régimen: 601, Uso CFDI: P01 no compatible'
        }
      },
      'MKTLV4243',
      2,
      'pendiente',
      undefined,
      undefined,
      undefined,
      'us-east-1_abc123def'
    ));

    // Error 7: Resuelto (ejemplo)
    errores.push(new ErrorFacturacion(
      'err_' + this.generarIdSimulado(),
      new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
      'MKTLV4243-1382729',
      'ROPS850505GHI',
      'PEDRO RODRIGUEZ SANCHEZ',
      'prodriguez@example.com',
      'ERROR_VALIDACION',
      'VALIDATION_ERROR',
      'Error de validación en datos del receptor',
      {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Error de validación en datos del receptor',
          details: 'El correo electrónico no tiene formato válido'
        }
      },
      'MKTLV4243',
      1,
      'resuelto',
      'Error resuelto. Cliente corrigió su email y la factura se generó correctamente',
      new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000),
      'admin@tufan.com',
      'us-east-1_abc123def'
    ));

    return errores;
  }

  private aplicarFiltrosSimulados(errores: ErrorFacturacion[], filtros?: FiltrosErrores): ErrorFacturacion[] {
    if (!filtros) return errores;

    return errores.filter(error => {
      if (filtros.fechaDesde && new Date(error.fecha) < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && new Date(error.fecha) > filtros.fechaHasta) return false;
      if (filtros.tipoError && error.tipoError !== filtros.tipoError) return false;
      if (filtros.estado && error.estado !== filtros.estado) return false;
      if (filtros.rfc && !error.rfcReceptor.includes(filtros.rfc)) return false;
      if (filtros.sucursal && error.sucursal !== filtros.sucursal) return false;
      if (filtros.ticketNumber && !error.ticketNumber.includes(filtros.ticketNumber)) return false;
      return true;
    });
  }

  private generarEstadisticasSimuladas(): EstadisticasErrores {
    const errores = this.generarErroresSimulados();
    
    return {
      totalErrores: errores.length,
      erroresPendientes: errores.filter(e => e.estado === 'pendiente').length,
      erroresEnRevision: errores.filter(e => e.estado === 'en_revision').length,
      erroresResueltos: errores.filter(e => e.estado === 'resuelto').length,
      erroresPorTipo: [
        { tipo: 'CFDI40147', cantidad: 1 },
        { tipo: 'CFDI40116', cantidad: 1 },
        { tipo: 'CERTIFICADO_VENCIDO', cantidad: 1 },
        { tipo: 'SIN_TIMBRES', cantidad: 1 },
        { tipo: 'TIMEOUT', cantidad: 1 },
        { tipo: 'CFDI40124', cantidad: 1 },
        { tipo: 'ERROR_VALIDACION', cantidad: 1 }
      ],
      erroresPorDia: [
        { fecha: '2025-11-08', cantidad: 3 },
        { fecha: '2025-11-07', cantidad: 2 },
        { fecha: '2025-11-06', cantidad: 1 },
        { fecha: '2025-11-05', cantidad: 1 }
      ],
      clientesMasAfectados: [
        { rfc: 'VABO780711D41', nombre: 'OMAR VALDEZ BECERRIL', cantidad: 5 },
        { rfc: 'XAXX010101000', nombre: 'PUBLICO EN GENERAL', cantidad: 3 },
        { rfc: 'GOME900101ABC', nombre: 'MARIA GOMEZ HERNANDEZ', cantidad: 2 }
      ]
    };
  }
}
