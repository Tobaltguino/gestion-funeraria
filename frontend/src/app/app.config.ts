import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

// Importamos el motor de animaciones (Requerido para el Datepicker y Timepicker)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Importamos el token de configuración regional de Material
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    
    // Agregamos las animaciones
    provideAnimationsAsync(),
    
    // Cambiamos a 'es-ES' para forzar el formato 24 horas (Ej: 14:30 en lugar de 2:30 PM)
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
};