import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// Servicios y Modelos
import { AdicionalService } from './services/adicional.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AdicionalDialogComponent } from './adicional-dialog/adicional-dialog.component';
import { AdicionalVisorDialogComponent } from './adicional-visor-dialog/adicional-visor-dialog.component';
import { Adicional } from './models/adicional.interface';

@Component({
  selector: 'app-adicionales',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './adicionales.component.html',
  styleUrls: ['./adicionales.component.scss']
})
export class AdicionalesComponent implements OnInit {
  private adicionalService = inject(AdicionalService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Adicional>();
  cargando = true;
  esAdmin = false;

  // Actualizamos las columnas a mostrar
  columnasMostrar: string[] = ['imagen', 'servicio', 'descripcion', 'estado', 'acciones'];

  // Variables para filtros
  filtroNombre: string = '';
  filtroDisponible: string = ''; // '' = Todos, 'true' = Disponibles, 'false' = No Disponibles

  async ngOnInit() {
    this.configurarFiltroPersonalizado();
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
    this.cdr.detectChanges();
    try {
      const datos = await this.adicionalService.obtenerAdicionales();
      this.dataSource.data = datos;
    } catch (error) {
      console.error('Error al cargar adicionales:', error);
      this.notification.error('No se pudieron cargar los servicios adicionales.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE FILTRADO ---
  configurarFiltroPersonalizado() {
    this.dataSource.filterPredicate = (data: Adicional, filter: string) => {
      const searchTerms = JSON.parse(filter);

      const matchNombre = data.nombre.toLowerCase().includes(searchTerms.nombre.toLowerCase());
      
      let matchDisponible = true;
      if (searchTerms.disponible === 'true') {
        matchDisponible = data.disponible === true;
      } else if (searchTerms.disponible === 'false') {
        matchDisponible = data.disponible === false;
      }

      return matchNombre && matchDisponible;
    };
  }

  aplicarFiltros() {
    const searchFilter = {
      nombre: this.filtroNombre,
      disponible: this.filtroDisponible
    };
    this.dataSource.filter = JSON.stringify(searchFilter);
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroDisponible = '';
    this.aplicarFiltros();
  }

  // --- ACCIONES ---
  abrirVisor(adicional: Adicional) {
    this.dialog.open(AdicionalVisorDialogComponent, {
      width: '750px',
      data: adicional
    });
  }

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

  async eliminarAdicional(adicional: Adicional) {
    if (!this.esAdmin) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Adicional',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar <strong>${adicional.nombre}</strong>?`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.adicionalService.eliminarAdicional(adicional.id);
          this.notification.success(`Eliminado correctamente.`);
          await this.cargarAdicionales(); 
        } catch (error) {
          this.notification.error('Error al eliminar.');
        }
      }
    });
  }
}