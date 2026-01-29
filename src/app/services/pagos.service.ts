import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './Global';

@Injectable({
    providedIn: 'root'
})
export class PagosService {

    constructor(private _http: HttpClient) { }

    public getLastPayments(): Observable<any> {
        return this._http.get(`${Global.urlBackEnd}payments`, { observe: 'response' });
    }

    public getPaymentConfigs(): Observable<any> {
        return this._http.get(`${Global.urlBackEnd}payments-config`, { observe: 'response' });
    }

    public savePaymentConfigs(configs: any[]): Observable<any> {
        const body = { payment_config: configs };
        return this._http.post(`${Global.urlBackEnd}payments-config`, body, { observe: 'response' });
    }

    public getInvoiceCount(month?: number, year?: number): Observable<any> {
        let url = `${Global.urlBackEnd}invoices/count`;
        const params = [];
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);

        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        return this._http.get(url, { observe: 'response' });
    }
}
