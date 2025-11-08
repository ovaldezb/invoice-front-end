import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErrorTrackingService } from '../../services/error-tracking.service';
import { ErrorFacturacion, EstadisticasErrores, FiltrosErrores, TipoErrorFacturacion, EstadoError } from '../../models/errorFacturacion';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-errores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-errores.component.html',
  styleUrls: ['./admin-errores.component.css']
})
export class AdminErroresComponent implements OnInit {
  // Datos principales
  public errores: ErrorFacturacion[] = [];
  public estadisticas: EstadisticasErrores | null = null;
  public errorSeleccionado: ErrorFacturacion | null = null;

  // Estados de carga
  public isLoading: boolean = false;
  public isLoadingEstadisticas: boolean = false;

  // Filtros
  public filtros: FiltrosErrores = {};
  public mostrarFiltros: boolean = false;

  // Paginación
  public paginaActual: number = 1;
  public erroresPorPagina: number = 10;
  public totalPaginas: number = 1;

  // Opciones para filtros
  public tiposError: TipoErrorFacturacion[] = [
    'CFDI40147',
    'CFDI40116',
    'CFDI40124',
    'TIMEOUT',
    'CERTIFICADO_VENCIDO',
    'CERTIFICADO_INVALIDO',
    'SIN_TIMBRES',
    'ERROR_RED',
    'ERROR_VALIDACION',
    'ERROR_SAT',
    'ERROR_SERVIDOR',
    'OTRO'
  ];

  public estadosError: EstadoError[] = ['pendiente', 'en_revision', 'contactado', 'resuelto'];

  // Vista
  public vistaActual: 'lista' | 'estadisticas' = 'lista';

  constructor(private errorTrackingService: ErrorTrackingService) {}

  ngOnInit(): void {
    this.cargarErrores();
    this.cargarEstadisticas();
  }

