import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { MatSnackBarModule } from '@angular/material/snack-bar'; // <-- Módulo agregado

import { UsuarioService } from './usuario.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PerfilUsuario } from '../../../core/auth/auth.interface';
import { UsuarioDialogComponent } from './usuario-dialog/usuario-dialog.component';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule // <-- Inyectado aquí
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService); 
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog); 
  private notification = inject(NotificationService);

  usuarios: PerfilUsuario[] = [];
  columnasMostrar: string[] = ['nombre', 'rut', 'rol', 'telefono', 'estado', 'acciones'];
  cargando = true;
  currentUserId: string | null = null; 

  async ngOnInit() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      this.currentUserId = session.user.id;
    }
    await this.cargarUsuarios();
  }

  async cargarUsuarios() {
    this.cargando = true;
    try {
      this.usuarios = await this.usuarioService.obtenerUsuarios();
    } catch (error) {
      console.error('Error al cargar la tabla:', error);
      this.notification.error('Error al cargar la lista de usuarios.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  crearUsuario() {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '450px',
      disableClose: true 
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo) {
        this.cargarUsuarios(); 
      }
    });
  }

  editarUsuario(usuario: PerfilUsuario) {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '450px',
      disableClose: true,
      data: usuario 
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo) {
        this.cargarUsuarios();
      }
    });
  }

  async alternarEstado(usuario: PerfilUsuario) {
    const accion = usuario.activo ? 'bloquear (desactivar)' : 'desbloquear (activar)';
    if (confirm(`¿Estás seguro de que deseas ${accion} a ${usuario.nombre}?`)) {
      try {
        await this.usuarioService.alternarEstado(usuario.id, usuario.activo);
        this.notification.success(`El estado de ${usuario.nombre} ha sido actualizado.`);
        await this.cargarUsuarios(); 
      } catch (error) {
        this.notification.error('Hubo un error al cambiar el estado del usuario.');
      }
    }
  }

  async eliminarUsuario(usuario: PerfilUsuario) {
    if (confirm(`⚠️ ATENCIÓN: ¿Estás seguro de eliminar a ${usuario.nombre}?\nEsta acción lo removerá del sistema.`)) {
      try {
        await this.usuarioService.eliminarUsuario(usuario.id);
        this.notification.success(`El usuario ${usuario.nombre} ha sido eliminado.`);
        await this.cargarUsuarios(); 
      } catch (error) {
        this.notification.error('Hubo un error al eliminar el usuario.');
      }
    }
  }
}