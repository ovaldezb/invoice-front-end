import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class TimbresService {

  constructor(private _http: HttpClient) { }

  public getFacturasEmitidasByMes(usuario:string, desde:string, hasta:string):Observable<any> {
    return this._http.get(`${Global.urlBackEnd}timbres/${usuario}?desde=${desde}&hasta=${hasta}`, { observe: 'response' });
  }
}