  /**
   * Carga la lista de errores desde el servicio
   */
  cargarErrores(): void {
    this.isLoading = true;
    this.errorTrackingService.obtenerErrores(this.filtros)
      .subscribe({
        next: (response) => {
          this.errores = response.body || [];
          this.calcularPaginacion();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar errores:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar',
            text: 'No se pudieron cargar los errores. Intenta nuevamente.',
            confirmButtonColor: '#3b82f6'
          });
          this.isLoading = false;
        }
      });
  }

  /**
   * Carga las estadísticas generales
   */
  cargarEstadisticas(): void {
    this.isLoadingEstadisticas = true;
    this.errorTrackingService.obtenerEstadisticas()
      .subscribe({
        next: (response) => {
          this.estadisticas = response.body || null;
          this.isLoadingEstadisticas = false;
        },
        error: (error) => {
          console.error('Error al cargar estadísticas:', error);
          this.isLoadingEstadisticas = false;
        }
      });
  }

  /**
   * Aplica los filtros seleccionados
   */
  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarErrores();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtros = {};
    this.paginaActual = 1;
    this.cargarErrores();
  }

  /**
   * Cambia el estado de un error
   */
  cambiarEstado(error: ErrorFacturacion, nuevoEstado: EstadoError): void {
    const actualizacion: Partial<ErrorFacturacion> = {
      estado: nuevoEstado
    };

    if (nuevoEstado === 'resuelto') {
      actualizacion.resueltoEn = new Date();
      actualizacion.resueltoBy = 'admin@tufan.com'; // TODO: Obtener del usuario actual
    }

    this.errorTrackingService.actualizarError(error._id, actualizacion)
      .subscribe({
        next: (response) => {
          // Actualizar en la lista local
          const index = this.errores.findIndex(e => e._id === error._id);
          if (index !== -1) {
            this.errores[index] = { ...this.errores[index], ...actualizacion };
          }
          
          Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text: `El error ha sido marcado como ${nuevoEstado}`,
            timer: 2000,
            showConfirmButton: false
          });
          
          // Recargar estadísticas
          this.cargarEstadisticas();
        },
        error: (error) => {
          console.error('Error al actualizar estado:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el estado',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
  }

  /**
   * Muestra el detalle completo de un error
   */
  verDetalle(error: ErrorFacturacion): void {
    this.errorSeleccionado = error;
    
    Swal.fire({
      title: `Error #${error._id.substring(0, 8)}`,
      html: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
          <p><strong>Fecha:</strong> ${new Date(error.fecha).toLocaleString('es-MX')}</p>
          <p><strong>Ticket:</strong> ${error.ticketNumber}</p>
          <p><strong>RFC:</strong> ${error.rfcReceptor}</p>
          <p><strong>Nombre:</strong> ${error.nombreReceptor}</p>
          <p><strong>Email:</strong> ${error.emailReceptor}</p>
          <p><strong>Tipo:</strong> ${error.tipoError}</p>
          <p><strong>Código:</strong> ${error.codigoError}</p>
          <p><strong>Mensaje:</strong> ${error.mensajeError}</p>
          <p><strong>Intentos:</strong> ${error.intentos}</p>
          <p><strong>Sucursal:</strong> ${error.sucursal}</p>
          <hr>
          <p><strong>Detalle técnico:</strong></p>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; text-align: left; font-size: 11px;">${JSON.stringify(error.detalleError, null, 2)}</pre>
          ${error.notasAdmin ? `<hr><p><strong>Notas del Admin:</strong> ${error.notasAdmin}</p>` : ''}
        </div>
      `,
      width: '700px',
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Cerrar'
    });
  }

  /**
   * Agrega o edita notas del administrador
   */
  agregarNotas(error: ErrorFacturacion): void {
    Swal.fire({
      title: 'Notas del Administrador',
      input: 'textarea',
      inputLabel: 'Agregar o editar notas sobre este error',
      inputValue: error.notasAdmin || '',
      inputPlaceholder: 'Escribe tus notas aquí...',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes escribir algo';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const actualizacion: Partial<ErrorFacturacion> = {
          notasAdmin: result.value
        };

        this.errorTrackingService.actualizarError(error._id, actualizacion)
          .subscribe({
            next: () => {
              // Actualizar en la lista local
              const index = this.errores.findIndex(e => e._id === error._id);
              if (index !== -1) {
                this.errores[index] = { ...this.errores[index], ...actualizacion };
              }
              
              Swal.fire({
                icon: 'success',
                title: 'Notas guardadas',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error al guardar notas:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron guardar las notas',
                confirmButtonColor: '#3b82f6'
              });
            }
          });
      }
    });
  }

  /**
   * Abre el cliente de correo con un email pre-llenado
   */
  contactarCliente(error: ErrorFacturacion): void {
    const subject = encodeURIComponent(`Asistencia con facturación - Ticket ${error.ticketNumber}`);
    const body = encodeURIComponent(
      `Estimado(a) ${error.nombreReceptor},\n\n` +
      `Hemos detectado un problema al generar su factura para el ticket ${error.ticketNumber}.\n\n` +
      `Motivo: ${error.mensajeError}\n\n` +
      `Le solicitamos ponerse en contacto con nosotros para resolver este inconveniente.\n\n` +
      `Saludos cordiales,\n` +
      `Equipo de Facturación`
    );

    window.location.href = `mailto:${error.emailReceptor}?subject=${subject}&body=${body}`;
    
    // Cambiar estado a "contactado"
    this.cambiarEstado(error, 'contactado');
  }

  /**
   * Elimina un error del sistema
   */
  eliminarError(error: ErrorFacturacion): void {
    Swal.fire({
      title: '¿Eliminar este error?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.errorTrackingService.eliminarError(error._id)
          .subscribe({
            next: () => {
              // Eliminar de la lista local
              this.errores = this.errores.filter(e => e._id !== error._id);
              this.calcularPaginacion();
              
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El error ha sido eliminado',
                timer: 2000,
                showConfirmButton: false
              });
              
              // Recargar estadísticas
              this.cargarEstadisticas();
            },
            error: (error) => {
              console.error('Error al eliminar:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el error',
                confirmButtonColor: '#3b82f6'
              });
            }
          });
      }
    });
  }

  /**
   * Calcula la paginación
   */
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.errores.length / this.erroresPorPagina);
  }

  /**
   * Obtiene los errores de la página actual
   */
  get erroresPaginados(): ErrorFacturacion[] {
    const inicio = (this.paginaActual - 1) * this.erroresPorPagina;
    const fin = inicio + this.erroresPorPagina;
    return this.errores.slice(inicio, fin);
  }

  /**
   * Cambia de página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Obtiene el color del badge según el estado
   */
  getEstadoColor(estado: EstadoError): string {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_revision': return 'bg-blue-100 text-blue-800';
      case 'contactado': return 'bg-purple-100 text-purple-800';
      case 'resuelto': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtiene el color del badge según el tipo de error
   */
  getTipoErrorColor(tipo: TipoErrorFacturacion): string {
    switch (tipo) {
      case 'CFDI40147':
      case 'CFDI40116':
      case 'CFDI40124':
        return 'bg-orange-100 text-orange-800';
      case 'CERTIFICADO_VENCIDO':
      case 'CERTIFICADO_INVALIDO':
        return 'bg-red-100 text-red-800';
      case 'SIN_TIMBRES':
        return 'bg-pink-100 text-pink-800';
      case 'TIMEOUT':
      case 'ERROR_RED':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtiene el texto legible del tipo de error
   */
  getTipoErrorTexto(tipo: TipoErrorFacturacion): string {
    const textos: Record<TipoErrorFacturacion, string> = {
      'CFDI40147': 'CP Inválido',
      'CFDI40116': 'RFC Inválido',
      'CFDI40124': 'Uso CFDI Inválido',
      'TIMEOUT': 'Timeout SAT',
      'CERTIFICADO_VENCIDO': 'Certificado Vencido',
      'CERTIFICADO_INVALIDO': 'Certificado Inválido',
      'SIN_TIMBRES': 'Sin Timbres',
      'ERROR_RED': 'Error de Red',
      'ERROR_VALIDACION': 'Error Validación',
      'ERROR_SAT': 'Error SAT',
      'ERROR_SERVIDOR': 'Error Servidor',
      'OTRO': 'Otro'
    };
    return textos[tipo] || tipo;
  }

  /**
   * Exporta los errores a CSV
   */
  exportarCSV(): void {
    const headers = ['Fecha', 'Ticket', 'RFC', 'Nombre', 'Email', 'Tipo Error', 'Mensaje', 'Intentos', 'Estado'];
    const rows = this.errores.map(e => [
      new Date(e.fecha).toLocaleString('es-MX'),
      e.ticketNumber,
      e.rfcReceptor,
      e.nombreReceptor,
      e.emailReceptor,
      e.tipoError,
      e.mensajeError,
      e.intentos.toString(),
      e.estado
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `errores_facturacion_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Alterna la vista entre lista y estadísticas
   */
  cambiarVista(vista: 'lista' | 'estadisticas'): void {
    this.vistaActual = vista;
  }
}
