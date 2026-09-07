import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { MatTooltipModule } from '@angular/material/tooltip';

// Servicios, Modelos y Roles
import { PedidoService } from './services/pedido.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { Pedido } from './models/pedido.interface';
import { NotificationService } from '../../../shared/services/notification.service';

// Componentes Compartidos
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

import { PedidoDialogComponent } from './pedido-dialog/pedido-dialog.component';

@Component({
  selector: 'app-pedidos',
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
  templateUrl: './pedidos.component.html'
})
export class PedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  pedidos: Pedido[] = [];
  cargando = true;
  esAdmin = false;

  // Columnas que se mostrarán en la tabla
  columnasMostrar: string[] = ['urna', 'cantidad', 'fecha_pedido', 'fecha_llegada', 'estado', 'acciones'];

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarPedidos();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN;
    }
  }

  async cargarPedidos() {
    this.cargando = true;
    this.cdr.detectChanges(); // Previene el error NG0100

    try {
      this.pedidos = await this.pedidoService.obtenerPedidos();
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      this.notification.error('No se pudo cargar el registro de pedidos.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
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

    // Usamos el nombre de la urna anidada para el mensaje de confirmación
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