import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// Servicios y Componentes
import { ServiciosService } from './services/servicios.service';
import { SupabaseService } from '../../../core/supabase/supabase';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { ServicioContratado } from './models/servicio.interface';
import { ServicioDialogComponent } from './servicio-dialog/servicio-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UrnaSelectorDialogComponent } from '../../../shared/components/urna-selector-dialog/urna-selector-dialog.component';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatTooltipModule,
    MatDialogModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss']
})
export class ServiciosComponent implements OnInit {
  private serviciosService = inject(ServiciosService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<ServicioContratado>();
  columnasMostrar: string[] = ['folio', 'fecha', 'fallecido', 'entidad', 'plan', 'estado', 'acciones'];
  
  cargando = true;
  esAdmin = false;

  // Variables de Paginación
  totalRegistros = 0;
  pageSize = 20;
  paginaActual = 0;

  // Formulario y Listas de Filtros
  filtrosForm: FormGroup;
  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];
  anios = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  
  planesDisponibles: any[] = [];
  carrozasDisponibles: any[] = [];
  urnaSeleccionadaNombre: string = ''; // <-- NUEVO: Para mostrar el nombre en el input

  constructor() {
    const fechaActual = new Date();
    this.filtrosForm = this.fb.group({
      mes: [fechaActual.getMonth() + 1],
      anio: [fechaActual.getFullYear()],
      folio: [''],
      nombre_fallecido: [''],
      entidad_pagadora: [''],
      estado: [''],
      plan_base_id: [''],
      urna_id: [''],
      carroza_id: ['']
    });
  }

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarCatalogosFiltros();
    await this.cargarServicios();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN
    }
  }

  async cargarCatalogosFiltros() {
    const supabase = this.supabaseService.client;
    
    // Solo cargamos planes y carrozas. Las urnas se buscarán por demanda en el modal.
    const [reqPlanes, reqCarrozas] = await Promise.all([
      supabase.from('adm_catalogo_planes').select('id, nombre').is('fecha_eliminacion', null),
      supabase.from('inv_carrozas').select('id, patente').is('fecha_eliminacion', null)
    ]);

    this.planesDisponibles = reqPlanes.data || [];
    this.carrozasDisponibles = reqCarrozas.data || [];
  }

  async cargarServicios() {
    this.cargando = true;
    this.cdr.detectChanges();
    
    try {
      const filtros = this.filtrosForm.getRawValue();
      const resultado = await this.serviciosService.obtenerServiciosPaginados(filtros, this.paginaActual, this.pageSize);
      
      this.dataSource.data = resultado.data;
      this.totalRegistros = resultado.total;
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      this.notification.error('No se pudieron cargar los servicios contratados.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarServicios();
  }
  
  limpiarFiltros() {
    const fechaActual = new Date();
    this.filtrosForm.reset({
      mes: fechaActual.getMonth() + 1,
      anio: fechaActual.getFullYear(),
      folio: '', 
      nombre_fallecido: '', 
      entidad_pagadora: '', 
      estado: '', 
      plan_base_id: '', 
      urna_id: '', 
      carroza_id: ''
    });
    this.urnaSeleccionadaNombre = ''; // <-- Limpiamos el nombre
    this.aplicarFiltros();
  }

  // --- LÓGICA DEL SELECTOR DE URNAS ---
  abrirSelectorUrnaFiltro() {
    const dialogRef = this.dialog.open(UrnaSelectorDialogComponent, {
      width: '900px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(urna => {
      if (urna) {
        this.filtrosForm.patchValue({ urna_id: urna.id });
        this.urnaSeleccionadaNombre = urna.nombre;
        this.cdr.detectChanges();
      }
    });
  }

  removerFiltroUrna(event: Event) {
    event.stopPropagation(); // Evita que se abra el modal al hacer clic en la "X"
    this.filtrosForm.patchValue({ urna_id: '' });
    this.urnaSeleccionadaNombre = '';
    this.cdr.detectChanges();
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

  aplicarFiltros() {
    this.paginaActual = 0; // Volvemos a la página 1
    if (this.paginator) this.paginator.firstPage();
    this.cargarServicios();
  }
}