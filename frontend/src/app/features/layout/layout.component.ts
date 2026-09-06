import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout'; 
import { MatSidenav } from '@angular/material/sidenav'; 

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
import { Role } from '../../shared/enums/role.enum';

interface OpcionMenu { titulo: string; ruta: string; icono: string; rolesPermitidos: Role[]; }
interface GrupoMenu { seccion: string; opciones: OpcionMenu[]; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatSidenavModule, MatToolbarModule,
    MatListModule, MatIconModule, MatButtonModule, MatMenuModule, MatProgressSpinnerModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav; 

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private breakpointObserver = inject(BreakpointObserver); 

  usuarioActual: PerfilUsuario | null = null;
  menuFiltrado: GrupoMenu[] = [];
  
  cargando = true;
  isCollapsed = false; 
  isMobile = false; 

  // 3. Aplicamos el Enum en todo el menú
  private definicionMenu: GrupoMenu[] = [
    {
      seccion: 'PRINCIPAL',
      opciones: [
        { titulo: 'Inicio', ruta: '/dashboard', icono: 'dashboard', rolesPermitidos: [Role.ADMIN, Role.EMPLEADO] }
      ]
    },
    {
      seccion: 'ADMINISTRATIVO',
      opciones: [
        { titulo: 'Servicios', ruta: '/servicios', icono: 'assignment', rolesPermitidos: [Role.ADMIN, Role.EMPLEADO] },
        { titulo: 'Agenda Carrozas', ruta: '/agenda', icono: 'calendar_month', rolesPermitidos: [Role.ADMIN, Role.EMPLEADO] }
      ]
    },
    {
      seccion: 'INVENTARIO',
      opciones: [
        { titulo: 'Urnas', ruta: '/inventario/urnas', icono: 'inventory_2', rolesPermitidos: [Role.ADMIN, Role.EMPLEADO] },
        { titulo: 'Carrozas', ruta: '/inventario/carrozas', icono: 'directions_car', rolesPermitidos: [Role.ADMIN, Role.EMPLEADO] },
        { titulo: 'Adicionales', ruta: '/inventario/adicionales', icono: 'category', rolesPermitidos: [Role.ADMIN, Role.EMPLEADO] },
        { titulo: 'Pedidos', ruta: '/inventario/pedidos', icono: 'shopping_cart', rolesPermitidos: [Role.ADMIN, Role.EMPLEADO] }
      ]
    },
    {
      seccion: 'FINANZAS',
      opciones: [
        { titulo: 'Movimientos Caja', ruta: '/finanzas/caja', icono: 'account_balance_wallet', rolesPermitidos: [Role.ADMIN] } 
      ]
    },
    {
      seccion: 'SISTEMA',
      opciones: [
        { titulo: 'Usuarios', ruta: '/sistema/usuarios', icono: 'manage_accounts', rolesPermitidos: [Role.ADMIN] },
        { titulo: 'Auditoría', ruta: '/sistema/auditoria', icono: 'history', rolesPermitidos: [Role.ADMIN] }
      ]
    }
  ];

  async ngOnInit() {
    this.breakpointObserver.observe(['(max-width: 959px)']).subscribe(result => {
      this.isMobile = result.matches;
      if (this.isMobile) {
        this.isCollapsed = false; 
      }
      this.cdr.detectChanges();
    });

    try {
      const session = await this.authService.obtenerSesionActual();
      if (!session) {
        this.router.navigate(['/login']);
        return;
      }

      this.usuarioActual = await this.authService.obtenerPerfilUsuario(session.user.id);
      if (this.usuarioActual) {
        this.menuFiltrado = this.definicionMenu.map(grupo => {
          return {
            seccion: grupo.seccion,
            // Casteamos a Role temporalmente por si tu PerfilUsuario lo tiene definido como string genérico
            opciones: grupo.opciones.filter(opcion => opcion.rolesPermitidos.includes(this.usuarioActual!.rol as Role))
          };
        }).filter(grupo => grupo.opciones.length > 0); 
      }
    } catch (error) {
      console.error('Error al cargar el layout', error);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges(); 
    }
  }

  toggleMenu() {
    this.isCollapsed = !this.isCollapsed;
  }

  cerrarMenuMovil() {
    if (this.isMobile && this.sidenav) {
      this.sidenav.close();
    }
  }

  async cerrarSesion() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}