import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { MatTooltipModule } from '@angular/material/tooltip'; 

import { UrnaService } from './services/urna.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { Urna } from './models/urna.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UrnaDialogComponent } from './urna-dialog/urna-dialog.component';
import { UrnaVisorDialogComponent } from './urna-visor-dialog/urna-visor-dialog.component';

@Component({
  selector: 'app-urnas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule // 👇 Importación requerida
  ],
  templateUrl: './urnas.component.html',
  styleUrls: ['./urnas.component.scss']
})
export class UrnasComponent implements OnInit {
  private urnaService = inject(UrnaService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  urnas: Urna[] = [];
  cargando = true;
  esAdmin = false;

  columnasMostrar: string[] = ['imagen', 'nombre', 'stock', 'acciones'];

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarUrnas();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN;
    }
  }

  async cargarUrnas() {
    this.cargando = true;
    this.cdr.detectChanges();
    
    try {
      this.urnas = await this.urnaService.obtenerUrnas();
    } catch (error) {
      console.error('Error al cargar urnas:', error);
      this.notification.error('No se pudo cargar el inventario de urnas.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- VISOR PARA EMPLEADOS Y ADMIN ---

  abrirVisor(urna: Urna) {
    this.dialog.open(UrnaVisorDialogComponent, {
      width: '750px',
      data: urna
    });
  }

  // --- ACCIONES (SOLO ADMIN) ---

  abrirDialogoUrna(urna?: Urna) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(UrnaDialogComponent, {
      width: '600px',
      disableClose: true,
      data: urna || null
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo) this.cargarUrnas();
    });
  }

  async eliminarUrna(urna: Urna) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Urna',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar <strong>${urna.nombre}</strong> del inventario?`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.urnaService.eliminarUrna(urna.id);
          this.notification.success(`Urna eliminada correctamente.`);
          await this.cargarUrnas(); 
        } catch (error) {
          this.notification.error('Hubo un error al intentar eliminar la urna.');
        }
      }
    });
  }
}