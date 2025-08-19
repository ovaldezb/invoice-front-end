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
    public nuevaSucursal: Sucursal = new Sucursal('','','','','','','','');
    public csdActual: Certificado = new Certificado('', '', '', '', new Date(), new Date(), [], '' );
    public editandoSucursal: boolean = false;
    public sucursalAEditar: Sucursal | null = null;
    public btnAction: string = 'Agregar Sucursal'; // Botón de acción para agregar o editar sucursal
    private archivoCer: File | null = null;
    private archivoKey: File | null = null;
    public ctrsn: string = ''; 
    public isUploading:boolean = true;
    public swsapienCertificado: SwsapienCertificado = new SwsapienCertificado('', '', '', false, '', new Date(), new Date(), '');
    constructor(private certificadoService: CertificadosService, 
        private sucursalService: SucursalService,
        private swsapienService: SwsapienCertificadoService) {}

    ngOnInit(): void {
        this.loadCerts();
    }
    loadCerts(): void {
        this.isLoadingCerts = true; // Cambiar el estado de carga a verdadero
        this.certificadoService.getAllCertificados()
        .subscribe({
            next: (res) => {
                this.isLoadingCerts = false; // Cambiar el estado de carga a falso
                this.certificados = res.body || [];            
            },
            error: (error) => {
                console.error('Error al obtener certificados:', error);
            }
    });

    

    /*if(this.certificadoService){
        this.certificadoService.insertarCertificado(this.certificado)
        .subscribe({
            next: (response) => {
                console.log('Certificado insertado:', response);
            },
            error: (error) => {
                console.error('Error al insertar certificado:', error);
            }
        });
    }else{
        console.error('El servicio de certificados no está disponible.');
    }    */
}  
  
  fetchCertificate(rfc:string):void{
    this.swsapienService.getCertificadosByRFC(rfc)
    .subscribe(res=>{
      if(res.status==Global.OK && res.body.data.length >0){
        this.swsapienCertificado = res.body.data[0]
      }
    })
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
    this.mostrarModal = true;
  }

  editarSucursal(certificado: Certificado, sucursal: Sucursal) {
    this.editandoSucursal = true;
    this.nuevaSucursal = sucursal;
    this.btnAction = 'Editar Sucursal'; // Cambiar el texto del botón a "Editar Sucursal"
    this.mostrarModal = true;
    this.csdActual = certificado; // Asignar el certificado actual para editar la sucursal
  }

  guardaEditarSucursal() {
    if (this.editandoSucursal) {
      this.actualizarSucursal();
    } else {
      this.guardarSucursal();
    }
  }

  guardarSucursal() {
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
            this.sucursalService.insertarSucursal(this.nuevaSucursal).subscribe({
                next: (res) => {
                    certificado.sucursales.push(new Sucursal(res.body.id,'', '', '', '', '', '',''));
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
            }); // Eliminar también del servicio externo
          },
          error: (error) => {
            console.error('Error al eliminar CSD:', error);
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
            console.error('Error al eliminar sucursal:', error);
          }
        });
      }
    });
  }

  onArchivoCerSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoCer = input.files[0];
    }
  }
  
  onArchivoKeySeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoKey = input.files[0];
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
        this.swsapienService.addCertificado(formData)
        .subscribe((res:any)=>{
            console.log(res.body);
            const certificado = new Certificado(
              '',
              res.body.nombre,
              res.body.rfc,
              res.body.no_certificado,
              res.body.desde,
              res.body.hasta,
              [],
              'ovaldez'
            );
            console.log(certificado);
            this.certificadoService.insertarCertificado(certificado)
            .subscribe({
              next: (insertRes) => {
                console.log('Certificado insertado:', insertRes);
                this.isUploading = false;
                this.mostrarFormulario = false;
                Swal.fire({
                    title:'El CSD para timbrar se ha cargado exitosamente',
                    icon:'success',
                    timer:Global.TIMER_OFF
                });
              }
            });
        })
      }
    });
  }

  // Métodos para el semáforo de expiración
  getTimeToExpiration(expirationDate: Date): number {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const timeDifference = expiration.getTime() - today.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
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

  cerrarModal() {
    this.mostrarModal = false;
    this.editandoSucursal = false;
    this.isSavingSucursal = false;
    this.sucursalAEditar = null;
    this.csdActual = {} as Certificado; // Limpiar el certificado actual};
    this.nuevaSucursal = new Sucursal('', '', '', '', '','', '','');
  }
}
