export class Receptor{
  constructor(
    public Rfc:string,
    public Nombre:string,
    public DomicilioFiscalReceptor:string,
    public RegimenFiscalReceptor:string,
    public UsoCFDI:string,
    public _id?:string,
    public email?:string
  ){}
}