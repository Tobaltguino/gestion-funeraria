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
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
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
    
    // Si ya había fecha de pedido, la usamos. Si es nuevo, sugerimos la fecha actual.
    const fechaPedidoFormat = data?.fecha_pedido 
      ? data.fecha_pedido.split('T')[0] 
      : new Date().toISOString().split('T')[0];

    // Formateo de fecha de llegada si existe
    const fechaLlegadaFormat = data?.fecha_llegada ? data.fecha_llegada.split('T')[0] : '';

    this.pedidoForm = this.fb.group({
      urna_id: [data?.urna_id || '', Validators.required],
      cantidad: [data?.cantidad || 1, [Validators.required, Validators.min(1)]],
      estado_manual: [data?.estado_manual || PedidoEstado.PENDIENTE, Validators.required],
      fecha_pedido: [fechaPedidoFormat, Validators.required],
      fecha_llegada: [{ 
        value: fechaLlegadaFormat, 
        disabled: data?.estado_manual !== PedidoEstado.RECIBIDO 
      }]
    });

    // Escuchamos los cambios del estado en tiempo real para la fecha de llegada
    this.pedidoForm.get('estado_manual')?.valueChanges.subscribe(estado => {
      const fechaCtrl = this.pedidoForm.get('fecha_llegada');
      if (estado === PedidoEstado.RECIBIDO) {
        fechaCtrl?.enable();
        if (!fechaCtrl?.value) {
          fechaCtrl?.setValue(new Date().toISOString().split('T')[0]);
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
    
    // Regla de seguridad
    if (formValues.estado_manual !== PedidoEstado.RECIBIDO) {
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