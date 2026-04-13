import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Global } from './Global';

export interface PaymentResponse {
    id: string;
    status: string;
    receipt_no: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClipService {

    constructor(private _http: HttpClient) { }

    public processPayment(title: string, amount: number, cardTokenId: string, customer: any): Observable<any> {
        const body = {
            title,
            unit_price: amount,
            card_token_id: cardTokenId,
            customer
        };
        return this._http.post(`${Global.urlBackEnd}clip/create-checkout`, body, { observe: 'response' });
    }
}
