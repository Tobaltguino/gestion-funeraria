import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.scss']
})
export class UpdatePasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Validación personalizada para asegurar que las contraseñas coinciden
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  updateForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  hidePassword1 = true;
  hidePassword2 = true;
  loading = false;
  mensajeExito = '';
  mensajeError = '';

  async onSubmit(): Promise<void> {
    if (this.updateForm.invalid) return;

    this.loading = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const { password } = this.updateForm.value;

    try {
      const { error } = await this.authService.actualizarContrasena(password);

      if (error) {
        this.mensajeError = 'Hubo un error al actualizar la contraseña. Es posible que el enlace haya expirado.';
      } else {
        this.mensajeExito = 'Contraseña actualizada correctamente.';
        
        // Esperamos 2.5 segundos para que lea el mensaje y luego al login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      }
    } catch (err) {
      this.mensajeError = 'Ocurrió un error inesperado. Intente nuevamente.';
    } finally {
      this.loading = false;
    }
  }
}