export interface RegistroBitacora {
  _id: string;
  ticket: string;
  rfc: string;
  rfcEmisor?: string; // RFC del emisor de la factura
  email: string;
  mensaje: string;
  status: 'exito' | 'error' | 'warning' | 'info';
  traceback: string;
  timestamp: string;
}

export interface BitacoraResponse {
  data: RegistroBitacora[];
  total: number;
}
