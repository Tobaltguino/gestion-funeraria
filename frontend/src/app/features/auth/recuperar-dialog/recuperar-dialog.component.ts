import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Importaciones de Material (incluyendo MatDialog)
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-recuperar-dialog',
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
  templateUrl: './recuperar-dialog.component.html',
  styleUrls: ['./recuperar-dialog.component.scss']
})
export class RecuperarDialogComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<RecuperarDialogComponent>);

  recuperarForm: FormGroup = this.fb.group({
    rut: ['', [Validators.required]]
  });

  loading = false;
  mensajeExito = '';
  mensajeError = '';

  async onSubmit(): Promise<void> {
    if (this.recuperarForm.invalid) return;

    this.loading = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const { rut } = this.recuperarForm.value;

    try {
      // Llamamos a la función que creaste en el paso anterior
      const { error } = await this.authService.recuperarContrasena(rut);

      if (error) {
        this.mensajeError = error.message;
      } else {
        this.mensajeExito = 'Se han enviado las instrucciones al correo registrado asociado a este RUT.';
      }
    } catch (err) {
      this.mensajeError = 'Ocurrió un error inesperado. Intente más tarde.';
    } finally {
      this.loading = false;
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}