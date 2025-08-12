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
    public mostrarFormulario = false;
    public csdSeleccionado: Certificado | null = null;
    public mostrarModal = false;
    public nuevaSucursal: Sucursal = new Sucursal('','','','','','','');
    public csdActual: Certificado = new Certificado('', '', '', '', new Date(), new Date(), [], '' );
    constructor(private certificadoService: CertificadosService, private sucursalService: SucursalService) {
    // Inicializar el certificado en el constructor
    
   }
  //public certificado:Certificado=new Certificado('Juan Valdez','VABO780711D41','00000258',new Date(),new Date(),['suc01','suc02'],'ovaldez');
ngOnInit(): void {

    this.certificadoService.getAllCertificados()
    .subscribe({
        next: (res) => {
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

  guardarSucursal() {
    if (this.csdActual && this.nuevaSucursal.codigo_sucursal) {
      this.nuevaSucursal.id_certificado = this.csdActual._id; // Asignar el ID del certificado actual a la nueva sucursal
      console.log('certificado actual arriba:', this.csdActual);
      const certificado = this.csdActual; // Guardar el certificado actual antes de la llamada al servicio
      this.sucursalService.insertarSucursal(this.nuevaSucursal).subscribe({
        next: (res) => {
            console.log('certificado actual:', certificado);
            //this.nuevaSucursal.id = res.body.id; // Asignar el ID de la sucursal recién creada
            certificado.sucursales.push(new Sucursal(res.body.id,'', '', '', '', '', ''));
            this.certificadoService.updateCertificado(certificado)
            .subscribe({
                next: (updateRes) => {
                    console.log('Certificado actualizado con nueva sucursal:', updateRes);
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

  cerrarModal() {
    this.mostrarModal = false;
    this.csdActual = {} as Certificado; // Limpiar el certificado actual};
    this.nuevaSucursal = new Sucursal('', '', '', '', '','', '');
  }
}
