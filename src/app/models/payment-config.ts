export interface PaymentConfig {
    nombre_pago: string;
    cantidad: number;
    codigo_sat: string;
    descripcion_sat: string;
}

export interface PaymentConfigResponse {
    payment_config: PaymentConfig[];
}
