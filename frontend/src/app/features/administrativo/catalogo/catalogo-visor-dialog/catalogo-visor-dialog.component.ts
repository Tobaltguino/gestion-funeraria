import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlanFunerario } from '../models/catalogo.interface';

@Component({
  selector: 'app-catalogo-visor-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './catalogo-visor-dialog.component.html'
})
export class CatalogoVisorDialogComponent {
  public dialogRef = inject(MatDialogRef<CatalogoVisorDialogComponent>);
  public plan = inject(MAT_DIALOG_DATA) as PlanFunerario;

  imagenPantallaCompletaIndex: number = -1;

  cerrarDialogo() {
    this.dialogRef.close();
  }

  abrirImagenGrande(index: number) {
    this.imagenPantallaCompletaIndex = index;
  }

  cerrarImagenGrande() {
    this.imagenPantallaCompletaIndex = -1;
  }

  imagenSiguiente(event: Event) {
    event.stopPropagation(); 
    if (this.plan.imagenes && this.plan.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex < this.plan.imagenes.length - 1) {
        this.imagenPantallaCompletaIndex++;
      } else {
        this.imagenPantallaCompletaIndex = 0; 
      }
    }
  }

  imagenAnterior(event: Event) {
    event.stopPropagation();
    if (this.plan.imagenes && this.plan.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex > 0) {
        this.imagenPantallaCompletaIndex--;
      } else {
        this.imagenPantallaCompletaIndex = this.plan.imagenes.length - 1; 
      }
    }
  }
}