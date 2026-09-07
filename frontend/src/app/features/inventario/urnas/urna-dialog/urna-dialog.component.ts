import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UrnaService } from '../services/urna.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Urna } from '../models/urna.interface';

@Component({
  selector: 'app-urna-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './urna-dialog.component.html'
})
export class UrnaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UrnaDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as Urna | null; 
  private urnaService = inject(UrnaService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef); 

  formulario!: FormGroup;
  esEdicion = false;
  cargando = false;
  
  imagenesExistentes: string[] = [];
  archivosNuevos: File[] = [];
  vistasPreviasNuevas: string[] = [];
  
  // 🔥 Llevamos registro de las imágenes que el usuario quitó para borrarlas del Bucket
  imagenesParaEliminarDelBucket: string[] = []; 

  ngOnInit() {
    this.esEdicion = !!this.data;
    if (this.esEdicion && this.data?.imagenes) {
      this.imagenesExistentes = [...this.data.imagenes];
    }
    this.iniciarFormulario();
  }

  iniciarFormulario() {
    this.formulario = this.fb.group({
      nombre: [this.data?.nombre || '', [Validators.required, Validators.minLength(3)]],
      precio_costo: [this.data?.precio_costo || '', [Validators.required, Validators.min(0)]],
      precio_venta: [this.data?.precio_venta || '', [Validators.required, Validators.min(0)]],
      stock_actual: [this.data?.stock_actual || '', [Validators.required, Validators.min(0)]],
      kpi_alerta_stock: [this.data?.kpi_alerta_stock || '', [Validators.required, Validators.min(0)]]
    });
  }

  // --- MAGIA: Comprimir y convertir a WebP ---
  private comprimirAWebP(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Redimensionar si es muy grande
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convertir a WebP con 80% de calidad (Excelente relación calidad/peso)
          canvas.toBlob((blob) => {
            if (blob) {
              // Recreamos el archivo con la nueva extensión
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
              resolve(newFile);
            } else {
              resolve(file); // Si falla algo, devolvemos la original
            }
          }, 'image/webp', 0.8);
        };
      };
    });
  }

  async onFilesSelected(event: any) {
    const files = event.target.files as FileList;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        this.notification.warning(`El archivo ${file.name} no es una imagen.`);
        continue;
      }

      // Convertimos a WebP antes de guardar en memoria
      const archivoWebP = await this.comprimirAWebP(file);
      this.archivosNuevos.push(archivoWebP);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.vistasPreviasNuevas.push(e.target.result);
        this.cdr.detectChanges(); 
      };
      reader.readAsDataURL(archivoWebP);
    }
    
    event.target.value = ''; 
  }

  removerImagenExistente(index: number) {
    // Si borramos una existente, la mandamos a la lista negra
    this.imagenesParaEliminarDelBucket.push(this.imagenesExistentes[index]);
    this.imagenesExistentes.splice(index, 1);
    this.cdr.detectChanges(); 
  }

  removerImagenNueva(index: number) {
    this.archivosNuevos.splice(index, 1);
    this.vistasPreviasNuevas.splice(index, 1);
    this.cdr.detectChanges(); 
  }

  async guardar() {
    if (this.formulario.invalid) {
      this.notification.warning('Revise los campos requeridos del formulario.');
      return;
    }

    this.cargando = true;

    try {
      const formValues = this.formulario.value;
      const nombreUrna = formValues.nombre;

      // 1. Subir las imágenes nuevas con el nombre dinámico y WebP
      // Aprovechamos el índice del mapa + las existentes para que el número final no se repita
      const promesasSubida = this.archivosNuevos.map((file, i) => 
        this.urnaService.subirImagen(file, nombreUrna, this.imagenesExistentes.length + i + 1)
      );
      
      const urlsNuevas = await Promise.all(promesasSubida);
      const imagenesFinales = [...this.imagenesExistentes, ...urlsNuevas];

      // 2. Ejecutar la limpieza en Supabase de las fotos que el usuario borró de la galería
      if (this.imagenesParaEliminarDelBucket.length > 0) {
        const promesasBorrado = this.imagenesParaEliminarDelBucket.map(url => 
          this.urnaService.eliminarImagenStorage(url)
        );
        await Promise.all(promesasBorrado);
      }

      // 3. Preparar los datos
      const urnaData: Partial<Urna> = {
        nombre: nombreUrna,
        precio_costo: Number(formValues.precio_costo),
        precio_venta: Number(formValues.precio_venta),
        stock_actual: Number(formValues.stock_actual),
        kpi_alerta_stock: Number(formValues.kpi_alerta_stock),
        imagenes: imagenesFinales 
      };

      // 4. Guardar en Base de Datos
      if (this.esEdicion) {
        await this.urnaService.actualizarUrna(this.data!.id, urnaData);
        this.notification.success('Urna actualizada correctamente.');
      } else {
        await this.urnaService.crearUrna(urnaData);
        this.notification.success('Urna registrada con éxito.');
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al guardar la urna:', error);
      this.notification.error('Hubo un problema al guardar la urna.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  cerrar() {
    // Si cancela, NO borramos nada del bucket porque la operación se anuló
    this.dialogRef.close(false);
  }
}