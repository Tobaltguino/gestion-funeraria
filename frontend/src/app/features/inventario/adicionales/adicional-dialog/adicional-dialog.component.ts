import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select'; // <-- Importante añadir esto
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdicionalService } from '../services/adicional.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Adicional } from '../models/adicional.interface';

@Component({
  selector: 'app-adicional-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './adicional-dialog.component.html'
})
export class AdicionalDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adicionalService = inject(AdicionalService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  adicionalForm: FormGroup;
  esEdicion = false;
  guardando = false;

  // Control de Imágenes
  imagenesActuales: string[] = []; 
  nuevosArchivos: { file: File, preview: string }[] = []; 
  imagenesAEliminar: string[] = []; 

  constructor(
    public dialogRef: MatDialogRef<AdicionalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Adicional | null
  ) {
    this.esEdicion = !!data;
    this.adicionalForm = this.fb.group({
      nombre: [data?.nombre || '', Validators.required],
      descripcion: [data?.descripcion || ''], // Es opcional, no le ponemos required
      disponible: [data?.disponible !== undefined ? data.disponible : true, Validators.required],
      precio_costo: [data?.precio_costo || 0, [Validators.required, Validators.min(0)]],
      precio_venta: [data?.precio_venta || 0, [Validators.required, Validators.min(0)]]
    });

    if (this.esEdicion && data?.imagenes) {
      this.imagenesActuales = [...data.imagenes];
    }
  }

  ngOnInit(): void {}

  // --- Lógica de Imágenes ---
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
    if (this.adicionalForm.invalid) {
      this.adicionalForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const formValues = this.adicionalForm.value;
    const nombreLimpio = formValues.nombre.replace(/[^a-zA-Z0-9]/g, '');

    try {
      const urlsNuevas: string[] = [];
      for (let i = 0; i < this.nuevosArchivos.length; i++) {
        const url = await this.adicionalService.subirImagen(this.nuevosArchivos[i].file, nombreLimpio, Date.now() + i);
        urlsNuevas.push(url);
      }

      for (const urlAEliminar of this.imagenesAEliminar) {
        await this.adicionalService.eliminarImagenStorage(urlAEliminar);
      }

      const imagenesFinales = [...this.imagenesActuales, ...urlsNuevas];
      
      // Aquí formValues ya incluye 'descripcion' y 'disponible'
      const adicionalData: Partial<Adicional> = { ...formValues, imagenes: imagenesFinales };

      if (this.esEdicion && this.data) {
        await this.adicionalService.actualizarAdicional(this.data.id, adicionalData);
        this.notification.success('Adicional actualizado correctamente.');
      } else {
        await this.adicionalService.crearAdicional(adicionalData);
        this.notification.success('Adicional registrado correctamente.');
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error al guardar adicional:', error);
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