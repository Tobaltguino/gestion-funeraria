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

import * as html2pdfTemplate from 'html2pdf.js';

const html2pdf: any = (html2pdfTemplate as any).default || html2pdfTemplate;

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
  // 🔥 ACTUALIZADO: Se agregó 'valor' antes de las acciones
  columnasMostrar: string[] = ['imagen', 'plan', 'caracteristicas', 'valor', 'acciones'];

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

  imprimirCatalogo() {
    this.notification.success('Generando PDF, por favor espere...');
    
    const rutaLogoNegro = 'assets/logo-funeraria-negro.svg';
    const rutaLogoBlanco = 'assets/logo-funeraria-blanco.svg'; 
    const planes = this.dataSource.data;

    // 1. GENERAMOS LA PORTADA OSCURA
    const portadaHTML = `
      <div class="pagina-pdf portada">
        <div class="portada-header">
          <img src="${rutaLogoBlanco}" class="logo-portada">
        </div>
        <div class="portada-centro">
          <h1>Catálogo<br>Servicios Funerarios</h1>
        </div>
        <div class="portada-footer">
          <p>+569 71090319 - +569 94586410 - +569 52292234</p>
          <p>funeraria.alaluzdecristo@hotmail.com</p>
          <p>funeraria.alaluzdecristo &nbsp;|&nbsp; Funeraria a La Luz de Cristo - Arica</p>
        </div>
        <div class="decoracion-portada"></div>
      </div>
    `;

    // 2. GENERAMOS CADA PLAN EN FORMATO 2 COLUMNAS
    const planesHTML = planes.map(plan => {
      const imgPrincipal = plan.imagenes && plan.imagenes.length > 0 ? plan.imagenes[0] : '';
      const imgMini1 = plan.imagenes && plan.imagenes.length > 1 ? plan.imagenes[1] : '';
      const imgMini2 = plan.imagenes && plan.imagenes.length > 2 ? plan.imagenes[2] : '';

      const valorHTML = plan.valor && plan.valor > 0 
        ? `<div class="valor-plan">Valor: $${new Intl.NumberFormat('es-CL').format(plan.valor)}</div>` 
        : '';

      const servicios = plan.adm_plan_adicionales || [];
      const listaServiciosHTML = servicios.map(rel => {
        const nombreServicio = rel.inv_adicionales?.nombre || 'Servicio adicional';
        return `<li>${nombreServicio}</li>`;
      }).join('');

      return `
        <div class="pagina-pdf pagina-plan">
          <div class="decoracion-plan"></div>
          <div class="plan-header">
             <img src="${rutaLogoNegro}" class="logo-plan-encabezado">
          </div>
          <div class="plan-contenido">
            
            <div class="columna-izquierda">
              <div class="textos-superiores">
                <h2 class="titulo-plan">${plan.nombre}</h2>
                <ul class="lista-servicios">
                  ${listaServiciosHTML}
                </ul>
                ${valorHTML}
              </div>
              
              <div class="miniaturas-container">
                ${imgMini1 ? `<img src="${imgMini1}" class="img-miniatura">` : `<div class="placeholder-miniatura">Foto 2</div>`}
                ${imgMini2 ? `<img src="${imgMini2}" class="img-miniatura">` : `<div class="placeholder-miniatura">Foto 3</div>`}
              </div>
            </div>

            <div class="columna-derecha">
              ${imgPrincipal 
                ? `<img src="${imgPrincipal}" class="img-principal">` 
                : `<div class="placeholder-principal">Foto 1 Principal</div>`}
            </div>
            
          </div>
        </div>
      `;
    }).join('');

    // 3. ARMAMOS EL CONTENEDOR INVISIBLE PARA LA LIBRERÍA
    const contenedorTemporal = document.createElement('div');
    contenedorTemporal.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Merriweather:wght@300;700&display=swap');
        
        * { box-sizing: border-box; }
        
        .pdf-wrapper {
          font-family: 'Roboto', Arial, sans-serif;
          color: #222;
          background-color: #fff;
          width: 1056px; /* Ancho en píxeles equivalente a carta horizontal */
        }

        .pagina-pdf {
          width: 1056px;
          height: 816px; /* Alto en píxeles equivalente a carta horizontal */
          position: relative;
          overflow: hidden;
          page-break-after: always;
        }
        
        /* PORTADA */
        .portada {
          background-color: #1a1a1a;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px 80px;
          position: relative;
          z-index: 1;
        }
        .portada-header { text-align: right; z-index: 2; }
        .logo-portada { height: 120px; object-fit: contain; }
        .portada-centro { flex-grow: 1; display: flex; align-items: center; z-index: 2; }
        .portada-centro h1 { 
          font-family: 'Merriweather', serif; 
          font-size: 55px; line-height: 1.2; font-weight: 300; margin: 0;
        }
        .portada-footer { z-index: 2; border-top: 1px solid #444; padding-top: 20px; font-size: 14px; color: #ccc;}
        .portada-footer p { margin: 5px 0; display: flex; align-items: center; }
        .decoracion-portada {
          position: absolute; bottom: 0; right: 0; width: 50%; height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0) 50%, rgba(255,255,255,0.03) 50%);
          z-index: 0;
        }

        /* PLANES */
        .pagina-plan {
          background-color: #fff;
          padding: 40px 60px;
          display: flex;
          flex-direction: column;
        }
        .decoracion-plan {
          position: absolute; bottom: 0; left: 0; width: 100%; height: 30%;
          background: #f0f0f0; clip-path: polygon(0 40%, 100% 0, 100% 100%, 0% 100%); z-index: -1;
        }
        .plan-header { text-align: right; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .logo-plan-encabezado { height: 70px; object-fit: contain; }
        
        .plan-contenido {
          display: flex; /* Cambiado a flex para mayor compatibilidad con html2pdf */
          justify-content: space-between;
          flex-grow: 1;
        }
        .columna-izquierda { width: 48%; display: flex; flex-direction: column; justify-content: space-between; }
        .columna-derecha { width: 48%; display: flex; align-items: stretch; }

        .titulo-plan {
          font-family: 'Merriweather', serif; font-size: 32px; font-weight: 700; color: #000;
          margin: 0 0 15px 0; border-bottom: 1px solid #ccc; padding-bottom: 10px;
        }
        .lista-servicios { font-size: 16px; line-height: 1.8; margin: 0 0 20px 20px; padding: 0; }
        .lista-servicios li { margin-bottom: 8px; padding-left: 5px; list-style-type: disc; }
        .valor-plan { font-size: 18px; font-weight: 700; color: #000; margin-bottom: 20px; }

        .miniaturas-container { display: flex; justify-content: space-between; height: 160px; gap: 15px; }
        .img-miniatura { width: 48%; height: 100%; object-fit: cover; border-radius: 8px; }
        .placeholder-miniatura { width: 48%; height: 100%; background-color: #f5f5f5; border: 1px dashed #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; }

        .img-principal { width: 100%; height: 95%; object-fit: cover; border-radius: 12px; }
        .placeholder-principal { width: 100%; height: 95%; background-color: #f5f5f5; border: 2px dashed #ccc; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #999; }
      </style>
      
      <div class="pdf-wrapper">
        ${portadaHTML}
        ${planesHTML}
      </div>
    `;

    // 4. CONFIGURAMOS Y EJECUTAMOS LA DESCARGA AUTOMÁTICA
    const opciones = {
      margin:       0,
      filename:     'Catalogo_A_La_Luz_De_Cristo.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // scale 2 da mejor resolución
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    // Esto genera el PDF en silencio y lo descarga
    html2pdf().set(opciones).from(contenedorTemporal).save().then(() => {
      this.notification.success('El catálogo se ha descargado exitosamente.');
    }).catch((err: any) => {
      console.error(err);
      this.notification.error('Hubo un error al generar el PDF.');
    });
  }

  cerrarDialogo() {
    this.dialogRef.close();
  }
}