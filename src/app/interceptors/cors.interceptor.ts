import { HttpHandlerFn, HttpRequest } from '@angular/common/http';

export function corsInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  const modifiedReq = req.clone({
    withCredentials: false,
    setHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  return next(modifiedReq);
}
