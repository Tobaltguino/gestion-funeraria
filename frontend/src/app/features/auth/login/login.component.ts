import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar'; // <-- Módulo agregado

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { RecuperarDialogComponent } from '../recuperar-dialog/recuperar-dialog.component';
import { RutFormatDirective } from '../../../shared/directives/rut-format.directive';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule, // <-- Inyectado aquí
    RutFormatDirective
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog); 
  private notification = inject(NotificationService);

  loginForm: FormGroup = this.fb.group({
    rut: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    recordar: [false]
  });

  hidePassword = true;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    const rutGuardado = localStorage.getItem('funeraria_rut_recordado');
    if (rutGuardado) {
      this.loginForm.patchValue({
        rut: rutGuardado,
        recordar: true
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.notification.warning('Por favor, complete todos los campos requeridos.');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { rut, password, recordar } = this.loginForm.value;

    try {
      const { session, error } = await this.authService.loginConRut(rut, password);

      if (error || !session) {
        this.errorMessage = 'Credenciales inválidas. Verifique su RUT y contraseña.';
        this.notification.error(this.errorMessage);
        this.loading = false;
        return;
      }

      if (recordar) {
        localStorage.setItem('funeraria_rut_recordado', rut);
      } else {
        localStorage.removeItem('funeraria_rut_recordado');
      }

      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);

      if (!perfil) {
        this.errorMessage = 'Error al obtener los datos del perfil.';
        this.notification.error(this.errorMessage);
        this.loading = false;
        return;
      }

      this.notification.success(`Bienvenido al sistema, ${perfil.nombre}`);

      if (perfil.rol === Role.ADMIN) {
        this.router.navigate(['/dashboard']); 
      } else if (perfil.rol === Role.EMPLEADO) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/']); 
      }

    } catch (err) {
      console.error('Error inesperado en login:', err);
      this.errorMessage = 'Ocurrió un error inesperado de red. Intente nuevamente.';
      this.notification.error(this.errorMessage);
    } finally {
      this.loading = false;
    }
  }

  abrirRecuperarPassword(event: Event): void {
    event.preventDefault(); 
    this.dialog.open(RecuperarDialogComponent, {
      width: '450px',
      disableClose: false,
      autoFocus: false
    });
  }
}