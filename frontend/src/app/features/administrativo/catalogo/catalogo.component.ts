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

import { VisorGaleriaDialogComponent, VisorGaleriaData } from '../../../shared/components/visor-galeria-dialog/visor-galeria-dialog.component';

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
      const dataPlanes = await this.catalogoService.obtenerPlanes();
      
      // ORDENAMIENTO PERSONALIZADO
      const ordenDeseado = ['Fijo', 'Luces', 'Floral', 'Comida', 'Extra'];
      
      dataPlanes.forEach(plan => {
        if (plan.adm_plan_adicionales) {
          plan.adm_plan_adicionales.sort((a, b) => {
            const catA = a.inv_adicionales?.categoria || '';
            const catB = b.inv_adicionales?.categoria || '';
            
            const indexA = ordenDeseado.indexOf(catA);
            const indexB = ordenDeseado.indexOf(catB);
            
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0; // Mantiene el orden original si no coincide
          });
        }
      });

      this.planes = dataPlanes;
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      this.notification.error('No se pudo cargar el catálogo de servicios.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  abrirVisor(plan: PlanFunerario) {
    // Transformamos el arreglo de adicionales (la tabla intermedia) 
    // en el formato de detalles que entiende el visor universal.
    const detallesVisor = (plan.adm_plan_adicionales || []).map(item => {
      // Si la cantidad es mayor a 1, le ponemos "2x ", si no, lo dejamos vacío
      const prefijoCantidad = item.cantidad > 1 ? `${item.cantidad}x ` : '';
      
      return {
        icono: 'check_circle', // Ícono verde o gris estándar de material
        etiqueta: 'Incluye',
        valor: `${prefijoCantidad}${item.inv_adicionales?.nombre || 'Ítem no especificado'}`
      };
    });

    // Construimos la data final
    const dataVisor: VisorGaleriaData = {
      titulo: plan.nombre,
      imagenes: plan.imagenes || [],
      detalles: detallesVisor
    };

    // Abrimos el modal
    this.dialog.open(VisorGaleriaDialogComponent, {
      width: '750px',
      data: dataVisor
    });
  }

  abrirGestionAdmin() {
    if (!this.esAdmin) return;
    
    const dialogRef = this.dialog.open(CatalogoGestionDialogComponent, {
      width: '900px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(() => {
      this.cargarPlanes();
    });
  }
}