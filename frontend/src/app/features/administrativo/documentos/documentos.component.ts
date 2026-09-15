import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// Servicios y Modelos
import { DocumentoService } from './services/documento.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../shared/enums/role.enum';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Documento, TipoDocumento } from './models/documento.interface';
import { DocumentoDialogComponent } from './documento-dialog/documento-dialog.component';

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule
  ],
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss']
})
export class DocumentosComponent implements OnInit {
  private documentoService = inject(DocumentoService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<Documento>();
  cargando = true;
  esAdmin = false;

  columnasMostrar: string[] = ['nombre', 'tipo', 'fecha_creada', 'acciones'];

  // --- VARIABLES DE PAGINACIÓN ---
  totalRegistros = 0;
  pageSize = 20;
  paginaActual = 0;

  // --- FORMULARIO Y FILTROS ---
  filtrosForm: FormGroup;
  tiposDocumento = Object.values(TipoDocumento); // ['Importante', 'Varios', 'Legal', 'Contrato']

  constructor() {
    this.filtrosForm = this.fb.group({
      nombre: [''],
      tipo: ['']
    });
  }

  async ngOnInit() {
    await this.verificarRol();
    await this.cargarDocumentos();
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN
    }
  }

  async cargarDocumentos() {
    this.cargando = true;
    this.cdr.detectChanges(); 

    try {
      const filtros = this.filtrosForm.getRawValue();
      const resultado = await this.documentoService.obtenerDocumentosPaginados(filtros, this.paginaActual, this.pageSize);
      
      this.dataSource.data = resultado.data;
      this.totalRegistros = resultado.total;
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      this.notification.error('No se pudieron cargar los documentos.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarDocumentos();
  }

  aplicarFiltros() {
    this.paginaActual = 0; 
    if (this.paginator) this.paginator.firstPage();
    this.cargarDocumentos();
  }

  limpiarFiltros() {
    this.filtrosForm.reset({
      nombre: '',
      tipo: ''
    });
    this.aplicarFiltros();
  }

  abrirDialogoDocumento(documento?: Documento) {
    if (!this.esAdmin) return;
    
    const dialogRef = this.dialog.open(DocumentoDialogComponent, {
       width: '600px',
       disableClose: true,
       data: documento || null
     });

     dialogRef.afterClosed().subscribe(seGuardo => {
       if (seGuardo) this.cargarDocumentos();
     });
    
  }

  async eliminarDocumento(documento: Documento) {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Eliminar Documento',
        icono: 'delete_forever',
        mensaje: `¿Estás seguro de eliminar el documento <strong>${documento.nombre}</strong>?`,
        textoBoton: 'Eliminar',
        colorBoton: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmado) => {
      if (confirmado) {
        try {
          await this.documentoService.eliminarDocumento(documento.id);
          this.notification.success(`Documento eliminado correctamente.`);
          await this.cargarDocumentos(); 
        } catch (error) {
          this.notification.error('Hubo un error al intentar eliminar el documento.');
        }
      }
    });
  }
}