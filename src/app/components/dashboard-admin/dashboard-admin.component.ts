import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimbresService } from '../../services/timbres.service';
import { CertificadosService } from '../../services/certificados.service';
import { AuthService } from '../../services/auth.service';
import { Certificado } from '../../models/certificado';

interface DashboardStats {
  // Timbres y Facturación
  totalFacturasHoy: number;
  totalFacturasSemana: number;
  totalFacturasMes: number;
  
  // Certificados
  totalCertificados: number;
  certificadosActivos: number;
  certificadosPorVencer: number;
  
  // Tendencias
  facturasUltimos7Dias: { fecha: string; cantidad: number; }[];
  certificadosMasUsados: { nombre: string; rfc: string; facturas: number; }[];
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  public stats: DashboardStats = {
    totalFacturasHoy: 0,
    totalFacturasSemana: 0,
    totalFacturasMes: 0,
    totalCertificados: 0,
    certificadosActivos: 0,
    certificadosPorVencer: 0,
    facturasUltimos7Dias: [],
    certificadosMasUsados: []
  };

  public isLoading: boolean = true;
  public idUsuarioCognito: string = '';
  public certificados: Certificado[] = [];

  constructor(
    private timbresService: TimbresService,
    private certificadosService: CertificadosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser()
      .then(user => {
        this.idUsuarioCognito = user.tokens.idToken.payload.sub;
        this.cargarDatosAdmin();
      })
      .catch(error => {
        console.error('Error al obtener usuario:', error);
        this.isLoading = false;
      });
  }

  /**
   * Carga todos los datos del dashboard
   */
  async cargarDatosAdmin(): Promise<void> {
    this.isLoading = true;
    
    try {
      await Promise.all([
        this.cargarFacturasDelMes(),
        this.cargarCertificados()
      ]);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Carga facturas del mes actual y calcula estadísticas
   */
  async cargarFacturasDelMes(): Promise<void> {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
    
    const fechaInicio = this.formatearFecha(inicioMes);
    const fechaFin = this.formatearFecha(finMes);

    try {
      const response = await this.timbresService.getFacturasEmitidasByMes(
        this.idUsuarioCognito,
        fechaInicio,
        fechaFin
      ).toPromise();

      const certificados = response?.body || [];
      
      // Calcular totales
      this.calcularEstadisticasFacturas(certificados);
      
    } catch (error) {
      console.error('Error al cargar facturas:', error);
    }
  }

  /**
   * Calcula estadísticas de facturas
   */
  calcularEstadisticasFacturas(certificados: any[]): void {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const hace7dias = new Date(hoy);
    hace7dias.setDate(hace7dias.getDate() - 7);

    let totalMes = 0;
    let totalHoy = 0;
    let totalSemana = 0;
    const facturasPorDia = new Map<string, number>();
    const facturasPorCertificado = new Map<string, { nombre: string; rfc: string; cantidad: number }>();

    certificados.forEach(cert => {
      const facturas = cert.facturas_emitidas || [];
      
      facturas.forEach((factura: any) => {
        const fechaFactura = new Date(factura.fechaTimbrado);
        const fechaStr = this.formatearFecha(fechaFactura);
        
        // Total del mes
        totalMes++;
        
        // Total de hoy
        if (fechaFactura >= hoy) {
          totalHoy++;
        }
        
        // Total últimos 7 días
        if (fechaFactura >= hace7dias) {
          totalSemana++;
          
          // Agrupar por día
          const cantidad = facturasPorDia.get(fechaStr) || 0;
          facturasPorDia.set(fechaStr, cantidad + 1);
        }
        
        // Facturas por certificado
        const certKey = cert.rfc;
        const certData = facturasPorCertificado.get(certKey) || {
          nombre: cert.nombre,
          rfc: cert.rfc,
          cantidad: 0
        };
        certData.cantidad++;
        facturasPorCertificado.set(certKey, certData);
      });
    });

    this.stats.totalFacturasHoy = totalHoy;
    this.stats.totalFacturasSemana = totalSemana;
    this.stats.totalFacturasMes = totalMes;

    // Generar array de últimos 7 días
    this.stats.facturasUltimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = this.formatearFecha(fecha);
      this.stats.facturasUltimos7Dias.push({
        fecha: this.formatearFechaLegible(fecha),
        cantidad: facturasPorDia.get(fechaStr) || 0
      });
    }

    // Top 5 certificados más usados
    this.stats.certificadosMasUsados = Array.from(facturasPorCertificado.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
      .map(cert => ({
        nombre: cert.nombre,
        rfc: cert.rfc,
        facturas: cert.cantidad
      }));
  }

  /**
   * Carga certificados y analiza su estado
   */
  async cargarCertificados(): Promise<void> {
    try {
      const response = await this.certificadosService.getAllCertificados(
        this.idUsuarioCognito
      ).toPromise();

      this.certificados = response?.body || [];
      this.stats.totalCertificados = this.certificados.length;

      const ahora = new Date();
      const en30dias = new Date(ahora);
      en30dias.setDate(en30dias.getDate() + 30);

      this.stats.certificadosActivos = 0;
      this.stats.certificadosPorVencer = 0;

      this.certificados.forEach(cert => {
        if (cert.hasta) {
          const fechaVencimiento = new Date(cert.hasta);
          
          if (fechaVencimiento > ahora) {
            this.stats.certificadosActivos++;
            
            // Certificados por vencer en los próximos 30 días
            if (fechaVencimiento <= en30dias) {
              this.stats.certificadosPorVencer++;
            }
          }
        }
      });

    } catch (error) {
      console.error('Error al cargar certificados:', error);
    }
  }

  /**
   * Formatea fecha para API (YYYY-MM-DD)
   */
  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea fecha para mostrar (DD/MM)
   */
  formatearFechaLegible(fecha: Date): string {
    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  /**
   * Obtiene el valor máximo para normalizar gráfico
   */
  getMaxFacturasDia(): number {
    const max = Math.max(...this.stats.facturasUltimos7Dias.map(d => d.cantidad));
    return max > 0 ? max : 1;
  }

  /**
   * Recarga todos los datos
   */
  refrescar(): void {
    this.cargarDatosAdmin();
  }
}
