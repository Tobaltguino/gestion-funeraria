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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // <-- NUEVO IMPORT

import { UrnaService } from './services/urna.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { Urna, UrnaTipo, UrnaTamano, UrnaCuerpo } from './models/urna.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UrnaDialogComponent } from './urna-dialog/urna-dialog.component';
import { UrnaStockCriticoDialogComponent } from './urna-stock-critico-dialog/urna-stock-critico-dialog.component';

import { VisorGaleriaDialogComponent, VisorGaleriaData } from '../../../shared/components/visor-galeria-dialog/visor-galeria-dialog.component';

@Component({
  selector: 'app-urnas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatCheckboxModule,
    MatPaginatorModule // <-- AÑADIDO
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

  @ViewChild(MatPaginator) paginator!: MatPaginator; // <-- AÑADIDO

  dataSource = new MatTableDataSource<Urna>();
  cargando = true;
  esAdmin = false;

  columnasMostrar: string[] = ['imagen', 'nombre', 'detalles', 'stock', 'acciones'];

  // --- VARIABLES DE PAGINACIÓN ---
  totalRegistros = 0;
  pageSize = 20;
  paginaActual = 0;

  // --- VARIABLES PARA LOS FILTROS ---
  tipos = Object.values(UrnaTipo);
  tamanos = Object.values(UrnaTamano);
  cuerpos = Object.values(UrnaCuerpo);

  filtroNombre: string = '';
  filtroTipo: string = '';
  filtroTamano: string = '';
  filtroCuerpo: string = '';

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarUrnas();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN
    }
  }

  async cargarUrnas() {
    this.cargando = true;
    this.cdr.detectChanges();
    
    try {
      const filtros = {
        nombre: this.filtroNombre,
        tipo: this.filtroTipo,
        tamano: this.filtroTamano,
        cuerpo: this.filtroCuerpo
      };

      // Llamamos al nuevo método paginado
      const resultado = await this.urnaService.obtenerUrnasPaginadas(filtros, this.paginaActual, this.pageSize);
      
      this.dataSource.data = resultado.data;
      this.totalRegistros = resultado.total;
    } catch (error) {
      console.error('Error al cargar urnas:', error);
      this.notification.error('No se pudo cargar el inventario de urnas.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE FILTRADO MÚLTIPLE Y PAGINACIÓN ---

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarUrnas();
  }

  aplicarFiltros() {
    this.paginaActual = 0; // Volvemos a la página 1 al buscar
    if (this.paginator) this.paginator.firstPage();
    this.cargarUrnas();
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroTipo = '';
    this.filtroTamano = '';
    this.filtroCuerpo = '';
    this.aplicarFiltros();
  }

  // --- VISOR PARA EMPLEADOS Y ADMIN ---

  abrirVisor(urna: Urna) {
    const dataVisor: VisorGaleriaData = {
      titulo: urna.nombre,
      imagenes: urna.imagenes || [],
      detalles: [
        { icono: 'inventory', etiqueta: 'Stock Actual', valor: `${urna.stock_actual} unidades` }
      ]
    };

    this.dialog.open(VisorGaleriaDialogComponent, {
      width: '750px',
      data: dataVisor
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

  // Stock Crítico
  abrirStockCritico() {
    // Filtramos las urnas que están en estado crítico
    const urnasCriticas = this.dataSource.data.filter(u => u.stock_actual <= u.kpi_alerta_stock);

    this.dialog.open(UrnaStockCriticoDialogComponent, {
      width: '800px',
      data: urnasCriticas
    });
  }
}