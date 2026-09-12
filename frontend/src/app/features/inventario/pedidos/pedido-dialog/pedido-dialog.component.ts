import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// Nuevos imports para el Datepicker
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { provideNativeDateAdapter } from '@angular/material/core';

// Servicios y Modelos
import { PedidoService } from '../services/pedido.service';
import { UrnaService } from '../../urnas/services/urna.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Pedido, PedidoEstado } from '../models/pedido.interface';
import { Urna } from '../../urnas/models/urna.interface';

@Component({
  selector: 'app-pedido-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule // Agregados al imports
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './pedido-dialog.component.html'
})
export class PedidoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  private urnaService = inject(UrnaService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  pedidoForm: FormGroup;
  esEdicion = false;
  guardando = false;
  cargandoUrnas = true;
  
  urnas: Urna[] = [];
  urnasFiltradas: Urna[] = [];
  estados = Object.values(PedidoEstado);

  constructor(
    public dialogRef: MatDialogRef<PedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Pedido | null
  ) {
    this.esEdicion = !!data;
    
    // El Datepicker funciona mejor con objetos Date de JavaScript
    const fechaPedidoVal = data?.fecha_pedido ? new Date(data.fecha_pedido) : new Date();
    const fechaLlegadaVal = data?.fecha_llegada ? new Date(data.fecha_llegada) : '';

    this.pedidoForm = this.fb.group({
      urna_id: [{ value: data?.urna_id || '', disabled: true }, Validators.required],
      cantidad: [data?.cantidad || 1, [Validators.required, Validators.min(1)]],
      estado_manual: [data?.estado_manual || PedidoEstado.PENDIENTE, Validators.required],
      fecha_pedido: [fechaPedidoVal, Validators.required],
      fecha_llegada: [{ 
        value: fechaLlegadaVal, 
        disabled: data?.estado_manual !== PedidoEstado.RECIBIDO 
      }]
    });

    this.pedidoForm.get('estado_manual')?.valueChanges.subscribe(estado => {
      const fechaCtrl = this.pedidoForm.get('fecha_llegada');
      if (estado === PedidoEstado.RECIBIDO) {
        fechaCtrl?.enable();
        if (!fechaCtrl?.value) {
          fechaCtrl?.setValue(new Date());
        }
      } else {
        fechaCtrl?.disable();
        fechaCtrl?.setValue('');
      }
    });
  }

  async ngOnInit() {
    await this.cargarUrnasDisponibles();
  }

  async cargarUrnasDisponibles() {
    try {
      this.urnas = await this.urnaService.obtenerUrnas();
      this.urnasFiltradas = [...this.urnas];
    } catch (error) {
      console.error('Error al cargar urnas:', error);
      this.notification.error('No se pudo cargar el catálogo de urnas para el pedido.');
    } finally {
      this.cargandoUrnas = false;
      this.pedidoForm.get('urna_id')?.enable(); // <--- Habilitamos el select aquí
      this.cdr.detectChanges();
    }
  }

  filtrarUrnas(event: Event) {
    const busqueda = (event.target as HTMLInputElement).value.toLowerCase();
    this.urnasFiltradas = this.urnas.filter(urna => 
      urna.nombre.toLowerCase().includes(busqueda)
    );
  }

  async guardar() {
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const formValues = this.pedidoForm.getRawValue();
    
    // Convertimos los objetos Date de vuelta a string ISO para la base de datos
    if (formValues.fecha_pedido instanceof Date) {
      formValues.fecha_pedido = formValues.fecha_pedido.toISOString();
    }
    
    if (formValues.estado_manual === PedidoEstado.RECIBIDO && formValues.fecha_llegada instanceof Date) {
      formValues.fecha_llegada = formValues.fecha_llegada.toISOString();
    } else if (formValues.estado_manual !== PedidoEstado.RECIBIDO) {
      formValues.fecha_llegada = null;
    }

    try {
      if (this.esEdicion && this.data) {
        await this.pedidoService.actualizarPedido(this.data.id, formValues);
        this.notification.success('Pedido actualizado correctamente.');
      } else {
        await this.pedidoService.crearPedido(formValues);
        this.notification.success('Pedido registrado correctamente.');
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error al guardar pedido:', error);
      this.notification.error('Error al guardar el pedido. Intente nuevamente.');
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}