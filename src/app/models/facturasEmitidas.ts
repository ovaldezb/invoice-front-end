export class FacturaEmitida {
    constructor(
        public _id: string,
        public cadenaOriginalSAT: string,
        public cfdi: string,
        public fechaTimbrado: Date,
        public noCertificadoCFDI: string,
        public noCertificadoSAT: string,
        public qrCode: string,
        public selloCFDI: string,
        public selloSAT: string,
        public uuid: string,
        public sucursal: string,
        public idCertificado: string,
    ) { }
}