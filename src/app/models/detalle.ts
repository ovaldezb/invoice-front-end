export class Detalle{
    constructor(
        public claveproducto: string,
        public descripcio: string,
        public claveunidad: string,
        public cantidad: number,
        public precio: number,
        public importe: number,
        public unidad: string
    ) {}
}
