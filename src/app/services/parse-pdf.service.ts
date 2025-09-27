import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Global } from './Global';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ParsePdfService {

  constructor(private http: HttpClient) { }

  parsePdf(pdf: FormData): Observable<any> {
    return this.http.post(Global.urlBackEnd + 'parsea-pdf', pdf, { observe: 'response' });
  }
}
