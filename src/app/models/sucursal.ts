export class Sucursal {
  constructor(
    public _id: string,
    public id_certificado: string,
    public codigo_sucursal: string,
    public serie: string,
    public direccion: string,
    public codigo_postal: string,
    public responsable: string,
    public telefono: string
  ) {}
}