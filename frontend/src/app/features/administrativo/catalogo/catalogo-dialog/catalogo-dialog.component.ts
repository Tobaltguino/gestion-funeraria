import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CatalogoService } from '../services/catalogo.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PlanFunerario } from '../models/catalogo.interface';

@Component({
  selector: 'app-catalogo-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './catalogo-dialog.component.html'
  // Sin archivo SCSS local, usamos el global
})
export class CatalogoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  planForm: FormGroup;
  esEdicion = false;
  guardando = false;

  // Control de Imágenes
  imagenesActuales: string[] = []; 
  nuevosArchivos: { file: File, preview: string }[] = []; 
  imagenesAEliminar: string[] = []; 

  constructor(
    public dialogRef: MatDialogRef<CatalogoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlanFunerario | null
  ) {
    this.esEdicion = !!data;
    
    this.planForm = this.fb.group({
      nombre: [data?.nombre || '', Validators.required],
      incluye: this.fb.array([]) // Array dinámico para las características
    });

    // Inicializamos las características (viñetas)
    if (this.esEdicion && data?.incluye && data.incluye.length > 0) {
      data.incluye.forEach(item => this.agregarIncluye(item));
    } else {
      this.agregarIncluye(''); // Agrega un campo vacío por defecto al crear uno nuevo
    }

    if (this.esEdicion && data?.imagenes) {
      this.imagenesActuales = [...data.imagenes];
    }
  }

  ngOnInit(): void {}

  // --- LÓGICA DEL FORM ARRAY (Características Dinámicas) ---
  get incluyeControls() {
    return (this.planForm.get('incluye') as FormArray).controls;
  }

  agregarIncluye(valor: string = '') {
    const incluyeFormArray = this.planForm.get('incluye') as FormArray;
    incluyeFormArray.push(this.fb.control(valor, Validators.required));
  }

  removerIncluye(index: number) {
    const incluyeFormArray = this.planForm.get('incluye') as FormArray;
    if (incluyeFormArray.length > 1) {
      incluyeFormArray.removeAt(index);
    } else {
      this.notification.warning('El plan debe tener al menos una característica.');
    }
  }

  // --- LÓGICA DE IMÁGENES ---
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

  // --- GUARDAR PLAN ---
  async guardar() {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const formValues = this.planForm.value;
    const nombreLimpio = formValues.nombre.replace(/[^a-zA-Z0-9]/g, '');

    try {
      // 1. Subir imágenes nuevas
      const urlsNuevas: string[] = [];
      for (let i = 0; i < this.nuevosArchivos.length; i++) {
        const url = await this.catalogoService.subirImagen(this.nuevosArchivos[i].file, nombreLimpio, Date.now() + i);
        urlsNuevas.push(url);
      }

      // 2. Eliminar del storage las que se borraron
      for (const urlAEliminar of this.imagenesAEliminar) {
        await this.catalogoService.eliminarImagenStorage(urlAEliminar);
      }

      // 3. Juntar imágenes y guardar datos
      const imagenesFinales = [...this.imagenesActuales, ...urlsNuevas];
      const planData: Partial<PlanFunerario> = { ...formValues, imagenes: imagenesFinales };

      if (this.esEdicion && this.data) {
        await this.catalogoService.actualizarPlan(this.data.id, planData);
        this.notification.success('Plan actualizado correctamente.');
      } else {
        await this.catalogoService.crearPlan(planData);
        this.notification.success('Plan registrado correctamente.');
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error al guardar plan:', error);
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