import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { MatTooltipModule } from '@angular/material/tooltip';

// Servicios, Modelos y Roles
import { AdicionalService } from './services/adicional.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { Adicional } from './models/adicional.interface';
import { NotificationService } from '../../../shared/services/notification.service';

// Componentes Compartidos y Modales
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AdicionalDialogComponent } from './adicional-dialog/adicional-dialog.component';
import { AdicionalVisorDialogComponent } from './adicional-visor-dialog/adicional-visor-dialog.component';

@Component({
  selector: 'app-adicionales',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './adicionales.component.html'
})
export class AdicionalesComponent implements OnInit {
  private adicionalService = inject(AdicionalService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  adicionales: Adicional[] = [];
  cargando = true;
  esAdmin = false;

  // Columnas que se mostrarán en la tabla
  columnasMostrar: string[] = ['imagen', 'nombre', 'categoria', 'acciones'];

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarAdicionales();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN;
    }
  }

  async cargarAdicionales() {
    this.cargando = true;
    this.cdr.detectChanges(); // Previene el error NG0100 de Angular

    try {
      this.adicionales = await this.adicionalService.obtenerAdicionales();
    } catch (error) {
      console.error('Error al cargar adicionales:', error);
      this.notification.error('No se pudo cargar el catálogo de adicionales.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- VISOR DE FOTOS ---
  abrirVisor(adicional: Adicional) {
    this.dialog.open(AdicionalVisorDialogComponent, {
      width: '750px',
      data: adicional
    });
  }

  // --- CREAR / EDITAR (SOLO ADMIN) ---
  abrirDialogoAdicional(adicional?: Adicional) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(AdicionalDialogComponent, {
      width: '600px',
      disableClose: true,
      data: adicional || null
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo) this.cargarAdicionales();
    });
  }

  // --- ELIMINAR (SOLO ADMIN) ---
  async eliminarAdicional(adicional: Adicional) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Adicional',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar <strong>${adicional.nombre}</strong> del catálogo?`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.adicionalService.eliminarAdicional(adicional.id);
          this.notification.success(`Adicional eliminado correctamente.`);
          await this.cargarAdicionales(); 
        } catch (error) {
          this.notification.error('Hubo un error al intentar eliminar el adicional.');
        }
      }
    });
  }
}