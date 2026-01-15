import { Component, OnInit, ChangeDetectorRef, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfiguraCsdComponent } from '../configura-csd/configura-csd.component';
import { TimbresService } from '../../services/timbres.service';
import { CertificadosService } from '../../services/certificados.service';
import { BitacoraService } from '../../services/bitacora.service';
import { Certificado } from '../../models/certificado';
import { FacturaEmitida } from '../../models/facturasEmitidas';
import { RegistroBitacora } from '../../models/bitacora';
import Swal from 'sweetalert2';
import { EmitirFacturaComponent } from "../emitir-factura/emitir-factura.component";

interface DashboardStats {
  facturasDelMes: number;
  totalFacturado: number;
  certificadosActivos: number;
  sucursalesActivas: number;
  facturasCanceladas: number;
}

interface FacturaMensual {
  mes: string;
  cantidad: number;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfiguraCsdComponent, EmitirFacturaComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, DoCheck {
  givenName: string = '';
  familyName: string = '';
  email: string = '';
  activeTab: string = 'bitacora'; // Cambiado a bitacora como vista predeterminada
  profile: string = '';
  loading: boolean = true;

  // Estadísticas
  stats: DashboardStats = {
    facturasDelMes: 0,
    totalFacturado: 0,
    certificadosActivos: 0,
    sucursalesActivas: 0,
    facturasCanceladas: 0
  };

  // Datos para gráficos
  facturasRecientes: FacturaEmitida[] = [];
  certificados: Certificado[] = [];
  certificadosPorVencer: Certificado[] = [];
  facturacionMensual: FacturaMensual[] = [];

  // Bitácora
  registrosBitacora: RegistroBitacora[] = [];
  bitacoraLoading: boolean = false;
  fechaInicioBitacora: string = '';
  fechaFinBitacora: string = '';
  filtroStatus: string = '';
  filtroEmail: string = '';
  filtroRFC: string = '';
  mensajeExpandido: string | null = null;
  vistaAgrupada: boolean = false;
  rfcExpandido = new Map<string, boolean>();
  registrosAgrupadosPorRFC: { key: string; rfc: string; rfcEmisor?: string; registros: RegistroBitacora[]; totalExito: number; totalError: number; totalWarning: number; totalInfo: number }[] = [];

  // Para detectar cambios en filtros
  private lastFiltroStatus: string = '';
  private lastFiltroEmail: string = '';
  private lastFiltroRFC: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private timbresService: TimbresService,
    private certificadosService: CertificadosService,
    private bitacoraService: BitacoraService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().then(user => {
      this.profile = user.tokens.idToken.payload["cognito:groups"][0];
      this.givenName = user.tokens.idToken.payload.given_name;
      this.familyName = user.tokens.idToken.payload.family_name;
      this.email = user.tokens.idToken.payload.email;
      this.inicializarFechasBitacora();
      this.cargarBitacora(); // Cargar bitácora primero (vista predeterminada)
      this.cargarDatosDashboard(); // Cargar datos personales en segundo plano
    }).catch(error => {
      console.error('Error al obtener el usuario actual:', error);
      this.router.navigate(['/login'], { replaceUrl: true });
    });
  }

  ngDoCheck(): void {
    // Detectar cambios en filtros y recalcular grupos si es necesario
    if (this.vistaAgrupada &&
      (this.lastFiltroStatus !== this.filtroStatus ||
        this.lastFiltroEmail !== this.filtroEmail ||
        this.lastFiltroRFC !== this.filtroRFC)) {
      this.lastFiltroStatus = this.filtroStatus;
      this.lastFiltroEmail = this.filtroEmail;
      this.lastFiltroRFC = this.filtroRFC;
      this.calcularGruposPorRFC();
    }
  }

