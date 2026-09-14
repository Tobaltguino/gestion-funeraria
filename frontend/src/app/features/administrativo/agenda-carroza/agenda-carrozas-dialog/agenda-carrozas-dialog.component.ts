import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AgendaCarrozasService } from '../services/agenda-carrozas.service';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AgendaCarroza, TipoEvento, EstadoAgenda } from '../models/agenda-carroza.interface';

@Component({
  selector: 'app-agenda-carrozas-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule
  ],
  templateUrl: './agenda-carrozas-dialog.component.html'
})
export class AgendaCarrozasDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private agendaService = inject(AgendaCarrozasService);
  private supabaseService = inject(SupabaseService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  agendaForm: FormGroup;
  esEdicion = false;
  guardando = false;

  serviciosDisponibles: any[] = [];
  carrozasDisponibles: any[] = [];
  
  tiposEvento = Object.values(TipoEvento);
  estadosAgenda = Object.values(EstadoAgenda);

  constructor(
    public dialogRef: MatDialogRef<AgendaCarrozasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AgendaCarroza | null
  ) {
    this.esEdicion = !!data;

    this.agendaForm = this.fb.group({
      servicio_id: [data?.servicio_id || '', Validators.required],
      carroza_id: [data?.carroza_id || '', Validators.required],
      tipo_evento: [data?.tipo_evento || TipoEvento.FUNERAL, Validators.required],
      fecha_evento: [data?.fecha_evento ? new Date(data.fecha_evento) : new Date(), Validators.required],
      hora_inicio: [data?.hora_inicio || '09:00', Validators.required],
      hora_termino: [data?.hora_termino || '11:00', Validators.required],
      estado: [data?.estado || EstadoAgenda.PROGRAMADO, Validators.required]
    });
  }

  async ngOnInit() {
    await this.cargarSelects();
  }

  async cargarSelects() {
    const supabase = this.supabaseService.client;
    
    // Cargar Servicios (Activos/Pendientes)
    const { data: servicios } = await supabase
      .from('adm_servicios')
      .select('id, nombre_fallecido, folio')
      .is('fecha_eliminacion', null)
      .order('fecha_creada', { ascending: false });
      
    this.serviciosDisponibles = servicios || [];

    // Cargar Carrozas Disponibles
    const { data: carrozas } = await supabase
      .from('inv_carrozas')
      .select('id, marca, modelo, patente')
      .is('fecha_eliminacion', null);
      
    this.carrozasDisponibles = carrozas || [];
    this.cdr.detectChanges();
  }

  async guardar() {
    if (this.agendaForm.invalid) {
      this.agendaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    const formValues = this.agendaForm.getRawValue();
    
    // Formatear la fecha al formato estricto YYYY-MM-DD para la BD
    const fechaISO = formValues.fecha_evento.toISOString().split('T')[0];

    try {
      const agendaData: Partial<AgendaCarroza> = {
        servicio_id: formValues.servicio_id,
        carroza_id: formValues.carroza_id,
        tipo_evento: formValues.tipo_evento,
        fecha_evento: fechaISO,
        hora_inicio: formValues.hora_inicio,
        hora_termino: formValues.hora_termino,
        estado: formValues.estado
      };

      if (this.esEdicion && this.data) {
        await this.agendaService.actualizarAgenda(this.data.id, agendaData);
        this.notification.success('Agenda actualizada correctamente.');
      } else {
        await this.agendaService.crearAgenda(agendaData);
        this.notification.success('Asignación registrada correctamente.');
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.notification.error('Ocurrió un error al guardar la agenda.');
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}