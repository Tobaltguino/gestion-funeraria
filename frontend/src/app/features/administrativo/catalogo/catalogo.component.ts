import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';

// Servicios y Modelos
import { CatalogoService } from './services/catalogo.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { PlanFunerario } from './models/catalogo.interface';

// Componentes Modales
import { CatalogoGestionDialogComponent } from './catalogo-gestion-dialog/catalogo-gestion-dialog.component';
import { CatalogoVisorDialogComponent } from './catalogo-visor-dialog/catalogo-visor-dialog.component';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule, 
    MatDialogModule,
    MatRippleModule
  ],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss']
})
export class CatalogoComponent implements OnInit {
  private catalogoService = inject(CatalogoService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  planes: PlanFunerario[] = [];
  cargando = true;
  esAdmin = false;

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarPlanes();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN;
    }
  }

  async cargarPlanes() {
    this.cargando = true;
    this.cdr.detectChanges();
    try {
      this.planes = await this.catalogoService.obtenerPlanes();
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      this.notification.error('No se pudo cargar el catálogo de servicios.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  abrirVisor(plan: PlanFunerario) {
    this.dialog.open(CatalogoVisorDialogComponent, {
      width: '800px',
      data: plan
    });
  }

  abrirGestionAdmin() {
    if (!this.esAdmin) return;
    
    // Abre el modal de la tabla de gestión
    const dialogRef = this.dialog.open(CatalogoGestionDialogComponent, {
      width: '900px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      // Recargamos el landing en caso de que el admin haya editado, eliminado o creado algo
      this.cargarPlanes();
    });
  }
}