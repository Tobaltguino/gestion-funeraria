import { Injectable, inject, Component, Inject } from '@angular/core';
import { MatSnackBar, MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

/* ==========================================================
   1. COMPONENTE VISUAL DEL TOAST (HTML Enriquecido)
   ========================================================== */
@Component({
  selector: 'app-custom-toast',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; min-width: 250px;">
      
      <!-- Contenedor del Ícono y el Texto -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 4px 8px;">
        <mat-icon [style.color]="data.color">{{ data.icon }}</mat-icon>
        <span style="color: #000000; font-weight: 500; font-size: 14px;">{{ data.message }}</span>
      </div>

      <!-- Botón de Cerrar (X) -->
      <button (click)="cerrar()" 
              [style.color]="data.color" 
              style="background: transparent; border: none; font-weight: bold; cursor: pointer; font-size: 15px; padding-left: 12px;">
        X
      </button>
      
    </div>
  `
})
export class CustomToastComponent {
  private snackBarRef = inject(MatSnackBarRef);
  
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}

  cerrar() {
    this.snackBarRef.dismiss();
  }
}

/* ==========================================================
   2. EL SERVICIO LOGICO
   ========================================================== */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private show(message: string, panelClass: string, icon: string, color: string, duration = 4000) {
    this.snackBar.openFromComponent(CustomToastComponent, {
      duration: duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass],
      data: { message, icon, color } 
    });
  }

  success(message: string) {
    this.show(message, 'toast-success', 'check_circle', '#166534');
  }

  error(message: string) {
    this.show(message, 'toast-error', 'cancel', '#991b1b', 5000);
  }

  warning(message: string) {
    this.show(message, 'toast-warning', 'warning', '#92400e');
  }

  // --- NUEVO MÉTODO INFO ---
  info(message: string) {
    // Info en color Azul
    this.show(message, 'toast-info', 'info', '#1e40af');
  }
}