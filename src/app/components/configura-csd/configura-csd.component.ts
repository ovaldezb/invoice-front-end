import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sucursal } from '../../models/sucursal';
import { CertificadosService } from '../../services/certificados.service';
import { Certificado } from '../../models/certificado';
import { SucursalService } from '../../services/sucursal.service';
import Swal from 'sweetalert2';
import { Global } from '../../services/Global';
import { SwsapienCertificadoService } from '../../services/swsapien-certificado.service';
import { SwsapienCertificado } from '../../models/swsapienCertificado';
import { FolioService } from '../../services/folio.service';
import { Folio } from '../../models/folio';
import { FacturacionService } from '../../services/facturacion.service';
import { RegimenFiscal } from '../../models/regimenfiscal';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-configura-csd',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configura-csd.component.html',
})
export class ConfiguraCsdComponent implements OnInit{
  public certificados:Certificado[] = [];
  public mostrarFormulario: boolean = false;
  public isLoadingCerts: boolean = false; // Variable para controlar el estado de carga
  public isSavingSucursal: boolean = false;
  public csdSeleccionado: Certificado | null = null;
  public mostrarModal: boolean = false;
  public nuevaSucursal: Sucursal = new Sucursal('','','','','','','','', '');
  public csdActual: Certificado = new Certificado('', '', '', '', new Date(), new Date(), [], '');
  public editandoSucursal: boolean = false;
  public sucursalAEditar: Sucursal | null = null;
  public btnAction: string = Global.AGREGAR_SUCURSAL; // Botón de acción para agregar o editar sucursal
  private archivoCer: File | null = null;
  private archivoKey: File | null = null;
  public ctrsn: string = ''; 
  private idUsuarioCognito: string = '';
  public isUploading:boolean = false;
  public archivoCerSeleccionado:String='';
  public archivoKeySeleccionado:String='';
  public sucursalExistente: boolean = false; // Variable para verificar si la sucursal ya existe
  public codigoPostalInvalido: boolean = false;
  public codigoPostalPristine: boolean = true;
  public telefonoInvalido: boolean = false;
  public regimenFiscal: RegimenFiscal[] = [];
  public swsapienCertificado: SwsapienCertificado = new SwsapienCertificado('', '', '', false, '', new Date(), new Date(), '');
  constructor(private certificadoService: CertificadosService, 
      private sucursalService: SucursalService,
      private swsapienService: SwsapienCertificadoService,
      private datosFacturaService: FacturacionService,
      private authService: AuthService,
      private folioService: FolioService) {}

  ngOnInit(): void {
      this.obtieneDatosFacturar();
      this.authService.getCurrentUser()
      .then(user => {
        this.idUsuarioCognito = user.tokens.idToken.payload.sub;
        this.loadCerts();
      });
  }
    
  loadCerts(): void {
    this.isLoadingCerts = true; 
    console.log('Cargando certificados...',this.idUsuarioCognito); // Cambiar el estado de carga a verdadero
    this.certificadoService.getAllCertificados(this.idUsuarioCognito)
    .subscribe({
        next: (res) => {
            this.isLoadingCerts = false; // Cambiar el estado de carga a falso
            this.certificados = res.body || [];            
        },
        error: (error) => {
            Swal.fire('Error', 'No se pudieron cargar los certificados. Inténtalo de nuevo más tarde.', 'error');
        }
    });
  }  

