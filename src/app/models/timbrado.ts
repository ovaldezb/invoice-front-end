import { Concepto } from "./conceptos"
import { Emisor } from "./emisor"
import { Impuestos } from "./impuestos"
import { Receptor } from "./receptor"

export class Timbrado{
  constructor(
    public id:String,
    public Version:String,
    public FormaPago: String,
    public Serie: String,
    public Folio: String,
    public Fecha: String,
    public MetodoPago: String,
    public Sello: String,
    public NoCertificado:String ,
    public Certificado: String,
    public CondicionesDePago: String,
    public SubTotal: String,
    public Descuento: String,
    public Moneda: String,
    public TipoCambio: String,
    public Total: String,
    public TipoDeComprobante: String,
    public Exportacion: String,
    public LugarExpedicion: String,
    public Emisor: Emisor,
    public Receptor: Receptor,
    public Conceptos: Concepto[],
    public Impuestos: Impuestos,
    public fechaFacturado?:Date
  ){}
}