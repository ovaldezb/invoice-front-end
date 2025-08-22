import { Producto } from "./producto";

export class VentaProducto{
  constructor(
    public cantidad:number,
    public producto:Producto

  ){}
}