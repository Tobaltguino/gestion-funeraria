import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

// Angular Material Form elements
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Role } from '../../../../shared/enums/role.enum';
import { UsuarioService } from '../usuario.service';
import { PerfilUsuario } from '../../../../core/auth/auth.interface';

import { RutFormatDirective } from '../../../../shared/directives/rut-format';

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
    if (this.formulario.invalid) return;
    
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
      } else {
        const rawData = this.formulario.getRawValue();
        
        // Limpiamos el RUT (quitamos todo lo que no sea número o K)
        const rutSinPuntos = rawData.rut.replace(/[^0-9kK]/g, '').toUpperCase();
        
        // Armamos el objeto para crear con la contraseña automática
        const nuevoUsuario = {
          ...rawData,
          password: rutSinPuntos // Supabase recibirá el RUT limpio como clave
        };

        await this.usuarioService.crearUsuario(nuevoUsuario);
      }
      
      this.dialogRef.close(true); 
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al guardar el usuario.');
    } finally {
      this.cargando = false;
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}