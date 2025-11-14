import { Component, OnInit } from '@angular/core';
import { TimbresService } from '../../services/timbres.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Certificado } from '../../models/certificado';
import { response } from 'express';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { FacturacionService } from '../../services/facturacion.service';

@Component({
  selector: 'app-lista-facturas',
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-facturas.component.html',
  styleUrl: './lista-facturas.component.css'
})
export class ListaFacturasComponent implements OnInit {
  public email: string = '';
  public certificados: Certificado[] = [];
  public expandedCertificadoIndex: number | null = null;
  public facturaHover: any = null;
  public loading: boolean = true;
  public totalFacturasTimbradas: number = 0;

  public months = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' }
  ];
  public years: number[] = [];
  public selectedMonth: number = new Date().getMonth() + 1;
  public selectedYear: number = new Date().getFullYear();
  public yearsRange: number = 0;
  public visibleMonths: { value: number, name: string }[] = [];

  constructor(private timbresService: TimbresService, private authService: AuthService, private facturacionService: FacturacionService) { }

  ngOnInit(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.yearsRange = this.selectedMonth === 1 ? 1 : 0;
    // Rango de años: últimos 10 años
    for (let y = now.getFullYear(); y >= now.getFullYear() - this.yearsRange; y--) {
      this.years.push(y);
    }
    this.updateVisibleMonths();

    // Resetear certificados para forzar carga fresca
    this.certificados = [];
    this.totalFacturasTimbradas = 0;
    
    this.authService.getCurrentUser()
      .then(user => {
        this.email = user.tokens.idToken.payload.email;
        this.loadFacturas();
      })
      .catch(error => {
        console.error('Error al obtener usuario:', error);
        this.loading = false;
      });
  }

  updateVisibleMonths(): void {
    const now = new Date();
    if (this.selectedYear === now.getFullYear()) {
      if (now.getMonth() + 1 === 1) {
        // Si es enero, mostrar diciembre del año anterior y enero
        this.visibleMonths = [
          this.months[11], // Diciembre
          this.months[0]   // Enero
        ];
      } else {
        // Mostrar desde enero hasta el mes actual
        this.visibleMonths = this.months.slice(0, now.getMonth() + 1);
      }
    } else {
      // Si no es el año actual, mostrar todos los meses
      this.visibleMonths = [...this.months];
    }
  }

  loadFacturas(): void {
    this.loading = true;
    // Resetear datos antes de cargar para evitar mostrar datos antiguos
    this.certificados = [];
    this.totalFacturasTimbradas = 0;
    this.expandedCertificadoIndex = null;
    
    const lastDay = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const startDate = `${this.selectedYear}-${this.selectedMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${this.selectedYear}-${this.selectedMonth.toString().padStart(2, '0')}-${lastDay}`;
    
    console.log('🔍 Cargando facturas para:', this.email, 'desde:', startDate, 'hasta:', endDate);
    
    this.timbresService.getFacturasEmitidasByMes(this.email, startDate, endDate)
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servicio:', response);
          this.certificados = response.body || [];
          this.totalFacturasTimbradas = this.certificados
            .map(c => c.facturas_emitidas?.length || 0)
            .reduce((a, b) => a + b, 0);
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando facturas:', error);
          this.certificados = [];
          this.totalFacturasTimbradas = 0;
          this.loading = false;
        }
      });
  }

  onMonthYearChange(): void {
    this.updateVisibleMonths();
    // Si el mes seleccionado ya no está en visibleMonths, selecciona el último disponible
    if (!this.visibleMonths.some(m => m.value === this.selectedMonth)) {
      this.selectedMonth = this.visibleMonths[this.visibleMonths.length - 1].value;
    }
    this.loadFacturas();
  }

  toggleCertificado(index: number): void {
    this.expandedCertificadoIndex = this.expandedCertificadoIndex === index ? null : index;
  }

  deleteFactura(uuid:string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.facturacionService.cancelaFactura(uuid, '02', '')
        .subscribe({
          next: (response:any) => {
            Swal.fire(
              'Eliminado',
              'La factura ha sido eliminada.',
              'success'
            );
            this.loadFacturas();
          },
          error: (err:any) => {
            Swal.fire(
              'Error',
              'Ocurrió un error al eliminar la factura.',
              'error'
            );
          }
        });
      }
    });
  }
}
