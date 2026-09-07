import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Urna } from '../models/urna.interface';

@Component({
  selector: 'app-urna-visor-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './urna-visor-dialog.component.html',
  styleUrls: ['./urna-visor-dialog.component.scss']
})
export class UrnaVisorDialogComponent {
  public dialogRef = inject(MatDialogRef<UrnaVisorDialogComponent>);
  public urna = inject(MAT_DIALOG_DATA) as Urna;

  // Si es -1, el visor de pantalla completa está cerrado
  imagenPantallaCompletaIndex: number = -1;

  cerrarDialogo() {
    this.dialogRef.close();
  }

  // --- Lógica del Lightbox (Visor de fotos ampliado) ---

  abrirImagenGrande(index: number) {
    this.imagenPantallaCompletaIndex = index;
  }

  cerrarImagenGrande() {
    this.imagenPantallaCompletaIndex = -1;
  }

  imagenSiguiente(event: Event) {
    event.stopPropagation(); // Evita que al hacer clic se cierre el visor
    if (this.urna.imagenes && this.urna.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex < this.urna.imagenes.length - 1) {
        this.imagenPantallaCompletaIndex++;
      } else {
        this.imagenPantallaCompletaIndex = 0; // Vuelve a la primera
      }
    }
  }

  imagenAnterior(event: Event) {
    event.stopPropagation();
    if (this.urna.imagenes && this.urna.imagenes.length > 0) {
      if (this.imagenPantallaCompletaIndex > 0) {
        this.imagenPantallaCompletaIndex--;
      } else {
        this.imagenPantallaCompletaIndex = this.urna.imagenes.length - 1; // Va a la última
      }
    }
  }
}