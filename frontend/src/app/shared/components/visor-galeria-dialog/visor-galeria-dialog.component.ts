import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Interfaz que estandariza la data que recibe el modal
export interface VisorDetalle {
  icono: string;
  etiqueta: string;
  valor: string | number;
  uppercase?: boolean; // Para casos como la patente
}

export interface VisorGaleriaData {
  titulo: string;
  imagenes: string[];
  detalles: VisorDetalle[];
}

@Component({
  selector: 'app-visor-galeria-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './visor-galeria-dialog.component.html',
  styleUrls: ['./visor-galeria-dialog.component.scss'] // Reutiliza el SCSS que ya tenías
})
export class VisorGaleriaDialogComponent {
  public dialogRef = inject(MatDialogRef<VisorGaleriaDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as VisorGaleriaData;

  imagenPantallaCompletaIndex: number = -1;

  cerrarDialogo() { this.dialogRef.close(); }
  abrirImagenGrande(index: number) { this.imagenPantallaCompletaIndex = index; }
  cerrarImagenGrande() { this.imagenPantallaCompletaIndex = -1; }

  imagenSiguiente(event: Event) {
    event.stopPropagation();
    if (this.data.imagenes && this.data.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex < this.data.imagenes.length - 1) {
        this.imagenPantallaCompletaIndex++;
      } else {
        this.imagenPantallaCompletaIndex = 0;
      }
    }
  }

  imagenAnterior(event: Event) {
    event.stopPropagation();
    if (this.data.imagenes && this.data.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex > 0) {
        this.imagenPantallaCompletaIndex--;
      } else {
        this.imagenPantallaCompletaIndex = this.data.imagenes.length - 1;
      }
    }
  }
}