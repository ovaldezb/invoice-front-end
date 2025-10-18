import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Global } from './Global';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {

  constructor(private http: HttpClient) { }

  getEnvironment(): Observable<any> {
    return this.http.get(Global.urlBackEnd + 'environment', { observe: 'response' });
  }
}
