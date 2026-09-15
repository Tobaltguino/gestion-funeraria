import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// Servicios, Modelos y Roles
import { PedidoService } from './services/pedido.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { Pedido } from './models/pedido.interface';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PedidoDialogComponent } from './pedido-dialog/pedido-dialog.component';
import { UrnaSelectorDialogComponent } from '../../../shared/components/urna-selector-dialog/urna-selector-dialog.component';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule
  ],
  templateUrl: './pedidos.component.html'
})
export class PedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<Pedido>();
  cargando = true;
  esAdmin = false;

  columnasMostrar: string[] = ['urna', 'cantidad', 'fecha_pedido', 'fecha_llegada', 'estado', 'acciones'];

  // --- VARIABLES DE PAGINACIÓN ---
  totalRegistros = 0;
  pageSize = 20;
  paginaActual = 0;

  // --- VARIABLES Y FORMULARIO DE FILTROS ---
  filtrosForm: FormGroup;
  urnaSeleccionadaNombre: string = ''; // <-- NUEVO: Para mostrar el nombre en el filtro
  
  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];
  anios = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  estadosPedido = ['Pendiente', 'Recibido', 'Cancelado'];

  constructor() {
    const fechaActual = new Date();
    this.filtrosForm = this.fb.group({
      mes: [fechaActual.getMonth() + 1],
      anio: [fechaActual.getFullYear()],
      urna_id: [''],
      estado_manual: ['']
    });
  }

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarPedidos();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN
    }
  }

  async cargarPedidos() {
    this.cargando = true;
    this.cdr.detectChanges(); 

    try {
      const filtros = this.filtrosForm.getRawValue();
      const resultado = await this.pedidoService.obtenerPedidosPaginados(filtros, this.paginaActual, this.pageSize);
      
      this.dataSource.data = resultado.data;
      this.totalRegistros = resultado.total;
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      this.notification.error('No se pudo cargar el registro de pedidos.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
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
    event.stopPropagation(); 
    this.filtrosForm.patchValue({ urna_id: '' });
    this.urnaSeleccionadaNombre = '';
    this.cdr.detectChanges();
  }

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarPedidos();
  }

  aplicarFiltros() {
    this.paginaActual = 0; 
    if (this.paginator) this.paginator.firstPage();
    this.cargarPedidos();
  }

  limpiarFiltros() {
    const fechaActual = new Date();
    this.filtrosForm.reset({
      mes: fechaActual.getMonth() + 1,
      anio: fechaActual.getFullYear(),
      urna_id: '',
      estado_manual: ''
    });
    this.urnaSeleccionadaNombre = ''; // <-- Limpiamos el nombre visual
    this.aplicarFiltros();
  }

  abrirDialogoPedido(pedido?: Pedido) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(PedidoDialogComponent, {
       width: '500px',
       disableClose: true,
       data: pedido || null
     });

     dialogRef.afterClosed().subscribe(seGuardo => {
       if (seGuardo) this.cargarPedidos();
     });
  }

  async eliminarPedido(pedido: Pedido) {
    if (!this.esAdmin) return;

    const nombreUrna = pedido.urnas?.nombre || 'esta urna';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Pedido',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar el pedido de <strong>${pedido.cantidad} unidades</strong> de <strong>${nombreUrna}</strong>?`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.pedidoService.eliminarPedido(pedido.id);
          this.notification.success(`Pedido eliminado correctamente.`);
          await this.cargarPedidos(); 
        } catch (error) {
          this.notification.error('Hubo un error al intentar eliminar el pedido.');
        }
      }
    });
  }
}