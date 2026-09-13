import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Servicios y Componentes
import { ServiciosService } from './services/servicios.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { ServicioContratado } from './models/servicio.interface';
import { ServicioDialogComponent } from './servicio-dialog/servicio-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss']
})
export class ServiciosComponent implements OnInit {
  private serviciosService = inject(ServiciosService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<ServicioContratado>();
  columnasMostrar: string[] = ['fecha', 'fallecido', 'entidad', 'plan', 'estado', 'acciones'];
  
  cargando = true;
  esAdmin = false;

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarServicios();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN
      this.cdr.detectChanges(); // <-- AÑADIDO para asegurar que el botón de eliminar se muestre si es admin
    }
  }

  async cargarServicios() {
    this.cargando = true;
    this.cdr.detectChanges(); // Mostrar spinner tabla
    
    try {
      const data = await this.serviciosService.obtenerServicios();
      this.dataSource.data = data;
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      this.notification.error('No se pudieron cargar los servicios contratados.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges(); // Quitar spinner tabla y dibujar datos
    }
  }

  abrirFormulario(servicio?: ServicioContratado) {
    const dialogRef = this.dialog.open(ServicioDialogComponent, {
      width: '900px',
      disableClose: true,
      data: servicio || null
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo) {
        this.cargarServicios();
      }
    });
  }

  async eliminarServicio(servicio: ServicioContratado) {
    if (!this.esAdmin) {
      this.notification.warning('No tienes permisos para eliminar servicios.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Servicio',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar el servicio de <strong>${servicio.nombre_fallecido}</strong>? Esta acción no se puede deshacer.`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.serviciosService.eliminarServicio(servicio.id);
          this.notification.success('Servicio eliminado correctamente.');
          await this.cargarServicios(); 
        } catch (error) {
          this.notification.error('Hubo un error al intentar eliminar el servicio.');
        }
      }
    });
  }
}