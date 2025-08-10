export class Certificado {
    constructor(
    public id: string,
    public nombre: string,
    public rfc: string,
    public no_certificado: string,
    public desde: Date,
    public hasta: Date,
    public sucursales: string[],
    public usuario:string) { }
}