    obtieneDatosFacturar():void{
      this.datosFacturaService.getDatosParaFacturar()
      .subscribe({
        next: (res) => {
          this.regimenFiscal = res.body ? (res.body as { regimen_fiscal: RegimenFiscal[] }).regimen_fiscal : [];
        },
        error: (error) => {
          //console.error('Error al obtener datos para facturar:', error);
        }
      });
    }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.csdSeleccionado = null;
  }

  seleccionarCSD(certificado: Certificado) {
    if (this.csdSeleccionado?._id === certificado._id) {
        this.csdSeleccionado = null;
    } else {
        this.csdSeleccionado = certificado;
    }
  }

  agregarSucursal(certificado: Certificado) {
    this.csdActual = certificado;
    this.btnAction = Global.AGREGAR_SUCURSAL; // Asegurar que esté en modo agregar
    this.editandoSucursal = false; // Resetear modo edición
    this.sucursalExistente = false; // Resetear validación
    this.nuevaSucursal = new Sucursal('','','','','','','','', ''); // Limpiar formulario
    this.mostrarModal = true;
  }

  editarSucursal(certificado: Certificado, sucursal: Sucursal) {
    this.editandoSucursal = true;
    this.nuevaSucursal = { ...sucursal }; // Crear copia para evitar mutación directa
    this.btnAction = Global.EDITAR_SUCURSAL; // Cambiar el texto del botón a "Editar Sucursal"
    this.mostrarModal = true;
    this.csdActual = certificado; // Asignar el certificado actual para editar la sucursal
    // Resetear validaciones para modo edición
    this.sucursalExistente = false; // En edición no verificamos existencia
  }

  guardaEditarSucursal() {
    if (this.editandoSucursal) {
      this.actualizarSucursal();
    } else {
      this.guardarSucursal();
    }
  }

  guardarSucursal() {
    if(this.sucursalExistente){
        Swal.fire({
            text: 'El código de sucursal ' + this.nuevaSucursal.codigo_sucursal + ' ya está en uso, favor de corregirlo.',
            icon: 'error'
        });
        return; // Si la sucursal ya existe, no continuar con el guardado
    }
    if (this.csdActual && this.nuevaSucursal.codigo_sucursal) {
      Swal.fire({
        title: 'Confirmar',
        text: '¿Estás seguro de que deseas agregar esta sucursal?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No'
      }).then((result) => {
        if (result.isConfirmed) {
            this.isSavingSucursal = true;
            this.nuevaSucursal.id_certificado = this.csdActual._id; // Asignar el ID del certificado actual a la nueva sucursal
            const certificado = this.csdActual; // Guardar el certificado actual antes de la llamada al servicio
            this.folioService.addFolio(new Folio('', this.nuevaSucursal.codigo_sucursal, 1))
            .subscribe();
            this.sucursalService.insertarSucursal(this.nuevaSucursal).subscribe({
                next: (res) => {
                    certificado.sucursales.push(new Sucursal(res.body.id,'', '', '', '', '', '','', ''));
                    this.certificadoService.updateCertificado(certificado)
                    .subscribe({
                        next: (updateRes) => {
                            Swal.fire('Éxito', 'La sucursal ha sido agregada correctamente.', 'success');
                            this.loadCerts(); // Recargar los certificados para reflejar los cambios
                            this.cerrarModal();
                        },
                        error: (error) => {
                            console.error('Error al agregar sucursal:', error);
                        }
                    });
                },
                error: (error) => {
                    console.error('Error al agregar sucursal:', error);
                }
            });
        }
      });
    }
  }

  getSucursalById():void{
    if (!this.nuevaSucursal.codigo_sucursal) {
      this.sucursalExistente = false; // Si no hay código de sucursal, no hay sucursal existente
      return;
    }
    if(this.btnAction==Global.EDITAR_SUCURSAL){
      return; // No verificar si estamos editando una sucursal
    }
    this.sucursalService.getSucursalById(this.nuevaSucursal.codigo_sucursal)
    .subscribe({
      next: (res) => {
        this.sucursalExistente = res.status===Global.OK && res.body ? true : false; // Verificar si la sucursal ya existe
      },
      error: (error) => {
        this.sucursalExistente = false; // Si hay un error, asumimos que la sucursal no existe
      }
    }); 
  }

  actualizarSucursal() {
    const certificado = this.csdActual; // Guardar el certificado actual antes de la llamada al servicio  
    Swal.fire({
      title: 'Confirmar',
      text: '¿Estás seguro de que deseas actualizar esta sucursal?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
          this.isSavingSucursal = true;
          this.sucursalService.updateSucursal(this.nuevaSucursal).subscribe({
              next: (res) => {
                  Swal.fire('Éxito', 'La sucursal ha sido actualizada correctamente.', 'success');
                  this.loadCerts(); // Recargar los certificados para reflejar los cambios
                  this.cerrarModal();
              },
              error: (error) => {
                  this.isSavingSucursal = false; // Asegurarse de que el estado de guardado se restablezca en caso de error
                  console.error('Error al actualizar sucursal:', error);
              }
          });
      }
    });
  }

  eliminaCSD(certificado: Certificado) {
    Swal.fire({
      title: '¿Estás seguro de que deseas eliminar este CSD?',
      text: 'Esto eliminara todas las sucursales asociadas a este CSD.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.certificadoService.deleteCertificado(certificado._id).subscribe({
          next: () => {
            this.swsapienService.deleteCertificado(certificado.no_certificado).subscribe({
                next: () => {
                    this.loadCerts(); // Recargar los certificados para reflejar los cambios
                    Swal.fire('Eliminado', 'El CSD ha sido eliminado correctamente.', 'success');
                }
            }); 
          },
          error: (error) => {
            Swal.fire('Error', 'No se pudo eliminar el CSD. Inténtalo de nuevo más tarde.', 'error');
          }
        });
      }
    });
  }

  borrarSucursal(sucursal: Sucursal): any {
    Swal.fire({
      title: 'Confirmar',
      text: '¿Estás seguro de que deseas eliminar esta sucursal?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSavingSucursal = true;
        this.sucursalService.deleteSucursal(sucursal._id).subscribe({
          next: () => {
            this.isSavingSucursal = false; // Restablecer el estado de guardado
            this.loadCerts(); // Recargar los certificados para reflejar los cambios
            Swal.fire('Eliminado', 'La sucursal ha sido eliminada correctamente.', 'success');
          },
          error: (error) => {
            this.isSavingSucursal = false; // Asegurarse de que el estado de guardado se restablezca en caso de error
            Swal.fire('Error', 'No se pudo eliminar la sucursal. Inténtalo de nuevo más tarde.', 'error');
          }
        });
      }
    });
  }

  onArchivoCerSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoCer = input.files[0];
      this.archivoCerSeleccionado = this.archivoCer.name;
    }
  }
  
  onArchivoKeySeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        this.archivoKey = input.files[0];
        this.archivoKeySeleccionado = this.archivoKey.name;
    }
  }

  
  guardarCSD():void{
    Swal.fire({
      title:'Desea subir estos archivos?',
      text:'El CSD para timbrar es almacenado directametne por el PAC proveedor',
      showCancelButton:true,
      confirmButtonText:'OK'
    })
    .then(respuesta=>{
      if(respuesta.isConfirmed){
        this.isUploading = true;
        const formData = new FormData();
        if(this.archivoCer){
          formData.append('cer',this.archivoCer);
        }else{
          Swal.fire({
            text:'Debe seleccione el archivo .cer',
            icon:'error'
          });
          return;
        }
        if(this.archivoKey){
          formData.append('key',this.archivoKey);
        }else{
          Swal.fire({
            text:'Debe seleccionar el archivo .cer',
            icon:'error'
          });
          return;
        }
        formData.append('ctrsn',this.ctrsn);
        formData.append('usuario', this.idUsuarioCognito);
        this.swsapienService.agregaCertificado(formData)
        .subscribe((res:any)=>{
            this.isUploading = false;
            this.mostrarFormulario = false;
            this.loadCerts();
            this.archivoCerSeleccionado='';
            this.archivoKeySeleccionado='';
            this.archivoCer = null;
            this.archivoKey = null;
            this.ctrsn = '';
            Swal.fire({
                title:'El CSD para timbrar se ha cargado exitosamente',
                icon:'success',
                timer:Global.TIMER_OFF
            });
        })
      }
    });
  }

  eliminarArchivoCer() {
    this.archivoCer = null;
    this.archivoCerSeleccionado = '';
  }

  eliminarArchivoKey() {
    this.archivoKey = null;
    this.archivoKeySeleccionado = '';
  }

  cerrarCSD() {
    this.mostrarFormulario = false;
    this.isUploading = false;
    this.archivoCer = null;
    this.archivoKey = null;
    this.ctrsn = '';
    this.csdSeleccionado = null;
    this.csdActual = {} as Certificado; // Limpiar el certificado actual
    this.nuevaSucursal = new Sucursal('', '', '', '', '','', '','', '');
  }

  getExpirationMessage(expirationDate: Date): string {
    const daysToExpiration = this.getTimeToExpiration(expirationDate);
    
    if (daysToExpiration > 180) {
      return 'Certificado vigente (más de 6 meses restantes)';
    } else if (daysToExpiration > 30) {
      return `Próximo a vencer (${daysToExpiration} días restantes)`;
    } else if (daysToExpiration > 0) {
      return `Vence pronto (${daysToExpiration} días restantes)`;
    } else {
      return 'Certificado vencido';
    }
  }

  getValidityPercentage(startDate: Date, endDate: Date): number {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const remainingDays = this.getTimeToExpiration(endDate);
    
    if (remainingDays <= 0) return 0;
    if (remainingDays >= totalDays) return 100;
    
    const percentage = (remainingDays / totalDays) * 100;
    return Math.max(0, Math.min(100, percentage));
  }

