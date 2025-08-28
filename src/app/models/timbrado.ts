import { Concepto } from "./conceptos"
import { Emisor } from "./emisor"
import { Impuestos } from "./impuestos"
import { Receptor } from "./receptor"

export class Timbrado{
  constructor(
    public Version:String,
    public Serie: String,
    public Folio: String,
    public Fecha: String,
    public FormaPago: string,
    public CondicionesDePago: String,
    public SubTotal: number,
    public Descuento: number,
    public Moneda: String,
    public TipoCambio: number,
    public Total: number,
    public TipoDeComprobante: String,
    public Exportacion: String,
    public MetodoPago: String,
    public LugarExpedicion: String,
    public Emisor: Emisor,
    public Receptor: Receptor,
    public Conceptos: Concepto[],
    public Impuestos: Impuestos,
    public fechaFacturado?:Date
  ){}
}