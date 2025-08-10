export interface CSD {
  id: string;
  nombreCertificado: string;
  fechaVencimiento: Date;
  activo: boolean;
  sucursales: Sucursal[];
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  codigoPostal: string;
  responsable: string;
  telefono: string;
}
