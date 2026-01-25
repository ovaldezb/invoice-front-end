import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './Global';

export interface PreferenceResponse {
    id: string;
    init_point: string;
    sandbox_init_point: string;
}

@Injectable({
    providedIn: 'root'
})
export class MercadoPagoService {

    constructor(private _http: HttpClient) { }

    public createPreference(title: string, quantity: number, unit_price: number): Observable<any> {
        const body = {
            title,
            quantity,
            unit_price
        };
        return this._http.post(`${Global.urlBackEnd}mercado-pago/create-preference`, body, { observe: 'response' });
    }

    public getLastPayments(): Observable<any> {
        return this._http.get(`${Global.urlBackEnd}mercado-pago/payments`, { observe: 'response' });
    }

    public getPaymentConfigs(): Observable<any> {
        return this._http.get(`${Global.urlBackEnd}mercado-pago/configuration`, { observe: 'response' });
    }

    public savePaymentConfigs(configs: any[]): Observable<any> {
        const body = { payment_config: configs };
        return this._http.post(`${Global.urlBackEnd}mercado-pago/configuration`, body, { observe: 'response' });
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
