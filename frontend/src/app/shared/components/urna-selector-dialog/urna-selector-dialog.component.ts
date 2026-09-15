import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
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
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // <-- NUEVO IMPORT

import { SupabaseService } from '../../../core/supabase/supabase';

@Component({
  selector: 'app-urna-selector-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule, MatTooltipModule,
    MatPaginatorModule // <-- AÑADIDO
  ],
  templateUrl: './urna-selector-dialog.component.html'
})
export class UrnaSelectorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UrnaSelectorDialogComponent>);
  private supabaseService = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator; // <-- AÑADIDO

  cargando = true;
  dataSource = new MatTableDataSource<any>([]);
  columnasMostrar: string[] = ['nombre', 'tipo', 'tamano', 'cuerpo', 'stock', 'accion'];

  // --- VARIABLES DE PAGINACIÓN ---
  totalRegistros = 0;
  pageSize = 5; // Como es un modal, mostramos menos filas por página
  paginaActual = 0;

  // Filtros
  busqueda = '';
  tipoFiltro = '';
  tamanoFiltro = '';
  cuerpoFiltro = '';

  // Opciones estáticas para los filtros (ajusta según tus Enums)
  tipos: string[] = ['Madera', 'Metal', 'Mármol', 'Ecológica', 'Párvulo'];
  tamanos: string[] = ['Estándar', 'Extra Grande', 'Párvulo'];
  cuerpos: string[] = ['Cuerpo Entero', 'Reducción', 'Cenizas'];

  async ngOnInit() {
    // Ya no usamos filterPredicate porque el filtrado será en el servidor
    await this.cargarUrnas();
  }

  async cargarUrnas() {
    this.cargando = true;
    this.cdr.detectChanges();

    const from = this.paginaActual * this.pageSize;
    const to = from + this.pageSize - 1;

    let query = this.supabaseService.client
      .from('inv_urnas')
      .select('id, nombre, tipo_urna, tamano, cuerpo, stock_actual, precio_costo', { count: 'exact' })
      .is('fecha_eliminacion', null)
      .order('nombre', { ascending: true });

    // Aplicar filtros dinámicos a la consulta
    if (this.busqueda) query = query.ilike('nombre', `%${this.busqueda}%`);
    if (this.tipoFiltro) query = query.eq('tipo_urna', this.tipoFiltro);
    if (this.tamanoFiltro) query = query.eq('tamano', this.tamanoFiltro);
    if (this.cuerpoFiltro) query = query.eq('cuerpo', this.cuerpoFiltro);

    // Ejecutar paginación por rango
    const { data, error, count } = await query.range(from, to);

    if (!error && data) {
      this.dataSource.data = data;
      this.totalRegistros = count || 0;
    } else {
      console.error('Error al cargar urnas:', error);
    }

    this.cargando = false;
    this.cdr.detectChanges();
  }

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarUrnas();
  }

  aplicarFiltros() {
    this.paginaActual = 0; // Al buscar, siempre volvemos a la página 1
    if (this.paginator) this.paginator.firstPage();
    this.cargarUrnas();
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.tipoFiltro = '';
    this.tamanoFiltro = '';
    this.cuerpoFiltro = '';
    this.aplicarFiltros(); 
  }

  seleccionarUrna(urna: any) {
    this.dialogRef.close(urna);
  }

  cerrar() {
    this.dialogRef.close(null);
  }
}