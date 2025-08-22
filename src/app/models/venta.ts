import { VentaProducto } from "./ventaproducto";

export class Venta{
  constructor(
    public _id:string,
    public ventaProducto:VentaProducto[],
    public fechaVenta:Date,
    public iva:number,
    public subTotal:number,
    public total:number,
    public descuento:number,
    public noTicket:string,
    public formaPago: string,
    //public cajero:IUser,
    //public efectivo: number,
    public cambio: number,
    public banco:string,
    public noAprobacion:string,
    public noTransaccion:string,
    public isDevolucion:boolean,
    public isFacturado:boolean,
    public isCorteCaja:boolean,
    public fechaFacturado:Date,
    public sucursal:string,
    //public tipoPago:string,
  ){}
}