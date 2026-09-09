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

// Importar los modelos y Enums
import { Carroza, CarrozaColor, CarrozaEstado, CarrozaMarca } from '../models/carroza.interface';

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
  
  // Opciones para los Selects
  estados = Object.values(CarrozaEstado);
  marcas = Object.values(CarrozaMarca);
  colores = Object.values(CarrozaColor);

  // Diccionario de modelos por marca (Camionetas y Furgones)
  modelosPorMarca: Record<string, string[]> = {
    'Mercedes-Benz': ['Sprinter', 'Vito', 'Clase V'],
    'Ford': ['F-150', 'Ranger', 'Transit', 'Explorer'],
    'Chevrolet': ['Silverado', 'Colorado', 'Express', 'Tahoe'],
    'Hyundai': ['H-1', 'Staria', 'Santa Cruz', 'Palisade', 'Santa Fe'],
    'Kia': ['Carnival', 'Frontier', 'Sorento'],
    'Peugeot': ['Boxer', 'Expert', 'Landtrek', 'Partner'],
    'Otras': ['Furgón Estándar', 'Camioneta Pick-up', 'Sedán Adaptado', 'Otro']
  };
  
  modelosDisponibles: string[] = [];

  // Control de Imágenes
  imagenesActuales: string[] = []; 
  nuevosArchivos: { file: File, preview: string }[] = []; 
  imagenesAEliminar: string[] = []; 

  constructor(
    public dialogRef: MatDialogRef<CarrozaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Carroza | null
  ) {
    this.esEdicion = !!data;
    
    // Inicializamos el formulario con null por defecto para obligar a seleccionar
    this.carrozaForm = this.fb.group({
      marca: [data?.marca || null, Validators.required],
      // El modelo inicia deshabilitado si no hay marca (nueva carroza)
      modelo: [{ value: data?.modelo || null, disabled: !data?.marca }, Validators.required],
      color: [data?.color || null, Validators.required],
      patente: [data?.patente || '', Validators.required],
      estado: [data?.estado || null, Validators.required]
    });

    // Si es edición y ya tenía marca, cargamos sus modelos correspondientes
    if (this.esEdicion && data?.marca) {
      this.modelosDisponibles = this.modelosPorMarca[data.marca] || [];
    }

    if (this.esEdicion && data?.imagenes) {
      this.imagenesActuales = [...data.imagenes];
    }
  }

  ngOnInit(): void {
    // Escuchar cambios en el selector de Marca en tiempo real
    this.carrozaForm.get('marca')?.valueChanges.subscribe(marcaSeleccionada => {
      const modeloCtrl = this.carrozaForm.get('modelo');
      
      if (marcaSeleccionada) {
        // Cargar los modelos de la marca seleccionada
        this.modelosDisponibles = this.modelosPorMarca[marcaSeleccionada] || [];
        modeloCtrl?.enable();
        
        // Si la marca cambió, limpiamos el modelo que estaba seleccionado
        if (this.carrozaForm.value.modelo && !this.modelosDisponibles.includes(this.carrozaForm.value.modelo)) {
          modeloCtrl?.setValue(null);
        }
      } else {
        // Si vuelve a "Sin Seleccionar", bloqueamos y limpiamos
        this.modelosDisponibles = [];
        modeloCtrl?.disable();
        modeloCtrl?.setValue(null);
      }
    });
  }

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
    
    // Obtenemos los valores puros, incluso los campos que puedan estar deshabilitados temporalmente
    const formValues = this.carrozaForm.getRawValue();
    const patenteLimpiada = formValues.patente.replace(/[^a-zA-Z0-9]/g, '');

    try {
      const urlsNuevas: string[] = [];
      for (let i = 0; i < this.nuevosArchivos.length; i++) {
        const url = await this.carrozaService.subirImagen(this.nuevosArchivos[i].file, patenteLimpiada, Date.now() + i);
        urlsNuevas.push(url);
      }

      for (const urlAEliminar of this.imagenesAEliminar) {
        await this.carrozaService.eliminarImagenStorage(urlAEliminar);
      }

      const imagenesFinales = [...this.imagenesActuales, ...urlsNuevas];
      const carrozaData: Partial<Carroza> = { ...formValues, imagenes: imagenesFinales };

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