  cargarDatosDashboard(): void {
    this.loading = true;

    // Obtener fechas del mes actual
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const desde = primerDiaMes.toISOString().split('T')[0];
    const hasta = ultimoDiaMes.toISOString().split('T')[0];

    // Cargar facturas del mes
    this.timbresService.getFacturasEmitidasByMes(this.email, desde, hasta).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          // El endpoint devuelve un array de Certificados con facturas_emitidas anidadas
          const certificados: Certificado[] = response.body;

          // Extraer todas las facturas de todos los certificados
          this.facturasRecientes = [];
          certificados.forEach(cert => {
            if (cert.facturas_emitidas && cert.facturas_emitidas.length > 0) {
              this.facturasRecientes.push(...cert.facturas_emitidas);
            }
          });

          console.log('📊 Facturas cargadas:', this.facturasRecientes.length);
          this.calcularEstadisticas();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
        this.loading = false;
      }
    });

    // Cargar certificados
    this.certificadosService.getAllCertificados(this.email).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          this.certificados = response.body;
          console.log('📋 Certificados cargados:', this.certificados.length);
          this.verificarCertificadosPorVencer();
          this.calcularSucursalesActivas();
        }
      },
      error: (error) => {
        console.error('Error al cargar certificados:', error);
      }
    });

    // Cargar facturación de los últimos 6 meses
    this.cargarFacturacionHistorica();
  }

  calcularEstadisticas(): void {
    this.stats.facturasDelMes = this.facturasRecientes.length;

    // Calcular total facturado (esto requeriría más información del backend)
    // Por ahora lo dejamos en 0 o podrías calcularlo si tienes los montos en las facturas
    this.stats.totalFacturado = 0;

    // Contar facturas canceladas (si tienen algún indicador)
    this.stats.facturasCanceladas = 0;
  }

  verificarCertificadosPorVencer(): void {
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);

    this.certificadosPorVencer = this.certificados.filter(cert => {
      const fechaVencimiento = new Date(cert.hasta);
      return fechaVencimiento > hoy && fechaVencimiento <= treintaDias;
    });

    this.stats.certificadosActivos = this.certificados.filter(cert => {
      const fechaVencimiento = new Date(cert.hasta);
      return fechaVencimiento > hoy;
    }).length;
  }

  calcularSucursalesActivas(): void {
    let totalSucursales = 0;
    this.certificados.forEach(cert => {
      if (cert.sucursales && cert.sucursales.length > 0) {
        totalSucursales += cert.sucursales.length;
      }
    });
    this.stats.sucursalesActivas = totalSucursales;
  }

  cargarFacturacionHistorica(): void {
    const hoy = new Date();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Obtener los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

      const desde = primerDia.toISOString().split('T')[0];
      const hasta = ultimoDia.toISOString().split('T')[0];

      this.timbresService.getFacturasEmitidasByMes(this.email, desde, hasta).subscribe({
        next: (response) => {
          if (response.status === 200 && response.body) {
            // El endpoint devuelve Certificado[] con facturas_emitidas anidadas
            const certificados: Certificado[] = response.body;

            // Contar todas las facturas de todos los certificados
            let totalFacturas = 0;
            certificados.forEach(cert => {
              if (cert.facturas_emitidas) {
                totalFacturas += cert.facturas_emitidas.length;
              }
            });

            this.facturacionMensual.push({
              mes: meses[fecha.getMonth()],
              cantidad: totalFacturas,
              total: 0 // Aquí podrías calcular el total si tienes los montos
            });
            // Ordenar por mes
            this.facturacionMensual.sort((a, b) => {
              return meses.indexOf(a.mes) - meses.indexOf(b.mes);
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar histórico:', error);
        }
      });
    }
  }

  getMaxFacturas(): number {
    if (this.facturacionMensual.length === 0) return 100;
    return Math.max(...this.facturacionMensual.map(f => f.cantidad));
  }

  getBarHeight(cantidad: number): number {
    const max = this.getMaxFacturas();
    return (cantidad / max) * 100;
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  diasParaVencer(fechaHasta: Date): number {
    const hoy = new Date();
    const hasta = new Date(fechaHasta);
    const diff = hasta.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  navigateToHome(): void {
    this.router.navigate(['/factura']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: (error) => {
        console.error('Error en logout:', error);
        // Redirigir al login incluso si hay error en el logout
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }

  // Métodos de Bitácora
  inicializarFechasBitacora(): void {
    const hoy = new Date();
    // Inicializar con la fecha de hoy para ambos campos
    this.fechaFinBitacora = this.formatearFechaInput(hoy);
    this.fechaInicioBitacora = this.formatearFechaInput(hoy);
  }

  cargarBitacora(): void {
    if (!this.fechaInicioBitacora || !this.fechaFinBitacora) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        html: `
          <div class="text-left space-y-2">
            <p class="text-gray-700">Por favor selecciona un rango de fechas válido</p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3b82f6',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-2xl font-bold text-gray-800',
          htmlContainer: 'text-base',
          confirmButton: 'px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200'
        }
      });
      return;
    }

    this.bitacoraLoading = true;
    this.bitacoraService.getBitacora(this.fechaInicioBitacora, this.fechaFinBitacora).subscribe({
      next: (response) => {
        if (response.status === 200 && response.body) {
          this.registrosBitacora = response.body.data || [];
          this.calcularGruposPorRFC();
        }
        this.bitacoraLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar bitácora:', error);
        this.bitacoraLoading = false;

        let icono: 'error' | 'warning' | 'info' = 'error';
        let titulo = '¡Oops! Algo salió mal';
        let mensaje = '';
        let detalles = '';

        if (error.status === 404) {
          icono = 'info';
          titulo = 'Sin registros';
          mensaje = 'No se encontraron registros en el rango de fechas seleccionado';
          detalles = `
            <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-start space-x-3">
                <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="text-left">
                  <p class="text-sm text-blue-800 font-medium">Sugerencias:</p>
                  <ul class="text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside">
                    <li>Intenta ampliar el rango de fechas</li>
                    <li>Verifica que las fechas sean correctas</li>
                    <li>Prueba con fechas más recientes</li>
                  </ul>
                </div>
              </div>
            </div>
          `;
        } else if (error.status === 502 || error.status === 503) {
          icono = 'warning';
          titulo = 'Servicio no disponible';
          mensaje = 'El servidor de bitácora está temporalmente fuera de servicio';
          detalles = `
            <div class="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div class="flex items-start space-x-3">
                <svg class="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div class="text-left">
                  <p class="text-sm text-orange-800 font-medium">¿Qué puedes hacer?</p>
                  <ul class="text-sm text-orange-700 mt-1 space-y-1 list-disc list-inside">
                    <li>Intenta nuevamente en unos minutos</li>
                    <li>Contacta al equipo de backend si persiste</li>
                  </ul>
                </div>
              </div>
            </div>
          `;
        } else if (error.status === 401 || error.status === 403) {
          icono = 'error';
          titulo = 'Acceso denegado';
          mensaje = 'No tienes permisos para acceder a esta información';
          detalles = `
            <div class="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div class="flex items-start space-x-3">
                <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <div class="text-left">
                  <p class="text-sm text-red-700">Contacta al administrador del sistema para obtener los permisos necesarios</p>
                </div>
              </div>
            </div>
          `;
        } else {
          mensaje = 'No se pudo cargar la información de la bitácora';
          detalles = `
            <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div class="flex items-start space-x-3">
                <svg class="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="text-left">
                  <p class="text-sm text-gray-700 font-mono">Error ${error.status || 'desconocido'}</p>
                  <p class="text-xs text-gray-600 mt-1">${error.message || 'Error de conexión'}</p>
                </div>
              </div>
            </div>
          `;
        }

        Swal.fire({
          icon: icono,
          title: titulo,
          html: `
            <div class="text-left space-y-3">
              <p class="text-gray-700 text-base">${mensaje}</p>
              ${detalles}
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: icono === 'error' ? '#ef4444' : icono === 'warning' ? '#f59e0b' : '#3b82f6',
          customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-2xl font-bold text-gray-800',
            htmlContainer: 'text-base',
            confirmButton: 'px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
          },
          showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
          }
        });
      }
    });
  }

  get registrosFiltrados(): RegistroBitacora[] {
    return this.registrosBitacora.filter(registro => {
      const cumpleFiltroStatus = !this.filtroStatus ||
        registro.status?.toLowerCase().includes(this.filtroStatus.toLowerCase());
      const cumpleFiltroEmail = !this.filtroEmail ||
        registro.email?.toLowerCase().includes(this.filtroEmail.toLowerCase());
      const cumpleFiltroRFC = !this.filtroRFC ||
        registro.rfc?.toLowerCase().includes(this.filtroRFC.toLowerCase()) ||
        registro.rfcEmisor?.toLowerCase().includes(this.filtroRFC.toLowerCase());
      return cumpleFiltroStatus && cumpleFiltroEmail && cumpleFiltroRFC;
    });
  }

  calcularGruposPorRFC(): void {
    const registrosFiltrados = this.registrosFiltrados;
    const grupos = new Map<string, RegistroBitacora[]>();

    registrosFiltrados.forEach(registro => {
      const key = `${registro.rfc}|${registro.rfcEmisor || 'N/A'}`;
      if (!grupos.has(key)) {
        grupos.set(key, []);
      }
      grupos.get(key)!.push(registro);
    });

    this.registrosAgrupadosPorRFC = Array.from(grupos.entries()).map(([key, registros]) => {
      const [rfc, rfcEmisor] = key.split('|');
      return {
        key,
        rfc,
        rfcEmisor: rfcEmisor === 'N/A' ? undefined : rfcEmisor,
        registros: registros.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        totalExito: registros.filter(r => r.status === 'exito').length,
        totalError: registros.filter(r => r.status === 'error').length,
        totalWarning: registros.filter(r => r.status === 'warning').length,
        totalInfo: registros.filter(r => r.status === 'info').length
      };
    }).sort((a, b) => b.registros.length - a.registros.length);

    console.log('🔄 Grupos calculados:', this.registrosAgrupadosPorRFC.length);
  }

  toggleRFC(key: string): void {
    const currentState = this.rfcExpandido.get(key) || false;
    this.rfcExpandido.set(key, !currentState);
    this.cdr.detectChanges();
  }

  isRFCExpandido(key: string): boolean {
    return this.rfcExpandido.get(key) || false;
  }

  formatearFechaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearFechaHora(fechaHora: string): string {
    try {
      const fecha = new Date(fechaHora);
      if (isNaN(fecha.getTime())) {
        return fechaHora;
      }

      // MongoDB guarda en UTC, agregar 6 horas para zona horaria de México (CST)
      fecha.setHours(fecha.getHours() + 6);

      return fecha.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return fechaHora;
    }
  }

  toggleMensaje(id: string): void {
    this.mensajeExpandido = this.mensajeExpandido === id ? null : id;
  }

  isMensajeExpandido(id: string): boolean {
    return this.mensajeExpandido === id;
  }

  getIconoTipoEvento(tipo?: string): string {
    switch (tipo) {
      case 'exito':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }

  getColorTipoEvento(tipo?: string): string {
    switch (tipo) {
      case 'exito':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  }

  onCertificadoActualizado(): void {
    console.log('🔄 Certificado/Sucursal actualizado, refrescando bitácora...');
    if (this.activeTab === 'bitacora') {
      this.cargarBitacora();
    }
  }
}
