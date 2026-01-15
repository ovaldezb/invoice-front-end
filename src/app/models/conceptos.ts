import { ImpuestosConcepto } from "./impuestosConcepto"

export class Concepto {
  constructor(
    public Impuestos: ImpuestosConcepto,
    public ClaveProdServ: string,
    public Cantidad: number,
    public ClaveUnidad: string,
    public Unidad: string,
    public Descripcion: string,
    public ValorUnitario: number,
    public Importe: number,
    public Descuento: number,
    public ObjetoImp: string,
  ) { }
}