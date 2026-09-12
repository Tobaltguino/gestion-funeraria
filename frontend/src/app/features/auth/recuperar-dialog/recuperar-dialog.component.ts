import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Importaciones de Material 
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar'; // <-- Módulo agregado

import { AuthService } from '../../../core/auth/auth.service';
import { RutFormatDirective } from '../../../shared/directives/rut-format.directive';
import { NotificationService } from '../../../shared/services/notification.service';

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
    MatProgressSpinnerModule,
    MatSnackBarModule, // <-- Inyectado aquí
    RutFormatDirective 
  ],
  templateUrl: './recuperar-dialog.component.html',
  styleUrls: ['./recuperar-dialog.component.scss']
})
export class RecuperarDialogComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<RecuperarDialogComponent>);
  private notification = inject(NotificationService);

  recuperarForm: FormGroup = this.fb.group({
    rut: ['', [Validators.required]]
  });

  loading = false;
  mensajeExito = '';
  mensajeError = '';

  async onSubmit(): Promise<void> {
    if (this.recuperarForm.invalid) {
      this.notification.warning('Ingrese un RUT válido.');
      return;
    }

    this.loading = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const { rut } = this.recuperarForm.value;

    try {
      const { error } = await this.authService.recuperarContrasena(rut);

      if (error) {
        this.mensajeError = error.message;
        this.notification.error(this.mensajeError);
      } else {
        this.mensajeExito = 'Se han enviado las instrucciones al correo registrado asociado a este RUT.';
        this.notification.success(this.mensajeExito);
        this.cerrar();
      }
    } catch (err) {
      this.mensajeError = 'Ocurrió un error inesperado. Intente más tarde.';
      this.notification.error(this.mensajeError);
    } finally {
      this.loading = false;
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}