import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CSD, Sucursal } from '../../interfaces/csd.interface';
import { CertificadosService } from '../../services/certificados.service';
import { Certificado } from '../../models/certificado';



@Component({
  selector: 'app-configura-csd',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configura-csd.component.html',
})
export class ConfiguraCsdComponent implements OnInit{
  public certificado:Certificado;
  public certificados:Certificado[] = [];
  constructor(private certificadoService:CertificadosService) {
    // Inicializar el certificado en el constructor
    this.certificado = new Certificado(
      '',
      'Juan Valdez',
      'VABO780711D41',
      '00000258',
      new Date(),
      new Date(),
      ['suc01', 'suc02'],
      'ovaldez'
    );
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
  
    mostrarFormulario = false;
    csdSeleccionado: CSD | null = null;
    mostrarModal = false;
    nuevaSucursal: Sucursal = {
        id: '',
        nombre: '',
        direccion: '',
        codigoPostal: '',
        responsable: '',
        telefono: ''
    };
    csdActual: CSD | null = null;  // Agregar esta propiedad
    
  // Datos de ejemplo (reemplazar con llamadas a servicios)
  listaCSD: CSD[] = [
    {
      id: '1',
      nombreCertificado: 'CSD Principal',
      fechaVencimiento: new Date('2024-12-31'),
      activo: true,
      sucursales: [
        { id: '1', nombre: 'Sucursal Centro', direccion: 'Centro 123' , codigoPostal: '12345', responsable: 'Juan Perez', telefono: '555-1234' },
      ]
    },
    {
      id: '2',
      nombreCertificado: 'CSD Dos',
      fechaVencimiento: new Date('2024-12-31'),
      activo: true,
      sucursales: [
        { id: '1', nombre: 'Sucursal Santa Fe', direccion: 'Centro 123' , codigoPostal: '12345', responsable: 'Maria Lopez', telefono: '555-5678' }
      ]
    },
    {
      id: '3',
      nombreCertificado: 'CSD Tres',
      fechaVencimiento: new Date('2024-12-31'),
      activo: true,
      sucursales: [
        { id: '1', nombre: 'Sucursal Santa Fe', direccion: 'Centro 123' , codigoPostal: '12345', responsable: 'Maria Lopez', telefono: '555-5678' },
        { id: '2', nombre: 'Sucursal Norte', direccion: 'Norte 456' , codigoPostal: '67890', responsable: 'Carlos Gomez', telefono: '555-8765' },
        { id: '3', nombre: 'Sucursal Sur', direccion: 'Sur 789', codigoPostal: '54321', responsable: 'Ana Torres', telefono: '555-4321' },
        {          id: '4',
          nombre: 'Sucursal Sur 2',
          direccion: 'Sur 789',
          codigoPostal: '54321',
          responsable: 'Ana Torres',
          telefono: '555-4321'},
          { id: '5', nombre: 'Sucursal Sur 3', direccion: 'Sur 789', codigoPostal: '54321', responsable: 'Ana Torres', telefono: '555-4321' },
          {id: '6', nombre: 'Sucursal Sur 4', direccion: 'Sur 789', codigoPostal: '54321', responsable: 'Ana Torres', telefono: '555-4321' },
          {id: '7', nombre: 'Sucursal Sur 5', direccion: 'Sur 789', codigoPostal: '54321', responsable: 'Ana Torres', telefono: '555-4321'},
          {id: '8', nombre: 'Sucursal Sur 6', direccion: 'Sur 789', codigoPostal: '54321', responsable: 'Ana Torres', telefono: '555-4321'}
      
        ]
    },
    {
      id: '4',
      nombreCertificado: 'CSD Dos',
      fechaVencimiento: new Date('2024-12-31'),
      activo: true,
      sucursales: [
        { id: '1', nombre: 'Sucursal Santa Fe', direccion: 'Centro 123', codigoPostal: '12345', responsable: 'Maria Lopez', telefono: '555-5678' }
      ]
    },
    {
      id: '5',
      nombreCertificado: 'CSD Dos',
      fechaVencimiento: new Date('2024-12-31'),
      activo: true,
      sucursales: [
        { id: '1', nombre: 'Sucursal Santa Fe', direccion: 'Centro 123' , codigoPostal: '12345', responsable: 'Maria Lopez', telefono: '555-5678' }
      ]
    },
    {
      id: '6',
      nombreCertificado: 'CSD Dos',
      fechaVencimiento: new Date('2024-12-31'),
      activo: true,
      sucursales: [
        { id: '1', nombre: 'Sucursal Santa Fe', direccion: 'Centro 123' , codigoPostal: '12345', responsable: 'Maria Lopez', telefono: '555-5678' }
      ]
    }
  ];

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.csdSeleccionado = null;
  }

  seleccionarCSD(csd: CSD) {
    if (this.csdSeleccionado?.id === csd.id) {
      this.csdSeleccionado = null;
    } else {
      this.csdSeleccionado = csd;
    }
  }

  guardarCSD() {
    // Implementar lógica de guardado
    this.mostrarFormulario = false;
  }

  agregarSucursal(csd: CSD) {
    this.csdActual = csd;
    this.mostrarModal = true;
    // Generar un ID único para la nueva sucursal
    this.nuevaSucursal.id = Date.now().toString();
  }

  guardarSucursal() {
    if (this.csdActual && this.nuevaSucursal.nombre) {
      // Agregar la nueva sucursal al CSD actual
      this.csdActual.sucursales.push({...this.nuevaSucursal});
      this.cerrarModal();
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.csdActual = null;
    this.nuevaSucursal = {
      id: '',
      nombre: '',
      direccion: '',
      codigoPostal: '',
      responsable: '',
      telefono: ''
    };
  }
}
