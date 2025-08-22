export class Ticket {
  constructor(
    public noVenta: string,
    public fecha: string,
    public subtotal: number,
    public impuesto: number,
    public total: number,
    public estado: number
  ) {}
  
}
