import { HttpHandlerFn, HttpRequest } from '@angular/common/http';

export function corsInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  // Don't modify Content-Type for FormData requests (file uploads)
  const isFormData = req.body instanceof FormData;
  
  const modifiedReq = req.clone({
    setHeaders: {
      ...(!isFormData ? {
        'Content-Type': 'application/json',
      } : {}),
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    withCredentials: false
  });
  return next(modifiedReq);
}
