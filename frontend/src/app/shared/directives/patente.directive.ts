import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Directive({
  selector: '[appPatente]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PatenteDirective),
      multi: true
    }
  ]
})
export class PatenteDirective implements ControlValueAccessor {
  private onChange: any;
  private onTouched: any;

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = this.el.nativeElement;
    
    // 1. Quitar todo lo que no sea letra o número y convertir a mayúscula
    let valorLimpio = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 2. Limitar a un máximo de 6 caracteres (sin contar guiones)
    if (valorLimpio.length > 6) {
      valorLimpio = valorLimpio.substring(0, 6);
    }

    // 3. Aplicar el formato XX-XX-XX
    let valorFormateado = valorLimpio;
    if (valorLimpio.length > 4) {
      valorFormateado = `${valorLimpio.substring(0, 2)}-${valorLimpio.substring(2, 4)}-${valorLimpio.substring(4)}`;
    } else if (valorLimpio.length > 2) {
      valorFormateado = `${valorLimpio.substring(0, 2)}-${valorLimpio.substring(2)}`;
    }

    // 4. Escribir el valor en el input y notificar al FormGroup
    input.value = valorFormateado;
    if (this.onChange) {
      this.onChange(valorFormateado);
    }
  }

  // --- Métodos de ControlValueAccessor (Conexión con Angular Forms) ---
  writeValue(value: any): void {
    if (value) {
      let valorLimpio = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let valorFormateado = valorLimpio;
      if (valorLimpio.length > 4) {
        valorFormateado = `${valorLimpio.substring(0, 2)}-${valorLimpio.substring(2, 4)}-${valorLimpio.substring(4)}`;
      } else if (valorLimpio.length > 2) {
        valorFormateado = `${valorLimpio.substring(0, 2)}-${valorLimpio.substring(2)}`;
      }
      this.el.nativeElement.value = valorFormateado;
    } else {
      this.el.nativeElement.value = '';
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.el.nativeElement.disabled = isDisabled; }
}