import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class SwsapienCertificadoService {

  constructor(private httpClient: HttpClient) { }

  agregaCertificado(certificado: FormData): Observable<any> {
    return this.httpClient.post(Global.urlBackEnd + 'maneja-certificado', certificado, { observe: 'response' });
  }

  deleteCertificado(no_certificado: string): Observable<any> {
    return this.httpClient.delete(Global.urlBackEnd + 'maneja-certificado/' + no_certificado, { observe: 'response' });
  }

}
