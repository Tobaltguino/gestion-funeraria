import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth/auth.service';
import { PerfilUsuario } from '../../core/auth/auth.interface';

// 1. Nuevas interfaces para agrupar el menú
interface OpcionMenu {
  titulo: string;
  ruta: string;
  icono: string;
  rolesPermitidos: string[];
}

interface GrupoMenu {
  seccion: string;
  opciones: OpcionMenu[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioActual: PerfilUsuario | null = null;
  menuFiltrado: GrupoMenu[] = [];
  cargando = true;

  // 2. Estructura del menú basado en tus tablas
  private definicionMenu: GrupoMenu[] = [
    {
      seccion: 'PRINCIPAL',
      opciones: [
        { titulo: 'Inicio', ruta: '/dashboard', icono: 'dashboard', rolesPermitidos: ['admin', 'empleado'] }
      ]
    },
    {
      seccion: 'ADMINISTRATIVO',
      opciones: [
        { titulo: 'Servicios', ruta: '/servicios', icono: 'assignment', rolesPermitidos: ['admin', 'empleado'] },
        { titulo: 'Agenda Carrozas', ruta: '/agenda', icono: 'calendar_month', rolesPermitidos: ['admin', 'empleado'] }
      ]
    },
    {
      seccion: 'INVENTARIO',
      opciones: [
        { titulo: 'Urnas', ruta: '/inventario/urnas', icono: 'inventory_2', rolesPermitidos: ['admin', 'empleado'] },
        { titulo: 'Carrozas', ruta: '/inventario/carrozas', icono: 'directions_car', rolesPermitidos: ['admin', 'empleado'] },
        { titulo: 'Adicionales', ruta: '/inventario/adicionales', icono: 'category', rolesPermitidos: ['admin', 'empleado'] },
        { titulo: 'Pedidos', ruta: '/inventario/pedidos', icono: 'shopping_cart', rolesPermitidos: ['admin', 'empleado'] }
      ]
    },
    {
      seccion: 'FINANZAS',
      opciones: [
        // Solo Admin puede ver finanzas
        { titulo: 'Movimientos Caja', ruta: '/finanzas/caja', icono: 'account_balance_wallet', rolesPermitidos: ['admin'] } 
      ]
    },
    {
      seccion: 'SISTEMA',
      opciones: [
        // Solo Admin gestiona usuarios y auditoría
        { titulo: 'Usuarios', ruta: '/sistema/usuarios', icono: 'manage_accounts', rolesPermitidos: ['admin'] },
        { titulo: 'Auditoría', ruta: '/sistema/auditoria', icono: 'history', rolesPermitidos: ['admin'] }
      ]
    }
  ];

  async ngOnInit() {
    try {
      const session = await this.authService.obtenerSesionActual();

      if (!session) {
        this.router.navigate(['/login']);
        return;
      }

      this.usuarioActual = await this.authService.obtenerPerfilUsuario(session.user.id);
      
      if (this.usuarioActual) {
        // 3. Filtramos las opciones dentro de cada grupo y eliminamos los grupos vacíos
        this.menuFiltrado = this.definicionMenu.map(grupo => {
          return {
            seccion: grupo.seccion,
            opciones: grupo.opciones.filter(opcion => opcion.rolesPermitidos.includes(this.usuarioActual!.rol))
          };
        }).filter(grupo => grupo.opciones.length > 0); // Si un grupo queda sin opciones (ej. Finanzas para empleado), no se muestra
      }
    } catch (error) {
      console.error('Error al cargar el layout', error);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges(); 
    }
  }

  async cerrarSesion() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}