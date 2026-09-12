import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Urna } from '../models/urna.interface';

@Component({
  selector: 'app-urna-stock-critico-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './urna-stock-critico-dialog.component.html'
})
export class UrnaStockCriticoDialogComponent {
  public dialogRef = inject(MatDialogRef<UrnaStockCriticoDialogComponent>);
  public urnasCriticas = inject(MAT_DIALOG_DATA) as Urna[];
  
  columnas: string[] = ['modelo', 'tipo', 'tamano', 'cuerpo', 'stock'];

  cerrar() {
    this.dialogRef.close();
  }

  imprimirYDescargar() {
    const rutaLogo = 'assets/logo-funeraria-negro.svg';

    const filasHTML = this.urnasCriticas.map(urna => `
      <tr>
        <td><strong>${urna.nombre}</strong></td>
        <td style="text-transform: capitalize;">${urna.tipo_urna || '-'}</td>
        <td style="text-transform: capitalize;">${urna.tamano || '-'}</td>
        <td style="text-transform: capitalize;">${urna.cuerpo || '-'}</td>
        <td class="critico text-center">
          ${urna.stock_actual} un. <br>
          <small class="kpi-text">(Mín: ${urna.kpi_alerta_stock})</small>
        </td>
      </tr>
    `).join('');

    const ventana = window.open('', '', 'width=900,height=700');
    
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <base href="${window.location.origin}/">
            <title>Reporte Stock Crítico - A la luz de Cristo</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=PT+Serif:wght@400;700&display=swap');
              
              :root {
                --color-texto: #111111; 
                --color-texto-suave: #666666;
                --color-linea: #cccccc; 
                --color-brand: #000000;
                --color-brand-contrast: #ffffff;
                --fuente-titulo: 'Playfair Display', Georgia, serif;
                --fuente-texto: 'PT Serif', Georgia, serif;
              }

              @page { margin: 15mm; }
              
              body { 
                font-family: var(--fuente-texto); 
                color: var(--color-texto);
                padding: 0; 
                margin: 0;
              }
              
              /* CABECERA MEMBRETADA (Flexbox para alinear a los lados) */
              .header-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid var(--color-brand);
                padding-bottom: 15px;
                margin-bottom: 30px;
              }
              
              /* Logo más pequeño y ajustado a la izquierda */
              .logo-header {
                height: 55px; /* Tamaño reducido para calzar perfecto */
                object-fit: contain;
              }
              
              /* Textos ajustados a la derecha */
              .header-text {
                text-align: right;
              }
              
              .reporte-titulo {
                font-size: 17px;
                margin: 0;
                color: var(--color-texto-suave);
                text-transform: uppercase;
                letter-spacing: 1px;
                font-family: var(--fuente-titulo);
                font-weight: 700;
              }
              
              .fecha-reporte {
                font-size: 12px;
                color: var(--color-texto-suave);
                margin-top: 4px;
                font-style: italic;
              }
              
              /* Tabla */
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border-bottom: 1px solid var(--color-linea); padding: 12px 10px; text-align: left; font-size: 14px; }
              th { background-color: var(--color-brand); color: var(--color-brand-contrast); font-weight: 500; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; }
              .text-center { text-align: center; }
              .critico { color: #d32f2f; font-weight: bold; }
              .kpi-text { color: var(--color-texto-suave); font-weight: normal; font-size: 11px; }
              
              /* Pie de página */
              .footer { margin-top: 50px; font-size: 11px; color: var(--color-texto-suave); text-align: center; border-top: 1px solid var(--color-linea); padding-top: 15px; }
              
              @media print {
                th { background-color: #111111 !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .critico { color: #d32f2f !important; }
              }
            </style>
          </head>
          <body>
            
            <div class="header-container">
              <!-- Logo a la Izquierda -->
              <img src="${rutaLogo}" alt="Logo Funeraria" class="logo-header" 
                   onload="setTimeout(function() { window.print(); window.close(); }, 200);"
                   onerror="console.warn('Logo bloqueado'); setTimeout(function() { window.print(); window.close(); }, 200);">
              
              <!-- Títulos a la Derecha -->
              <div class="header-text">
                <h2 class="reporte-titulo">Reporte de Stock Crítico: Urnas</h2>
                <div class="fecha-reporte">Emitido el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Tipo</th>
                  <th>Tamaño</th>
                  <th>Cuerpo</th>
                  <th class="text-center">Stock Actual</th>
                </tr>
              </thead>
              <tbody>
                ${filasHTML}
              </tbody>
            </table>

            <div class="footer">
              Este documento es de uso interno exclusivo de Funeraria A la luz de Cristo.
            </div>
          </body>
        </html>
      `);
      ventana.document.close();
      ventana.focus();
    }
  }
}