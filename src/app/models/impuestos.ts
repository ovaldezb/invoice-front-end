import { Retenciones } from "./retenciones";
import { Traslados } from "./traslados";

export class Impuestos{
  constructor(
    public Traslados: Traslados[],
    //public Retenciones: Retenciones[],
    //public TotalImpuestosRetenidos: number,
    public TotalImpuestosTrasladados: number,
    
  ){}
}