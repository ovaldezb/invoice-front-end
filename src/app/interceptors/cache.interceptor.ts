import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor para prevenir caché de HTTP en todas las peticiones.
 * Agrega headers que fuerzan al navegador y proxies a no cachear las respuestas.
 */
export function CacheInterceptor(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  
  // Agregar timestamp único para peticiones GET (evita caché del navegador)
  let modifiedRequest = request;
  
  if (request.method === 'GET') {
    // Agregar parámetro de timestamp para forzar peticiones únicas
    const timestamp = new Date().getTime();
    const separator = request.url.includes('?') ? '&' : '?';
    
    modifiedRequest = request.clone({
      url: `${request.url}${separator}_t=${timestamp}`,
      setHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } else {
    // Para POST, PUT, DELETE también agregar headers anti-caché
    modifiedRequest = request.clone({
      setHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  return next(modifiedRequest);
}
