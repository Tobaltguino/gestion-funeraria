import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { MatTooltipModule } from '@angular/material/tooltip';

// Servicios y Modelos
import { CarrozaService } from './services/carroza.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { Carroza } from './models/carroza.interface';
import { NotificationService } from '../../../shared/services/notification.service';

// Componentes (Modales)
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CarrozaDialogComponent } from './carroza-dialog/carroza-dialog.component';
import { CarrozaVisorDialogComponent } from './carroza-visor-dialog/carroza-visor-dialog.component';

@Component({
  selector: 'app-carrozas',
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
  templateUrl: './carrozas.component.html',
  styleUrls: ['./carrozas.component.scss']
})
export class CarrozasComponent implements OnInit {
  private carrozaService = inject(CarrozaService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  carrozas: Carroza[] = [];
  cargando = true;
  esAdmin = false;

  columnasMostrar: string[] = ['imagen', 'vehiculo', 'patente', 'estado', 'acciones'];

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarCarrozas();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN;
    }
  }

  async cargarCarrozas() {
    this.cargando = true;
    this.cdr.detectChanges(); 
    
    try {
      this.carrozas = await this.carrozaService.obtenerCarrozas();
    } catch (error) {
      console.error('Error al cargar carrozas:', error);
      this.notification.error('No se pudo cargar la flota de carrozas.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- VISOR PARA EMPLEADOS Y ADMIN ---

  abrirVisor(carroza: Carroza) {
    this.dialog.open(CarrozaVisorDialogComponent, {
      width: '750px',
      data: carroza
    });
  }

  // --- ACCIONES (SOLO ADMIN) ---

  abrirDialogoCarroza(carroza?: Carroza) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(CarrozaDialogComponent, {
      width: '600px',
      disableClose: true,
      data: carroza || null
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo) this.cargarCarrozas();
    });
  }

  async eliminarCarroza(carroza: Carroza) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Carroza',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar el <strong>${carroza.marca} ${carroza.modelo}</strong> de la flota?`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.carrozaService.eliminarCarroza(carroza.id);
          this.notification.success(`Carroza eliminada correctamente.`);
          await this.cargarCarrozas(); 
        } catch (error) {
          this.notification.error('Hubo un error al intentar eliminar la carroza.');
        }
      }
    });
  }
}