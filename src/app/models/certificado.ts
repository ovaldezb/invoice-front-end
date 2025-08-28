import { Sucursal } from "./sucursal";

export class Certificado {
    constructor(
    public _id: string,
    public nombre: string,
    public rfc: string,
    public no_certificado: string,
    public desde: Date,
    public hasta: Date,
    public sucursales: Sucursal[],
    public usuario:string
    ) { }
}