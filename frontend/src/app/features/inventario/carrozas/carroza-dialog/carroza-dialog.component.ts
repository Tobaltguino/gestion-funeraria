import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CarrozaService } from '../services/carroza.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Carroza, CarrozaEstado } from '../models/carroza.interface';

@Component({
  selector: 'app-carroza-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './carroza-dialog.component.html',
  styleUrls: ['./carroza-dialog.component.scss']
})
export class CarrozaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private carrozaService = inject(CarrozaService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  carrozaForm: FormGroup;
  esEdicion = false;
  guardando = false;
  estados = Object.values(CarrozaEstado);

  // Control de Imágenes
  imagenesActuales: string[] = []; 
  nuevosArchivos: { file: File, preview: string }[] = []; 
  imagenesAEliminar: string[] = []; 

  constructor(
    public dialogRef: MatDialogRef<CarrozaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Carroza | null
  ) {
    this.esEdicion = !!data;
    this.carrozaForm = this.fb.group({
      marca: [data?.marca || '', Validators.required],
      modelo: [data?.modelo || '', Validators.required],
      color: [data?.color || '', Validators.required],
      patente: [data?.patente || '', Validators.required],
      estado: [data?.estado || CarrozaEstado.DISPONIBLE, Validators.required]
    });

    if (this.esEdicion && data?.imagenes) {
      this.imagenesActuales = [...data.imagenes];
    }
  }

  ngOnInit(): void {}

  // --- Lógica de Imágenes (Idéntica a Urnas) ---
  async onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        this.notification.error(`El archivo ${file.name} no es una imagen.`);
        continue;
      }
      try {
        const webpFile = await this.compressImage(file);
        const previewUrl = URL.createObjectURL(webpFile);
        this.nuevosArchivos.push({ file: webpFile, preview: previewUrl });
      } catch (error) {
        console.error('Error procesando imagen', error);
      }
    }
    this.cdr.detectChanges();
  }

  compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          let width = img.width;
          let height = img.height;
          const max_size = 1200;

          if (width > height) {
            if (width > max_size) { height *= max_size / width; width = max_size; }
          } else {
            if (height > max_size) { width *= max_size / height; height = max_size; }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
              resolve(newFile);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/webp', 0.8);
        };
      };
      reader.onerror = error => reject(error);
    });
  }

  removerImagenActual(index: number) {
    this.imagenesAEliminar.push(this.imagenesActuales[index]);
    this.imagenesActuales.splice(index, 1);
  }

  removerNuevaImagen(index: number) {
    this.nuevosArchivos.splice(index, 1);
  }

  // --- Guardar ---
  async guardar() {
    if (this.carrozaForm.invalid) {
      this.carrozaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const formValues = this.carrozaForm.value;
    const patenteLimpiada = formValues.patente.replace(/[^a-zA-Z0-9]/g, ''); // Para nombres de archivo

    try {
      // 1. Subir nuevas imágenes al Storage
      const urlsNuevas: string[] = [];
      for (let i = 0; i < this.nuevosArchivos.length; i++) {
        const url = await this.carrozaService.subirImagen(this.nuevosArchivos[i].file, patenteLimpiada, Date.now() + i);
        urlsNuevas.push(url);
      }

      // 2. Eliminar del Storage las imágenes borradas
      for (const urlAEliminar of this.imagenesAEliminar) {
        await this.carrozaService.eliminarImagenStorage(urlAEliminar);
      }

      // 3. Juntar las URLs finales
      const imagenesFinales = [...this.imagenesActuales, ...urlsNuevas];
      const carrozaData: Partial<Carroza> = { ...formValues, imagenes: imagenesFinales };

      // 4. Guardar en Base de Datos
      if (this.esEdicion && this.data) {
        await this.carrozaService.actualizarCarroza(this.data.id, carrozaData);
        this.notification.success('Carroza actualizada correctamente.');
      } else {
        await this.carrozaService.crearCarroza(carrozaData);
        this.notification.success('Carroza registrada correctamente.');
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error al guardar carroza:', error);
      this.notification.error('Error al guardar: ' + (error.message || 'Intente nuevamente.'));
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}