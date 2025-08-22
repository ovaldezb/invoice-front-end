import { ImpuestosConcepto } from "./ImpuestosConcepto"

export class Concepto{
  constructor(
    public ClaveProdServ: String,
    public NoIdentificacion: String,
    public Cantidad: String,
    public ClaveUnidad: String,
    public Unidad: String,
    public Descripcion: String,
    public ValorUnitario: String,
    public Importe: String,
    public Descuento: String,
    public ObjetoImp: String,
    public Impuestos: ImpuestosConcepto
  ){}
}