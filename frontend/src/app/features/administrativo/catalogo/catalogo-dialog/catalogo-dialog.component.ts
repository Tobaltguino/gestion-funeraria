import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

import { CatalogoService } from '../services/catalogo.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PlanFunerario } from '../models/catalogo.interface';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { CategoriaAdicional, Adicional } from '../../../inventario/adicionales/models/adicional.interface'; 

@Component({
  selector: 'app-catalogo-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatRadioModule
  ],
  templateUrl: './catalogo-dialog.component.html'
})
export class CatalogoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private supabaseService = inject(SupabaseService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  planForm: FormGroup;
  esEdicion = false;
  guardando = false;
  
  adicionalesAgrupados: Record<string, Adicional[]> = {};
  categoriasPresentes: string[] = []; 

  imagenesActuales: string[] = []; 
  nuevosArchivos: { file: File, preview: string }[] = []; 
  imagenesAEliminar: string[] = []; 

  constructor(
    public dialogRef: MatDialogRef<CatalogoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlanFunerario | null
  ) {
    this.esEdicion = !!data;
    
    // AÑADIDO: Control de orden inicializado en 0 (o el que traiga la base de datos)
    this.planForm = this.fb.group({
      nombre: [data?.nombre || '', Validators.required],
      orden: [data?.orden || 0, [Validators.required, Validators.min(0)]], 
      luces_id: [null]
    });

    if (this.esEdicion && data?.imagenes) {
      this.imagenesActuales = [...data.imagenes];
    }
  }

  async ngOnInit() {
    await this.cargarInventarioYConstruirFormulario();
  }

  async cargarInventarioYConstruirFormulario() {
    const { data: inventario, error } = await this.supabaseService.client
      .from('inv_adicionales')
      .select('*')
      .eq('disponible', true)
      .order('nombre');
    
    if (!error && inventario) {
      inventario.forEach((item: Adicional) => {
        const cat = item.categoria;
        
        if (!this.adicionalesAgrupados[cat]) {
          this.adicionalesAgrupados[cat] = [];
          this.categoriasPresentes.push(cat);
        }
        this.adicionalesAgrupados[cat].push(item);

        if (cat !== CategoriaAdicional.LUCES && cat !== 'Luces') {
          this.planForm.addControl(`check_${item.id}`, this.fb.control(false));
        }
      });

      if (this.esEdicion && this.data?.adm_plan_adicionales) {
        this.data.adm_plan_adicionales.forEach((relacion: any) => {
          const catItem = inventario.find(i => i.id === relacion.adicional_id)?.categoria;
          
          if (catItem === CategoriaAdicional.LUCES || catItem === 'Luces') {
            this.planForm.get('luces_id')?.setValue(relacion.adicional_id);
          } else {
            this.planForm.get(`check_${relacion.adicional_id}`)?.setValue(true);
          }
        });
      }

      const ordenDeseado = ['Fijo', 'Luces', 'Floral', 'Comida', 'Extra'];
      
      this.categoriasPresentes.sort((a, b) => {
        const indexA = ordenDeseado.indexOf(a);
        const indexB = ordenDeseado.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });
      
      this.cdr.detectChanges();
    }
  }

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

  async guardar() {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const formValues = this.planForm.value;
    const nombreLimpio = formValues.nombre.replace(/[^a-zA-Z0-9]/g, '');

    try {
      const urlsNuevas: string[] = [];
      for (let i = 0; i < this.nuevosArchivos.length; i++) {
        const url = await this.catalogoService.subirImagen(this.nuevosArchivos[i].file, nombreLimpio, Date.now() + i);
        urlsNuevas.push(url);
      }

      for (const urlAEliminar of this.imagenesAEliminar) {
        await this.catalogoService.eliminarImagenStorage(urlAEliminar);
      }

      const imagenesFinales = [...this.imagenesActuales, ...urlsNuevas];
      
      // AÑADIDO: Incluimos el campo 'orden' en los datos a guardar
      const planData: Partial<PlanFunerario> = { 
        nombre: formValues.nombre, 
        orden: formValues.orden,
        imagenes: imagenesFinales 
      };
      
      const relaciones: any[] = [];
      
      if (formValues.luces_id) {
        relaciones.push({ adicional_id: formValues.luces_id, cantidad: 1 });
      }

      Object.keys(formValues).forEach(key => {
        if (key.startsWith('check_') && formValues[key] === true) {
          const adicional_id = key.replace('check_', '');
          relaciones.push({ adicional_id: adicional_id, cantidad: 1 });
        }
      });

      if (this.esEdicion && this.data) {
        await this.catalogoService.actualizarPlan(this.data.id, planData, relaciones);
        this.notification.success('Plan actualizado correctamente.');
      } else {
        await this.catalogoService.crearPlan(planData, relaciones);
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