import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor inteligente para prevenir caché de HTTP.
 * Aplica estrategias de no-cache solo a endpoints que lo requieren.
 */

// Endpoints que NO deben usar caché
const NO_CACHE_PATTERNS = [
  '/factura',
  '/receptor',
  '/tapetes',
  '/certificado',
  '/folio',
  '/sucursal',
  '/usuario'
];

/**
 * Verifica si una URL requiere prevención de caché
 */
function shouldPreventCache(url: string): boolean {
  return NO_CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

export function CacheInterceptor(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  
  // Solo aplicar no-cache a endpoints específicos
  if (!shouldPreventCache(request.url)) {
    return next(request);
  }
  
  let modifiedRequest = request;
  
  if (request.method === 'GET') {
    // Agregar timestamp único para peticiones GET
    // El timestamp es suficiente para prevenir caché sin necesidad de headers
    const timestamp = Date.now();
    const separator = request.url.includes('?') ? '&' : '?';
    
    modifiedRequest = request.clone({
      url: `${request.url}${separator}_t=${timestamp}`
    });
  }
  // Para otros métodos (POST, PUT, DELETE) no es necesario agregar nada
  // ya que por naturaleza no se cachean

  return next(modifiedRequest);
}
