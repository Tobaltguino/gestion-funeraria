import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SupabaseService } from '../../../../core/supabase/supabase';

@Component({
  selector: 'app-urna-selector-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './urna-selector-dialog.component.html'
})
export class UrnaSelectorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UrnaSelectorDialogComponent>);
  private supabaseService = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef); // <-- Inyectamos ChangeDetectorRef

  cargando = true;
  dataSource = new MatTableDataSource<any>([]);
  columnasMostrar: string[] = ['nombre', 'tipo', 'tamano', 'cuerpo', 'stock', 'accion'];

  // Filtros
  busqueda = '';
  tipoFiltro = '';
  tamanoFiltro = '';
  cuerpoFiltro = '';

  // Opciones únicas extraídas de la BD
  tipos: string[] = [];
  tamanos: string[] = [];
  cuerpos: string[] = [];

  async ngOnInit() {
    // Configurar la lógica de filtrado personalizada para MatTable
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      // Manejamos posibles nulos para evitar errores
      const searchStr = ((data.nombre || '') + (data.tipo_urna || '') + (data.tamano || '') + (data.cuerpo || '')).toLowerCase();
      
      const cumpleBusqueda = searchStr.includes(this.busqueda.toLowerCase());
      const cumpleTipo = this.tipoFiltro ? data.tipo_urna === this.tipoFiltro : true;
      const cumpleTamano = this.tamanoFiltro ? data.tamano === this.tamanoFiltro : true;
      const cumpleCuerpo = this.cuerpoFiltro ? data.cuerpo === this.cuerpoFiltro : true;
      
      return cumpleBusqueda && cumpleTipo && cumpleTamano && cumpleCuerpo;
    };

    await this.cargarUrnas();
  }

  async cargarUrnas() {
    this.cargando = true;
    this.cdr.detectChanges(); // <-- Forzamos mostrar el spinner

    const { data, error } = await this.supabaseService.client
      .from('inv_urnas')
      .select('id, nombre, tipo_urna, tamano, cuerpo, stock_actual, precio_costo')
      .is('fecha_eliminacion', null);

    if (!error && data) {
      this.dataSource.data = data;
      
      // Extraer opciones únicas para los filtros desplegables
      this.tipos = [...new Set(data.map(u => u.tipo_urna).filter(Boolean))];
      this.tamanos = [...new Set(data.map(u => u.tamano).filter(Boolean))];
      this.cuerpos = [...new Set(data.map(u => u.cuerpo).filter(Boolean))];
    } else {
      console.error('Error al cargar urnas:', error);
    }

    this.cargando = false;
    this.cdr.detectChanges(); // <-- Forzamos quitar el spinner y dibujar la tabla
  }

  aplicarFiltros() {
    // Al asignar un valor a filter, Angular Material ejecuta el filterPredicate automáticamente
    this.dataSource.filter = Math.random().toString(); 
    this.cdr.detectChanges(); // <-- Forzamos la actualización visual inmediata de la tabla
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.tipoFiltro = '';
    this.tamanoFiltro = '';
    this.cuerpoFiltro = '';
    this.aplicarFiltros(); 
    // aplicarFiltros ya tiene el detectChanges() adentro, así que no hace falta repetirlo aquí
  }

  seleccionarUrna(urna: any) {
    this.dialogRef.close(urna);
  }

  cerrar() {
    this.dialogRef.close(null);
  }
}