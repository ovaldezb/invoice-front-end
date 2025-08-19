import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Sucursal } from '../models/sucursal';
import { Observable } from 'rxjs/internal/Observable';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {

  constructor(private _http: HttpClient) { }

  insertarSucursal(sucursal: Sucursal): Observable<any> {
    return this._http.post(Global.urlCerticados+'sucursales', sucursal, { observe: 'response' });
  }

  getAllSucursales(): Observable<any> {
    return this._http.get(Global.urlCerticados+'sucursales', { observe: 'response' });
  }

  updateSucursal(sucursal: Sucursal): Observable<any> {
    return this._http.put(Global.urlCerticados + 'sucursales/' + sucursal._id, sucursal, { observe: 'response' });
  }

  deleteSucursal(id: string): Observable<any> {
    return this._http.delete(Global.urlCerticados + 'sucursales/' + id, { observe: 'response' });
  }
}
