import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sucursal } from '../../models/sucursal';
import { CertificadosService } from '../../services/certificados.service';
import { Certificado } from '../../models/certificado';
import { SucursalService } from '../../services/sucursal.service';

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
    public nuevaSucursal: Sucursal = new Sucursal('','','','','','','');
    public csdActual: Certificado = new Certificado('', '', '', '', new Date(), new Date(), [], '' );
    public editandoSucursal: boolean = false;
    public sucursalAEditar: Sucursal | null = null;
    constructor(private certificadoService: CertificadosService, private sucursalService: SucursalService) {}
  
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

  guardarCSD() {
    // Implementar lógica de guardado
    this.mostrarFormulario = false;
  }

  agregarSucursal(certificado: Certificado) {
    this.csdActual = certificado;
    this.mostrarModal = true;
  }

  editarSucursal(sucursal: Sucursal) {
    this.editandoSucursal = true;
    this.sucursalAEditar = sucursal;
    this.nuevaSucursal = { ...sucursal }; // Copiar los datos de la sucursal para editar
    this.mostrarModal = true;
  }

  guardarSucursal() {
    this.isSavingSucursal = true;
    if (this.csdActual && this.nuevaSucursal.codigo_sucursal) {
      this.nuevaSucursal.id_certificado = this.csdActual._id; // Asignar el ID del certificado actual a la nueva sucursal
      const certificado = this.csdActual; // Guardar el certificado actual antes de la llamada al servicio
      this.sucursalService.insertarSucursal(this.nuevaSucursal).subscribe({
        next: (res) => {
            certificado.sucursales.push(new Sucursal(res.body.id,'', '', '', '', '', ''));
            this.certificadoService.updateCertificado(certificado)
            .subscribe({
                next: (updateRes) => {
                    //console.log('Certificado actualizado con nueva sucursal:', updateRes);
                    this.isSavingSucursal = false;
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
  }

  borrarSucursal(sucursal: Sucursal): any {
    // Implementar lógica de borrado
  } 

  cerrarModal() {
    this.mostrarModal = false;
    this.editandoSucursal = false;
    this.sucursalAEditar = null;
    this.csdActual = {} as Certificado; // Limpiar el certificado actual};
    this.nuevaSucursal = new Sucursal('', '', '', '', '','', '');
  }
}
