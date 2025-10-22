import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { fetchAuthSession } from 'aws-amplify/auth';

export function AuthInterceptor(
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return from(fetchAuthSession()).pipe(
    switchMap(session => {
      if (session.tokens?.idToken) {
        const authReq = request.clone({
          setHeaders: {
            Authorization: `Bearer ${session.tokens.idToken.toString()}`
          }
        });
        return next(authReq);
      }
      return next(request);
    })
  );
}
