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
import { CarrozaService } from './services/carroza.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

// Importa tus componentes de diálogo (Ajusta las rutas si es necesario)
import { CarrozaDialogComponent } from './carroza-dialog/carroza-dialog.component';
import { CarrozaVisorDialogComponent } from './carroza-visor-dialog/carroza-visor-dialog.component';

// Importa la Interfaz y los Enums
import { Carroza, CarrozaColor, CarrozaEstado, CarrozaMarca } from './models/carroza.interface';

@Component({
  selector: 'app-carrozas',
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
    MatSelectModule
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

  dataSource = new MatTableDataSource<Carroza>();
  cargando = true;
  esAdmin = false;

  // Columnas de la tabla
  columnasMostrar: string[] = ['imagen', 'vehiculo', 'patente', 'estado', 'acciones'];

  // Variables para Filtros
  marcas = Object.values(CarrozaMarca);
  colores = Object.values(CarrozaColor);
  estados = Object.values(CarrozaEstado);

  filtroPatente: string = '';
  filtroMarca: string = '';
  filtroColor: string = '';
  filtroEstado: string = '';

  async ngOnInit() {
    this.configurarFiltroPersonalizado();
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
      const carrozasData = await this.carrozaService.obtenerCarrozas();
      this.dataSource.data = carrozasData;
    } catch (error) {
      console.error('Error al cargar carrozas:', error);
      this.notification.error('No se pudo cargar el inventario de carrozas.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE FILTRADO MÚLTIPLE ---
  configurarFiltroPersonalizado() {
    this.dataSource.filterPredicate = (data: Carroza, filter: string) => {
      const searchTerms = JSON.parse(filter);

      const matchPatente = data.patente.toLowerCase().includes(searchTerms.patente.toLowerCase());
      const matchMarca = searchTerms.marca ? data.marca === searchTerms.marca : true;
      const matchColor = searchTerms.color ? data.color === searchTerms.color : true;
      const matchEstado = searchTerms.estado ? data.estado === searchTerms.estado : true;

      return matchPatente && matchMarca && matchColor && matchEstado;
    };
  }

  aplicarFiltros() {
    const searchFilter = {
      patente: this.filtroPatente,
      marca: this.filtroMarca,
      color: this.filtroColor,
      estado: this.filtroEstado
    };
    this.dataSource.filter = JSON.stringify(searchFilter);
  }

  limpiarFiltros() {
    this.filtroPatente = '';
    this.filtroMarca = '';
    this.filtroColor = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  // --- ACCIONES DE LOS DIÁLOGOS ---
  abrirVisor(carroza: Carroza) {
    this.dialog.open(CarrozaVisorDialogComponent, {
      width: '750px',
      data: carroza
    });
  }

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
        mensaje: `¿Estás seguro de eliminar la carroza patente <strong>${carroza.patente}</strong>?`,
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