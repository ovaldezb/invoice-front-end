import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Certificado } from '../models/certificado';
import { Observable } from 'rxjs';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class CertificadosService {

  constructor(private _http:HttpClient) { }

  insertarCertificado(certificado:Certificado):Observable<any>{
    return this._http.post(Global.urlBackEnd+'certificados',certificado,{observe:'response'});
  }

  getAllCertificados():Observable<any>{
    return this._http.get(Global.urlBackEnd+'certificados',{observe:'response'});
  }

  updateCertificado(certificado:Certificado):Observable<any>{
    return this._http.put(Global.urlBackEnd+'certificados/'+certificado._id,certificado,{observe:'response'});
  }
  deleteCertificado(id:string):Observable<any>{
    return this._http.delete(Global.urlBackEnd+'certificados/'+id,{observe:'response'});
  }
}
