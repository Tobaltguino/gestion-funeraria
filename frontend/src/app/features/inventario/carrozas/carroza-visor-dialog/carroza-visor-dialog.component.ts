import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Carroza } from '../models/carroza.interface';

@Component({
  selector: 'app-carroza-visor-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './carroza-visor-dialog.component.html',
  styleUrl: './carroza-visor-dialog.component.scss'
})
export class CarrozaVisorDialogComponent {
  public dialogRef = inject(MatDialogRef<CarrozaVisorDialogComponent>);
  public carroza = inject(MAT_DIALOG_DATA) as Carroza;

  imagenPantallaCompletaIndex: number = -1;

  cerrarDialogo() { this.dialogRef.close(); }
  abrirImagenGrande(index: number) { this.imagenPantallaCompletaIndex = index; }
  cerrarImagenGrande() { this.imagenPantallaCompletaIndex = -1; }

  imagenSiguiente(event: Event) {
    event.stopPropagation();
    if (this.carroza.imagenes && this.carroza.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex < this.carroza.imagenes.length - 1) {
        this.imagenPantallaCompletaIndex++;
      } else {
        this.imagenPantallaCompletaIndex = 0;
      }
    }
  }

  imagenAnterior(event: Event) {
    event.stopPropagation();
    if (this.carroza.imagenes && this.carroza.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex > 0) {
        this.imagenPantallaCompletaIndex--;
      } else {
        this.imagenPantallaCompletaIndex = this.carroza.imagenes.length - 1;
      }
    }
  }
}