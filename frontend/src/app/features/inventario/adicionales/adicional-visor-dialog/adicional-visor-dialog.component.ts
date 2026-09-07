import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Adicional } from '../models/adicional.interface';

@Component({
  selector: 'app-adicional-visor-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './adicional-visor-dialog.component.html',
  styleUrl: './adicional-visor-dialog.component.scss'
})
export class AdicionalVisorDialogComponent {
  public dialogRef = inject(MatDialogRef<AdicionalVisorDialogComponent>);
  public adicional = inject(MAT_DIALOG_DATA) as Adicional;

  imagenPantallaCompletaIndex: number = -1;

  cerrarDialogo() { this.dialogRef.close(); }
  abrirImagenGrande(index: number) { this.imagenPantallaCompletaIndex = index; }
  cerrarImagenGrande() { this.imagenPantallaCompletaIndex = -1; }

  imagenSiguiente(event: Event) {
    event.stopPropagation();
    if (this.adicional.imagenes && this.adicional.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex < this.adicional.imagenes.length - 1) {
        this.imagenPantallaCompletaIndex++;
      } else {
        this.imagenPantallaCompletaIndex = 0;
      }
    }
  }

  imagenAnterior(event: Event) {
    event.stopPropagation();
    if (this.adicional.imagenes && this.adicional.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex > 0) {
        this.imagenPantallaCompletaIndex--;
      } else {
        this.imagenPantallaCompletaIndex = this.adicional.imagenes.length - 1;
      }
    }
  }
}