import { Retenciones } from "./retenciones";
import { Traslados } from "./traslados";

export class ImpuestosConcepto{
  constructor(
    public Traslados:Traslados[],
    public Retenciones:Retenciones[]
  ){}
}