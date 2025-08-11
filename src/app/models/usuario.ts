export class Usuario {
    constructor(
        public id: string,
        public nombre: string,
        public apellido: string,
        public razon_social: string,
        public telefono: string,
        public email: string,
        public password: string,
        public confirm_email: string,
        public confirm_password: string
    ) { }
}