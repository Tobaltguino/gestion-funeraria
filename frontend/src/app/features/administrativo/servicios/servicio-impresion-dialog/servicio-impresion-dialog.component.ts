import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ServicioContratado } from '../models/servicio.interface';

@Component({
  selector: 'app-servicio-impresion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './servicio-impresion-dialog.component.html'
})
export class ServicioImpresionDialogComponent {
  public dialogRef = inject(MatDialogRef<ServicioImpresionDialogComponent>);
  public servicio = inject(MAT_DIALOG_DATA) as ServicioContratado;

  cerrar() {
    this.dialogRef.close();
  }

  // --- FORMATEADORES ---
  formatearDinero(monto: number | undefined): string {
    if (!monto) return '0';
    return new Intl.NumberFormat('es-CL').format(monto);
  }

  formatearFechaLarga(fechaIso: string | undefined): string {
    if (!fechaIso) return '_____ de _______________ de 20___';
    const fecha = new Date(fechaIso);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  }

  imprimirYDescargar() {
    const rutaLogo = 'assets/logo-funeraria-negro.svg';
    
    // Cálculos de IVA (19%)
    const valorTotal = this.servicio.monto || 0;
    const valorNeto = Math.round(valorTotal / 1.19);
    const valorIva = valorTotal - valorNeto;

    const ventana = window.open('', '', 'width=900,height=900');
    
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <base href="${window.location.origin}/">
            <title>Contrato Folio #${this.servicio.folio} - A la luz de Cristo</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
              
              @page { margin: 10mm 15mm; size: letter; }
              
              body { 
                font-family: 'Roboto', Arial, sans-serif; 
                color: #000;
                padding: 0; 
                margin: 0;
                font-size: 13px;
                line-height: 1.4;
              }

              /* --- CABECERA --- */
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
              /* 🔥 Ajustamos anchos para darle más espacio a la fecha */
              .header-izq { display: flex; gap: 15px; align-items: center; width: 50%; }
              .logo { width: 90px; height: 90px; object-fit: contain; }
              .datos-empresa { font-size: 11px; line-height: 1.3; }
              .datos-empresa h1 { font-size: 14px; margin: 0 0 5px 0; font-weight: 700; }
              
              .header-der { width: 48%; text-align: right; display: flex; flex-direction: column; align-items: flex-end;}
              .caja-contrato { 
                border: 2px solid #000; 
                padding: 8px; 
                text-align: center; 
                border-radius: 6px;
                width: 100%;
                margin-bottom: 8px;
              }
              .caja-contrato h2 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
              
              /* --- FILAS CON LÍNEAS --- */
              .fila { display: flex; margin-bottom: 6px; align-items: flex-end; }
              .label { font-weight: 500; margin-right: 5px; white-space: nowrap; }
              .linea { 
                flex-grow: 1; 
                border-bottom: 1px solid #000; 
                min-height: 18px; 
                padding: 0 5px;
                font-family: monospace;
                font-size: 14px;
              }
              .linea-corta { width: 140px; flex-grow: 0; }

              /* --- CAJAS PRINCIPALES --- */
              .seccion-box {
                border: 2px solid #000;
                border-radius: 6px;
                padding: 10px 12px;
                margin-bottom: 10px;
              }
              .titulo-box {
                text-align: center;
                font-weight: 700;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 10px;
                text-decoration: underline;
              }

              /* --- TOTALES --- */
              .totales-container {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                margin-top: 5px;
                margin-bottom: 10px;
                padding-right: 15px;
              }
              .fila-total { display: flex; justify-content: flex-end; align-items: flex-end; margin-bottom: 3px; width: 300px; }
              .fila-total .label { width: 100px; text-align: right; }
              .fila-total .linea { width: 150px; flex-grow: 0; text-align: right; font-weight: bold; }

              /* --- FIRMAS --- */
              .firmas {
                display: flex;
                justify-content: space-between;
                margin-top: 60px;
                padding: 0 30px;
              }
              .firma-linea {
                border-top: 1px solid #000;
                width: 250px;
                text-align: center;
                padding-top: 5px;
                font-weight: 700;
                font-size: 12px;
              }
              
              /* Checkboxes simulados */
              .check-box {
                display: inline-block; width: 15px; height: 15px; border: 1px solid #000; margin-left: 5px; text-align: center; line-height: 15px; font-weight: bold;
              }
            </style>
          </head>
          <body>
            
            <!-- CABECERA -->
            <div class="header">
              <div class="header-izq">
                <img src="${rutaLogo}" class="logo" 
                     onload="setTimeout(function() { window.print(); window.close(); }, 300);"
                     onerror="setTimeout(function() { window.print(); window.close(); }, 300);">
                <div class="datos-empresa">
                  <h1>FUNERARIA<br>A la luz de Cristo</h1>
                  Vicuña Mackenna N° 664<br>
                  Fono: 2426056<br>
                  Cels.: 971090319 - 952282234 - 994586410<br>
                  Arica
                </div>
              </div>
              <div class="header-der">
                <div class="caja-contrato">
                  <h2>Contrato de Servicio<br>Funerario</h2>
                  <div style="margin-top: 5px; font-weight: bold; font-size: 13px;">Folio N° ${this.servicio.folio || '______'}</div>
                </div>
                
                <!-- 🔥 Aumentamos el width a 220px y forzamos white-space nowrap -->
                <div class="fila" style="width: 100%; justify-content: flex-end; margin-top: 4px;">
                  <span class="label">Factura N°:</span>
                  <span class="linea" style="text-align: center; width: 220px; flex-grow: 0;">${this.servicio.factura_numero || ''}</span>
                </div>
                <div class="fila" style="width: 100%; justify-content: flex-end;">
                  <span class="label">Fecha:</span>
                  <span class="linea" style="text-align: center; width: 220px; flex-grow: 0; white-space: nowrap;">${this.formatearFechaLarga(this.servicio.fecha_creada || this.servicio.fecha_servicio)}</span>
                </div>
                
              </div>
            </div>

            <!-- SECCIÓN 1: DATOS DEL SOLICITANTE -->
            <div class="seccion-box">
              <div class="titulo-box">Datos del Solicitante / Contratante</div>
              <div class="fila">
                <span class="label">Señor(a):</span>
                <span class="linea">${this.servicio.solicitante_nombre || ''}</span>
              </div>
              <div class="fila">
                <span class="label">Dirección:</span>
                <span class="linea">${this.servicio.solicitante_direccion || ''}</span>
              </div>
              <div class="fila">
                <span class="label">R.U.T.:</span>
                <span class="linea linea-corta">${this.servicio.solicitante_rut || ''}</span>
                <span class="label" style="margin-left: 15px;">Ciudad:</span>
                <span class="linea">${this.servicio.solicitante_ciudad || 'Arica'}</span>
                <span class="label" style="margin-left: 15px;">Fono:</span>
                <span class="linea linea-corta">${this.servicio.solicitante_fono || ''}</span>
              </div>
            </div>

            <!-- SECCIÓN 2: DATOS DEL FALLECIDO -->
            <div class="seccion-box">
              <div class="titulo-box">Datos del Fallecido</div>
              <div class="fila">
                <span class="label">Nombre:</span>
                <span class="linea">${this.servicio.nombre_fallecido || ''}</span>
                <span class="label" style="margin-left: 15px;">R.U.T.:</span>
                <span class="linea linea-corta">${this.servicio.fallecido_rut || ''}</span>
              </div>
              <div class="fila">
                <span class="label">Retirado desde:</span>
                <span class="linea">${this.servicio.retirado_desde || ''}</span>
              </div>
              <div class="fila">
                <span class="label">Velado en:</span>
                <span class="linea">${this.servicio.velado_en || ''}</span>
                <span class="label" style="margin-left: 15px;">Hora Misa:</span>
                <span class="linea linea-corta">${this.servicio.hora_misa?.substring(0,5) || ''}</span>
              </div>
            </div>

            <!-- SECCIÓN 3: DETALLE DEL SERVICIO -->
            <div class="seccion-box">
              <div class="titulo-box">Detalle del Servicio Funerario</div>
              
              <div class="fila">
                <span class="label">Funeral día:</span>
                <span class="linea">${this.formatearFechaLarga(this.servicio.dia_funeral)}</span>
                <span class="label" style="margin-left: 15px;">Lugar:</span>
                <span class="linea">${this.servicio.lugar_funeral || ''}</span>
                <span class="label" style="margin-left: 15px;">Hora:</span>
                <span class="linea linea-corta">${this.servicio.hora_funeral?.substring(0,5) || ''}</span>
              </div>
              <div class="fila">
                <span class="label">Incluye:</span>
                <span class="linea">Urna ${this.servicio.inv_urnas?.nombre || ''}, Plan ${this.servicio.adm_catalogo_planes?.nombre || 'Personalizado'}</span>
              </div>
              <div class="fila">
                <span class="label">Carroza:</span>
                <span class="linea">${this.servicio.inv_carrozas ? (this.servicio.inv_carrozas.marca + ' ' + this.servicio.inv_carrozas.modelo + ' Patente: ' + this.servicio.inv_carrozas.patente) : ''}</span>
              </div>
            </div>

            <!-- VALORES NETO E IVA -->
            <div class="totales-container">
              <div class="fila-total">
                <span class="label">Valor Neto $</span>
                <span class="linea">${this.formatearDinero(valorNeto)}</span>
              </div>
              <div class="fila-total">
                <span class="label">% I.V.A. $</span>
                <span class="linea">${this.formatearDinero(valorIva)}</span>
              </div>
              <div class="fila-total">
                <span class="label">Valor Total $</span>
                <span class="linea">${this.formatearDinero(valorTotal)}</span>
              </div>
            </div>

            <!-- SECCIÓN 4: DETALLE DE PAGO -->
            <div class="seccion-box">
              <div class="titulo-box">Detalle de Pago</div>
              
              <div class="fila">
                <span class="label">${this.servicio.tipo_entidad || 'Entidad'} $</span>
                <span class="linea linea-corta">${this.formatearDinero(this.servicio.monto_entidad)}</span>
                <span class="label" style="margin-left: 30px;">Más diferencia por $</span>
                <span class="linea">${this.formatearDinero(this.servicio.diferencia)}</span>
              </div>
              <div class="fila">
                <span class="label">Financiador:</span>
                <span class="linea">${this.servicio.entidad_pagadora || ''}</span>
              </div>
              <br>
              <div class="fila">
                <span class="label">Correo:</span>
                <span class="linea">${this.servicio.solicitante_email || ''}</span>
              </div>
              <div class="fila" style="justify-content: space-between; align-items: center; margin-top: 10px;">
                <div style="display: flex; align-items: center; width: 60%;">
                  <span class="label">Acepto comunicar el fallecimiento en RRSS:</span>
                </div>
                <div style="display: flex; gap: 20px;">
                  <div>SI <span class="check-box">${this.servicio.consentimiento_redes ? 'X' : '&nbsp;'}</span></div>
                  <div>NO <span class="check-box">${!this.servicio.consentimiento_redes ? 'X' : '&nbsp;'}</span></div>
                </div>
              </div>
            </div>

            <!-- FIRMAS -->
            <div class="firmas">
              <div class="firma-linea">FIRMA CLIENTE</div>
              <div class="firma-linea">A LA LUZ DE CRISTO</div>
            </div>

          </body>
        </html>
      `);
      ventana.document.close();
      ventana.focus();
    }
  }
}