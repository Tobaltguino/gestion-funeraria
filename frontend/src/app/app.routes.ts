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

// --- ADMIN ---
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { GestionInventarioComponent } from './features/admin/gestion-inventario/gestion-inventario.component';
import { GestionEmpleadosComponent } from './features/admin/gestion-empleados/gestion-empleados.component';
import { ReportesComponent } from './features/admin/reportes/reportes.component';

// --- EMPLEADO ---
import { EmployeeDashboardComponent } from './features/employee/employee-dashboard/employee-dashboard.component';
import { RegistroServiciosComponent } from './features/employee/registro-servicios/registro-servicios.component';
import { DirectorioClientesComponent } from './features/employee/directorio-clientes/directorio-clientes.component';
import { CatalogoComponent } from './features/employee/catalogo/catalogo.component';

export const routes: Routes = [
  // ==========================================
  // 0. RUTAS PÚBLICAS Y AUTH
  // ==========================================
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'update-password', component: UpdatePasswordComponent },

  // ==========================================
  // 1. RUTA ADMIN
  // ==========================================
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [authGuard], 
    data: { roles: [Role.ADMIN] },      
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: AdminDashboardComponent },
      { path: 'inventario', component: GestionInventarioComponent },
      { path: 'empleados', component: GestionEmpleadosComponent },
      { path: 'reportes', component: ReportesComponent },
    ]
  },

  // ==========================================
  // 2. RUTA EMPLEADO
  // ==========================================
  {
    path: 'empleado',
    component: LayoutComponent,
    canActivate: [authGuard], 
    data: { roles: [Role.EMPLEADO] },
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: EmployeeDashboardComponent },
      { path: 'registro-servicios', component: RegistroServiciosComponent },
      { path: 'directorio', component: DirectorioClientesComponent },
      { path: 'catalogo', component: CatalogoComponent },
    ]
  },

  // ==========================================
  // 3. Ruta comodín (404 / Fallback)
  // ==========================================
  { path: '**', redirectTo: '' } 
];