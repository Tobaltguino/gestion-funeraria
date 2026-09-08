import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Importante para usar [(ngModel)]

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table'; // <-- Agregado MatTableDataSource
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { MatTooltipModule } from '@angular/material/tooltip'; 
import { MatFormFieldModule } from '@angular/material/form-field'; // <-- Agregado
import { MatInputModule } from '@angular/material/input'; // <-- Agregado
import { MatSelectModule } from '@angular/material/select'; // <-- Agregado
import { MatCheckboxModule } from '@angular/material/checkbox'; // <-- Agregado

import { UrnaService } from './services/urna.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { Urna, UrnaTipo, UrnaTamano, UrnaCuerpo } from './models/urna.interface'; // <-- Importamos los Enums
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UrnaDialogComponent } from './urna-dialog/urna-dialog.component';
import { UrnaVisorDialogComponent } from './urna-visor-dialog/urna-visor-dialog.component';

@Component({
  selector: 'app-urnas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // <-- Registrado aquí
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule, // <-- Registrado aquí
    MatInputModule, // <-- Registrado aquí
    MatSelectModule, // <-- Registrado aquí
    MatCheckboxModule // <-- Registrado aquí
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

  // Usamos MatTableDataSource para habilitar el filtrado múltiple nativo de Angular
  dataSource = new MatTableDataSource<Urna>();
  cargando = true;
  esAdmin = false;

  // Agregamos la columna 'detalles'
  columnasMostrar: string[] = ['imagen', 'nombre', 'detalles', 'stock', 'acciones'];

  // --- VARIABLES PARA LOS FILTROS ---
  tipos = Object.values(UrnaTipo);
  tamanos = Object.values(UrnaTamano);
  cuerpos = Object.values(UrnaCuerpo);

  filtroNombre: string = '';
  filtroTipo: string = '';
  filtroTamano: string = '';
  filtroCuerpo: string = '';
  filtroStockCritico: boolean = false;

  async ngOnInit() {
    this.configurarFiltroPersonalizado();
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
      const urnasData = await this.urnaService.obtenerUrnas();
      this.dataSource.data = urnasData; // Asignamos la data al DataSource
    } catch (error) {
      console.error('Error al cargar urnas:', error);
      this.notification.error('No se pudo cargar el inventario de urnas.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE FILTRADO MÚLTIPLE ---
  
  configurarFiltroPersonalizado() {
    // Sobrescribimos cómo Angular Material evalúa cada fila
    this.dataSource.filterPredicate = (data: Urna, filter: string) => {
      const searchTerms = JSON.parse(filter);

      const matchNombre = data.nombre.toLowerCase().includes(searchTerms.nombre.toLowerCase());
      const matchTipo = searchTerms.tipo ? data.tipo_urna === searchTerms.tipo : true;
      const matchTamano = searchTerms.tamano ? data.tamano === searchTerms.tamano : true; 
      const matchCuerpo = searchTerms.cuerpo ? data.cuerpo === searchTerms.cuerpo : true;
      const matchStock = searchTerms.stockCritico ? data.stock_actual <= data.kpi_alerta_stock : true;

      return matchNombre && matchTipo && matchTamano && matchCuerpo && matchStock;
    };
  }

  aplicarFiltros() {
    const searchFilter = {
      nombre: this.filtroNombre,
      tipo: this.filtroTipo,
      tamano: this.filtroTamano,
      cuerpo: this.filtroCuerpo,
      stockCritico: this.filtroStockCritico
    };
    // Pasamos el objeto convertido a string al filtro
    this.dataSource.filter = JSON.stringify(searchFilter);
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroTipo = '';
    this.filtroTamano = '';
    this.filtroCuerpo = '';
    this.filtroStockCritico = false;
    this.aplicarFiltros();
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