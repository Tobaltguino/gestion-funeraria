import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DocumentoService } from '../services/documento.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Documento, TipoDocumento } from '../models/documento.interface';

@Component({
  selector: 'app-documento-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule
  ],
  templateUrl: './documento-dialog.component.html',
  styleUrls: ['./documento-dialog.component.scss']
})
export class DocumentoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private documentoService = inject(DocumentoService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  docForm: FormGroup;
  esEdicion = false;
  guardando = false;

  tiposDocumento = Object.values(TipoDocumento);

  // Variables para manejo de archivo
  archivoSeleccionado: File | null = null;
  nombreArchivoMostrado: string = 'Ningún archivo seleccionado';

  constructor(
    public dialogRef: MatDialogRef<DocumentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Documento | null
  ) {
    this.esEdicion = !!data;

    this.docForm = this.fb.group({
      nombre: [data?.nombre || '', [Validators.required, Validators.maxLength(100)]],
      tipo: [data?.tipo || '', Validators.required],
      descripcion: [data?.descripcion || '', Validators.maxLength(250)]
    });

    if (this.esEdicion && data?.url) {
      // Si estamos editando, mostramos que ya hay un archivo subido
      this.nombreArchivoMostrado = 'Archivo actual (Subir uno nuevo para reemplazar)';
    }
  }

  ngOnInit(): void {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Validación básica de tamaño (ej: máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.notification.warning('El archivo es demasiado grande (Máx. 10MB)');
        return;
      }
      this.archivoSeleccionado = file;
      this.nombreArchivoMostrado = file.name;
      this.cdr.detectChanges();
    }
  }

  async guardar() {
    if (this.docForm.invalid) {
      this.docForm.markAllAsTouched();
      return;
    }

    // Validar que haya archivo si es un documento nuevo
    if (!this.esEdicion && !this.archivoSeleccionado) {
      this.notification.warning('Debes adjuntar un archivo para crear el documento.');
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    const formValues = this.docForm.getRawValue();
    let urlFinal = this.data?.url || ''; // Mantenemos la URL vieja por defecto

    try {
      // 1. Si hay un archivo nuevo seleccionado, lo subimos primero al Storage
      if (this.archivoSeleccionado) {
        // SOLUCIÓN: Agregamos formValues.tipo como tercer parámetro aquí 👇
        urlFinal = await this.documentoService.subirDocumento(
          this.archivoSeleccionado, 
          formValues.nombre, 
          formValues.tipo
        );
      }

      // 2. Preparamos el objeto para la Base de Datos
      const docData: Partial<Documento> = {
        nombre: formValues.nombre,
        tipo: formValues.tipo,
        descripcion: formValues.descripcion,
        url: urlFinal
      };

      // 3. Guardamos en BD
      if (this.esEdicion && this.data) {
        await this.documentoService.actualizarDocumento(this.data.id, docData);
        this.notification.success('Documento actualizado correctamente.');
      } else {
        await this.documentoService.crearDocumento(docData);
        this.notification.success('Documento registrado y subido correctamente.');
      }
      
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error al guardar documento:', error);
      this.notification.error('Ocurrió un error al guardar el documento.');
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}