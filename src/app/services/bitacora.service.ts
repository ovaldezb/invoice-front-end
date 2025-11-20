import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BitacoraResponse } from '../models/bitacora';
import { Global } from './Global';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {
  private readonly BASE_URL = Global.urlBackEnd;

  constructor(private readonly http: HttpClient) { }

  /**
   * Obtiene los registros de bitácora en un rango de fechas
   * @param fechaInicio Fecha de inicio en formato YYYY-MM-DD
   * @param fechaFin Fecha de fin en formato YYYY-MM-DD
   * @returns Observable con la respuesta de bitácora
   */
  getBitacora(fechaInicio: string, fechaFin: string): Observable<HttpResponse<BitacoraResponse>> {
    const url = `${this.BASE_URL}/bitacora?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    return this.http.get<BitacoraResponse>(url, { observe: 'response' });
  }

  /**
   * Obtiene los registros de bitácora del mes actual
   * @returns Observable con la respuesta de bitácora
   */
  getBitacoraMesActual(): Observable<HttpResponse<BitacoraResponse>> {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const fechaInicio = this.formatearFecha(primerDia);
    const fechaFin = this.formatearFecha(ultimoDia);

    return this.getBitacora(fechaInicio, fechaFin);
  }

  /**
   * Obtiene los registros de bitácora de los últimos N días
   * @param dias Número de días hacia atrás
   * @returns Observable con la respuesta de bitácora
   */
  getBitacoraUltimosDias(dias: number): Observable<HttpResponse<BitacoraResponse>> {
    const hoy = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(hoy.getDate() - dias);

    return this.getBitacora(
      this.formatearFecha(fechaInicio),
      this.formatearFecha(hoy)
    );
  }

  /**
   * Formatea una fecha a formato YYYY-MM-DD
   * @param fecha Fecha a formatear
   * @returns String con formato YYYY-MM-DD
   */
  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
