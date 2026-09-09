import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Servicios y Modelos
import { CatalogoService } from '../services/catalogo.service';
import { PlanFunerario } from '../models/catalogo.interface';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CatalogoDialogComponent } from '../catalogo-dialog/catalogo-dialog.component';

@Component({
  selector: 'app-catalogo-gestion-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatTooltipModule
  ],
  templateUrl: './catalogo-gestion-dialog.component.html',
  styleUrls: ['./catalogo-gestion-dialog.component.scss']
})
export class CatalogoGestionDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CatalogoGestionDialogComponent>);
  private catalogoService = inject(CatalogoService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<PlanFunerario>();
  cargando = true;
  columnasMostrar: string[] = ['imagen', 'plan', 'caracteristicas', 'acciones'];

  async ngOnInit() {
    await this.cargarPlanes();
  }

  async cargarPlanes() {
    this.cargando = true;
    this.cdr.detectChanges();
    try {
      const planesData = await this.catalogoService.obtenerPlanes();
      this.dataSource.data = planesData;
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      this.notification.error('No se pudieron cargar los planes.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  abrirDialogoFormulario(plan?: PlanFunerario) {
    
    const dialogRef = this.dialog.open(CatalogoDialogComponent, {
      width: '650px',
      disableClose: true,
      data: plan || null
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo) this.cargarPlanes();
    });
  }

  async eliminarPlan(plan: PlanFunerario) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Plan',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar el plan <strong>${plan.nombre}</strong>? Esta acción no se puede deshacer.`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.catalogoService.eliminarPlan(plan.id);
          this.notification.success(`Plan eliminado correctamente.`);
          await this.cargarPlanes(); 
        } catch (error) {
          this.notification.error('Hubo un error al intentar eliminar el plan.');
        }
      }
    });
  }

  cerrarDialogo() {
    this.dialogRef.close();
  }
}