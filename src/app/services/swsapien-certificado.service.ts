import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class SwsapienCertificadoService {

  constructor(private httpClient: HttpClient) { }

  getCertificadosByRFC(rfc:string): Observable<any> {
    return this.httpClient.get(`${Global.urlCertif}/rfc/${rfc}`, { observe: 'response' });
  }

  //Crear un metodo post que recibiba un archivo .cer, un archivo .key y una constraseña y los envie a un endpoint Global.urlCertif
  addCertificado(certificado: FormData): Observable<any> {
    return this.httpClient.post(Global.urlCertif, certificado, { observe: 'response' });
  }

  deleteCertificado(id: string): Observable<any> {
    return this.httpClient.delete(`${Global.urlCertif}/${id}`, { observe: 'response' });
  }
}
