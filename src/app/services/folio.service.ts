import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Folio } from '../models/folio';
import { Observable } from 'rxjs';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class FolioService {

  constructor(private http:HttpClient) { }

  addFolio(folio:Folio):Observable<any>{
    return this.http.post(Global.urlBackEnd+'folio', folio, { observe: 'response' });
  }

  updateFolio(body:any):Observable<any>{
    return this.http.put(Global.urlBackEnd+'folio', body, { observe: 'response' });
  }

  getFolioBySucursal(idSucursal:string):Observable<any>{
    return this.http.get(Global.urlBackEnd+'folio/'+idSucursal, { observe: 'response' });
  }
}
