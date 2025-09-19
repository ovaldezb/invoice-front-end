import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Global } from './Global';
import { Timbrado } from '../models/timbrado';
import { Receptor } from '../models/receptor';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {

  constructor(private http: HttpClient) { }

  getDatosParaFacturar() {
    return this.http.get(Global.urlDatosFactura, { observe: 'response' });
  }

  obtieneDatosVenta(ticket:string) {
    return this.http.get(Global.urlBackEnd+'tapetes/'+ticket,  { observe: 'response' });
  }

  generaFactura(factura: any) {
    return this.http.post(Global.urlBackEnd+'factura', factura, { observe: 'response' });
  }

  obtieneDatosReceptorByRfc(rfc: string) {
    return this.http.get(Global.urlBackEnd+'receptor/'+rfc, { observe: 'response' });
  }

  guardaReceptor(receptor: Receptor) {
    return this.http.post(Global.urlBackEnd + 'receptor', receptor, { observe: 'response' });
  }

}