// Método para calcular los días restantes hasta la fecha de expiración
  getTimeToExpiration(expirationDate: Date): number {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const timeDiff = expiration.getTime() - today.getTime();
    const daysToExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysToExpiration;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.editandoSucursal = false;
    this.isSavingSucursal = false;
    this.sucursalAEditar = null;
    this.csdActual = {} as Certificado;
    this.nuevaSucursal = new Sucursal('', '', '', '', '','', '','', '');
    this.sucursalExistente = false; // Resetear validación
    this.btnAction = Global.AGREGAR_SUCURSAL; // Resetear acción
  }

  validarCodigoPostal(event: any): void {
    const input = event.target;
    let value = input.value;
    const cpRegex = /^\d{5}$/;
    this.codigoPostalInvalido = cpRegex.test(value);
  }

  validarTelefono(event: any): void {
    const input = event.target;
    let value = input.value;
    const telefonoRegex = /^\d{10}$/;
    this.telefonoInvalido = !telefonoRegex.test(value);
  }

  // Método para verificar si todos los campos requeridos están completos y válidos
  formularioValido(): boolean {
    // Verificar que todos los campos básicos estén completos
    const camposBasicosCompletos = !!(
      this.nuevaSucursal.codigo_sucursal?.trim() &&
      this.nuevaSucursal.serie?.trim() &&
      this.nuevaSucursal.regimen_fiscal?.trim() &&
      this.nuevaSucursal.direccion?.trim() &&
      this.nuevaSucursal.codigo_postal?.trim() &&
      this.nuevaSucursal.responsable?.trim() &&
      this.nuevaSucursal.telefono?.trim()
    );

    if (!camposBasicosCompletos) {
      return false;
    }

    // Validar formato de código postal
    const codigoPostalValido = /^\d{5}$/.test(this.nuevaSucursal.codigo_postal);
    
    // Validar formato de teléfono
    const telefonoValido = /^\d{10}$/.test(this.nuevaSucursal.telefono);

    if (!codigoPostalValido || !telefonoValido) {
      return false;
    }

    if (this.btnAction === Global.AGREGAR_SUCURSAL) {
      // Para agregar: todos los campos completos y válidos + no debe existir sucursal
      return !this.sucursalExistente;
    } else {
      // Para editar: solo verificar que los campos estén completos y válidos (siempre true si llegamos aquí)
      return true;
    }
  }
}
