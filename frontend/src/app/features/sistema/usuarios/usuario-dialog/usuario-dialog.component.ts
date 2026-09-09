import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

// Angular Material 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar'; // <-- Módulo agregado

import { Role } from '../../../../shared/enums/role.enum';
import { UsuarioService } from '../services/usuario.service';
import { PerfilUsuario } from '../../../../core/auth/auth.interface';
import { RutFormatDirective } from '../../../../shared/directives/rut-format.directive';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-usuario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule, // <-- Inyectado aquí
    RutFormatDirective 
  ],
  templateUrl: './usuario-dialog.component.html',
  styleUrls: ['./usuario-dialog.component.scss']
})
export class UsuarioDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UsuarioDialogComponent>);
  private data = inject(MAT_DIALOG_DATA) as PerfilUsuario | null; 
  private usuarioService = inject(UsuarioService);
  private notification = inject(NotificationService);

  formulario!: FormGroup;
  esEdicion = false;
  cargando = false;
  
  rolesDisponibles = Object.values(Role); 

  ngOnInit() {
    this.esEdicion = !!this.data;
    this.iniciarFormulario();
  }

  iniciarFormulario() {
    this.formulario = this.fb.group({
      nombre: [this.data?.nombre || '', [Validators.required, Validators.minLength(3)]],
      rut: [this.data?.rut || '', [Validators.required]],
      rol: [this.data?.rol || '', [Validators.required]],
      telefono: [this.data?.telefono || ''],
      email: [
        { value: '', disabled: this.esEdicion }, 
        this.esEdicion ? [] : [Validators.required, Validators.email]
      ]
    });
  }

  async guardar() {
    if (this.formulario.invalid) {
      this.notification.warning('Por favor, revise los campos del formulario.');
      return;
    }
    
    this.cargando = true;
    try {
      if (this.esEdicion) {
        const formValues = this.formulario.value;
        await this.usuarioService.actualizarUsuario(this.data!.id, {
          nombre: formValues.nombre,
          rut: formValues.rut,
          rol: formValues.rol,
          telefono: formValues.telefono
        });
        this.notification.success('Usuario actualizado correctamente.');
      } else {
        const rawData = this.formulario.getRawValue();
        const rutSinPuntos = rawData.rut.replace(/[^0-9kK]/g, '').toUpperCase();
        
        const nuevoUsuario = {
          ...rawData,
          password: rutSinPuntos 
        };

        await this.usuarioService.crearUsuario(nuevoUsuario);
        this.notification.success('Usuario creado con éxito.');
      }
      
      this.dialogRef.close(true); 
    } catch (error) {
      console.error('Error al guardar:', error);
      this.notification.error('Hubo un error al procesar la solicitud.');
    } finally {
      this.cargando = false;
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}