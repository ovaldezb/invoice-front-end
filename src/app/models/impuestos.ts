import { Retenciones } from "./retenciones";
import { Traslados } from "./traslados";

export class Impuestos{
  constructor(
    public TotalImpuestosTrasladados: String,
    public TotalImpuestosRetenidos: String,
    public Retenciones: Retenciones[],
    public Traslados: Traslados[]
  ){}
}