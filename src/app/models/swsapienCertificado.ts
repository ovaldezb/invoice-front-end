export class SwsapienCertificado{
    constructor(
        public issuer_rfc:string,
        public certificate_number:string,
        public csd_certificatestring:string,
        public is_active: boolean,
        public issuer_business_name:string,
        public valid_from:Date,
        public valid_to:Date,
        public certificate_type:string
    ){}
}