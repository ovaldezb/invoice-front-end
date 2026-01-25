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
import { ConfiguraPagosComponent } from '../configura-pagos/configura-pagos.component';
import { PagosComponent } from '../pagos/pagos.component';

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
  imports: [CommonModule, FormsModule, ConfiguraCsdComponent, EmitirFacturaComponent, ConfiguraPagosComponent, PagosComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, DoCheck {
  givenName: string = '';
  familyName: string = '';
  email: string = '';
  activeTab: string = 'bitacora';
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

  // Pagos
  // Logic moved to PagosComponent

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
      this.cargarBitacora();
      this.cargarDatosDashboard();
    }).catch(error => {
      console.error('Error al obtener el usuario actual:', error);
      this.router.navigate(['/login'], { replaceUrl: true });
    });
  }

  ngDoCheck(): void {
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
          const certificados: Certificado[] = response.body;

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
    this.stats.totalFacturado = 0;
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

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

      const desde = primerDia.toISOString().split('T')[0];
      const hasta = ultimoDia.toISOString().split('T')[0];

      this.timbresService.getFacturasEmitidasByMes(this.email, desde, hasta).subscribe({
        next: (response) => {
          if (response.status === 200 && response.body) {
            const certificados: Certificado[] = response.body;
            let totalFacturas = 0;
            certificados.forEach(cert => {
              if (cert.facturas_emitidas) {
                totalFacturas += cert.facturas_emitidas.length;
              }
            });

            this.facturacionMensual.push({
              mes: meses[fecha.getMonth()],
              cantidad: totalFacturas,
              total: 0
            });
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
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });
  }

  inicializarFechasBitacora(): void {
    const hoy = new Date();
    this.fechaFinBitacora = this.formatearFechaInput(hoy);
    this.fechaInicioBitacora = this.formatearFechaInput(hoy);
  }

  cargarBitacora(): void {
    if (!this.fechaInicioBitacora || !this.fechaFinBitacora) {
      Swal.fire({
        icon: 'warning',
        title: '¡Atención!',
        text: 'Por favor selecciona un rango de fechas válido'
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la bitácora'
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
