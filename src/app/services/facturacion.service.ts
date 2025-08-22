import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {

  constructor(private http: HttpClient) { }

  getDatosParaFacturar() {
    return this.http.get(Global.urlBackEnd+'datosfactura', { observe: 'response' });
  }

  obtieneDatosVenta(ticket:string) {
    return this.http.get(Global.urlBackEnd+'tapetes/'+ticket,  { observe: 'response' });
  }
}
