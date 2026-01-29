import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './Global';

export interface CheckoutResponse {
    id: string;
    checkout_url: string;
}

@Injectable({
    providedIn: 'root'
})
export class OpenPayService {

    constructor(private _http: HttpClient) { }

    public createCheckout(title: string, quantity: number, unit_price: number, customer: any): Observable<any> {
        const body = {
            title,
            quantity,
            unit_price,
            customer
        };
        return this._http.post(`${Global.urlBackEnd}openpay/create-checkout`, body, { observe: 'response' });
    }
}
