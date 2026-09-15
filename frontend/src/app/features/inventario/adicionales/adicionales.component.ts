import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
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
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // <-- NUEVO IMPORT

// Servicios y Modelos
import { AdicionalService } from './services/adicional.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AdicionalDialogComponent } from './adicional-dialog/adicional-dialog.component';
import { AdicionalVisorDialogComponent } from './adicional-visor-dialog/adicional-visor-dialog.component';
import { Adicional, CategoriaAdicional } from './models/adicional.interface';

@Component({
  selector: 'app-adicionales',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule // <-- AÑADIDO
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

  @ViewChild(MatPaginator) paginator!: MatPaginator; // <-- AÑADIDO

  dataSource = new MatTableDataSource<Adicional>();
  cargando = true;
  esAdmin = false;

  columnasMostrar: string[] = ['imagen', 'servicio', 'categoria', 'descripcion', 'estado', 'acciones'];
  listaCategorias: string[] = Object.values(CategoriaAdicional);

  // --- VARIABLES DE PAGINACIÓN ---
  totalRegistros = 0;
  pageSize = 20;
  paginaActual = 0;

  // Variables para filtros
  filtroNombre: string = '';
  filtroDisponible: string = ''; 
  filtroCategoria: string = '';

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarAdicionales();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN
    }
  }

  async cargarAdicionales() {
    this.cargando = true;
    this.cdr.detectChanges();
    try {
      const filtros = {
        nombre: this.filtroNombre,
        disponible: this.filtroDisponible,
        categoria: this.filtroCategoria
      };

      const resultado = await this.adicionalService.obtenerAdicionalesPaginadas(filtros, this.paginaActual, this.pageSize);
      
      this.dataSource.data = resultado.data;
      this.totalRegistros = resultado.total;
    } catch (error) {
      console.error('Error al cargar adicionales:', error);
      this.notification.error('No se pudieron cargar los servicios adicionales.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarAdicionales();
  }

  aplicarFiltros() {
    this.paginaActual = 0; // Volvemos a la página 1
    if (this.paginator) this.paginator.firstPage();
    this.cargarAdicionales();
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroDisponible = '';
    this.filtroCategoria = '';
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