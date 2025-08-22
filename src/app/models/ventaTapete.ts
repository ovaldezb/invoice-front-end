import { Detalle } from "./detalle";
import { Ticket } from "./ticket";

export class VentaTapete {
  constructor(
    public sucursal: string,
    public ticket: Ticket,
    public detalle: Detalle[],
    public pago: string[]
  ) {}
}