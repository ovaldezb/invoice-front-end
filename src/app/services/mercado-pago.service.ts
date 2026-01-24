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
}
