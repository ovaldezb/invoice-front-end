import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Global } from './Global';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class UsuariosService {

  constructor(private _http: HttpClient) { }

  getUsuarios() {
    return this._http.get(Global.urlUsuario, { observe: 'response' });
  }

  addUsuario(usuario: any): Observable<any> {
    return this._http.post(Global.urlUsuario, usuario, { observe: 'response' });
  }

  deleteUsuario(idUsuario: string): Observable<any> {
    return this._http.delete(`${Global.urlUsuario}/${idUsuario}`, { observe: 'response' });
  }

  updateUsuario(usuario: any): Observable<any> {
    return this._http.put(`${Global.urlUsuario}/${usuario.id}`, usuario, { observe: 'response' });
  }
}
