import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appRutFormat]',
  standalone: true
})
export class RutFormatDirective {
  private ngControl = inject(NgControl);

  // Recibimos el evento completo en lugar de solo el value
  @HostListener('input', ['$event'])
  onInput(event: Event) {
    // Le indicamos a TypeScript que el objetivo es un input real
    const inputElement = event.target as HTMLInputElement;
    
    if (!inputElement || !inputElement.value) return;

    const value = inputElement.value;

    // 1. Limpiamos todo lo que no sea número o la letra K
    const valorLimpio = value.replace(/[^0-9kK]/g, '').toUpperCase();
    
    // 2. Lo formateamos con puntos y guion
    const valorFormateado = this.formatearRut(valorLimpio);
    
    // 3. Actualizamos el input
    this.ngControl.control?.setValue(valorFormateado, { emitEvent: false });
  }

  private formatearRut(rutLimpio: string): string {
    if (rutLimpio.length <= 1) return rutLimpio;

    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);
    
    let cuerpoFormateado = '';
    for (let i = cuerpo.length; i > 0; i -= 3) {
      const trozo = cuerpo.slice(Math.max(0, i - 3), i);
      cuerpoFormateado = trozo + (cuerpoFormateado ? '.' + cuerpoFormateado : '');
    }

    return `${cuerpoFormateado}-${dv}`;
  }
}