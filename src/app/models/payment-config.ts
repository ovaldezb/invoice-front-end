export interface PaymentConfig {
    nombre_pago: string;
    costo: number;
    codigo_sat: string;
    descripcion_sat: string;
    clave_unidad: string;
    unidad: string;
}

export interface PaymentConfigResponse {
    payment_config: PaymentConfig[];
}
