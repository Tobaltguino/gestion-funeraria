import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

// 1. Importamos el token de configuración regional de Material
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    
    // 2. Agregamos el proveedor para el idioma español (es-CL para formato Día/Mes/Año)
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' }
  ]
};