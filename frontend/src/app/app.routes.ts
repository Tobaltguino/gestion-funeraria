import { Routes } from '@angular/router';

// --- GUARDS Y ENUMS ---
import { authGuard } from './core/auth/auth.guard';
import { Role } from './shared/enums/role.enum';

// --- LAYOUT ---
import { LayoutComponent } from './features/layout/layout.component';

// --- HOME & AUTH ---
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { UpdatePasswordComponent } from './features/auth/update-password/update-password.component';

// --- NUEVOS COMPONENTES POR DOMINIO ---
import { DashboardComponent } from './features/dashboard/dashboard.component';

import { ServiciosComponent } from './features/administrativo/servicios/servicios.component';
import { AgendaCarrozaComponent } from './features/administrativo/agenda-carroza/agenda-carroza.component';
import { CatalogoComponent } from './features/administrativo/catalogo/catalogo.component';

import { UrnasComponent } from './features/inventario/urnas/urnas.component';
import { CarrozasComponent } from './features/inventario/carrozas/carrozas.component';
import { AdicionalesComponent } from './features/inventario/adicionales/adicionales.component';
import { PedidosComponent } from './features/inventario/pedidos/pedidos.component';

import { MovimientosCajaComponent } from './features/finanzas/movimientos-caja/movimientos-caja.component';

import { UsuariosComponent } from './features/sistema/usuarios/usuarios.component';
import { AuditoriaComponent } from './features/sistema/auditoria/auditoria.component';

export const routes: Routes = [
  // ==========================================
  // 0. RUTAS PÚBLICAS Y AUTH
  // ==========================================
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'update-password', component: UpdatePasswordComponent },

  // ==========================================
  // 1. RUTAS PROTEGIDAS (LAYOUT ÚNICO)
  // ==========================================
  {
    path: '', 
    component: LayoutComponent,
    canActivate: [authGuard], 
    children: [
      
      // --- PRINCIPAL (Ambos) ---
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },

      // --- ADMINISTRATIVO (Ambos) ---
      { 
        path: 'catalogo', 
        component: CatalogoComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },
      { 
        path: 'servicios', 
        component: ServiciosComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },
      { 
        path: 'agenda', 
        component: AgendaCarrozaComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },

      // --- INVENTARIO (Ambos) ---
      { 
        path: 'inventario/urnas', 
        component: UrnasComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },
      { 
        path: 'inventario/carrozas', 
        component: CarrozasComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },
      { 
        path: 'inventario/adicionales', 
        component: AdicionalesComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },
      { 
        path: 'inventario/pedidos', 
        component: PedidosComponent,
        data: { roles: [Role.ADMIN, Role.EMPLEADO] } 
      },

      // --- FINANZAS (SOLO ADMIN) ---
      { 
        path: 'finanzas/caja', 
        component: MovimientosCajaComponent,
        data: { roles: [Role.ADMIN] } 
      },

      // --- SISTEMA (SOLO ADMIN) ---
      { 
        path: 'sistema/usuarios', 
        component: UsuariosComponent,
        data: { roles: [Role.ADMIN] } 
      },
      { 
        path: 'sistema/auditoria', 
        component: AuditoriaComponent,
        data: { roles: [Role.ADMIN] } 
      }
    ]
  },

  // ==========================================
  // 2. Ruta comodín (404 / Fallback)
  // ==========================================
  { path: '**', redirectTo: '' } 
];