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
    return this._http.post(Global.urlCerticados+'certificados',certificado,{observe:'response'});
  }

  getAllCertificados():Observable<any>{
    return this._http.get(Global.urlCerticados+'certificados',{observe:'response'});
  }

  updateCertificado(certificado:Certificado):Observable<any>{
    return this._http.put(Global.urlCerticados+'certificados/'+certificado._id,certificado,{observe:'response'});
  }
  deleteCertificado(id:string):Observable<any>{
    return this._http.delete(Global.urlCerticados+'certificados/'+id,{observe:'response'});
  }
}
