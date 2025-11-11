import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfiguraCsdComponent } from '../configura-csd/configura-csd.component';
import { ListaFacturasComponent } from "../lista-facturas/lista-facturas.component";
import { TimbresService } from '../../services/timbres.service';
import { CertificadosService } from '../../services/certificados.service';
import { Certificado } from '../../models/certificado';
import { FacturaEmitida } from '../../models/facturasEmitidas';

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
  imports: [CommonModule, ConfiguraCsdComponent, ListaFacturasComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  givenName: string = '';
  familyName: string = '';
  email: string = '';
  activeTab: string = 'resumen';
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private timbresService: TimbresService,
    private certificadosService: CertificadosService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().then(user => {
      this.givenName = user.tokens.idToken.payload.given_name;
      this.familyName = user.tokens.idToken.payload.family_name;
      this.email = user.tokens.idToken.payload.email;
      this.cargarDatosDashboard();
    }).catch(error => {
      console.error('Error al obtener el usuario actual:', error);
      this.router.navigate(['/login']);
    });
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
          this.facturasRecientes = response.body;
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
            this.facturacionMensual.push({
              mes: meses[fecha.getMonth()],
              cantidad: response.body.length,
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

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error en logout:', error);
      }
    });
  }
}
