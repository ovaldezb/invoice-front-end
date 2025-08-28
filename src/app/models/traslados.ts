export class Traslados{
  constructor(
    public Base:number,
    public Impuesto:string,
    public TipoFactor:string,
    public TasaOCuota:string,
    public Importe:number
  ){}
}