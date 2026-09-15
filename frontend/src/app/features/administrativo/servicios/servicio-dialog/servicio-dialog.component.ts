import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';

import { ServiciosService } from '../services/servicios.service';
import { CatalogoService } from '../../catalogo/services/catalogo.service';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ServicioContratado, TipoEntidad } from '../models/servicio.interface';
import { PlanFunerario } from '../../catalogo/models/catalogo.interface';
import { Adicional, CategoriaAdicional } from '../../../inventario/adicionales/models/adicional.interface';
import { UrnaSelectorDialogComponent } from '../../../../shared/components/urna-selector-dialog/urna-selector-dialog.component';

@Component({
  selector: 'app-servicio-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, 
    MatRadioModule, MatProgressSpinnerModule, MatTooltipModule,
    MatStepperModule // <-- NUEVO: Importación del Stepper
  ],
  templateUrl: './servicio-dialog.component.html'
})
export class ServicioDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private serviciosService = inject(ServiciosService);
  private catalogoService = inject(CatalogoService);
  private supabaseService = inject(SupabaseService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  servicioForm: FormGroup;
  esEdicion = false;
  guardando = false;

  planesBase: PlanFunerario[] = [];
  carrozasDisponibles: any[] = [];
  urnaSeleccionada: any = null;
  
  adicionalesAgrupados: Record<string, Adicional[]> = {};
  categoriasPresentes: string[] = [];

  entidadesDiccionario: Record<TipoEntidad, string[]> = {
    [TipoEntidad.AFP]: ['AFP Habitat', 'AFP Provida', 'AFP Capital', 'AFP Cuprum', 'AFP Modelo', 'AFP PlanVital', 'AFP Uno'],
    [TipoEntidad.ASEGURADORA]: ['Consorcio', 'MetLife', 'Chilena Consolidada', 'Mapfre', 'BICE Vida'],
    [TipoEntidad.MUTUAL]: ['Mutual de Seguridad', 'ACHS', 'IST', 'ISL'],
    [TipoEntidad.PARTICULAR]: ['Familiar Directo', 'Titular', 'Amigo/Conocido'],
    [TipoEntidad.OTRO]: ['Otro']
  };
  
  tiposEntidad = Object.values(TipoEntidad);
  opcionesEntidadPagadora: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ServicioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any | null
  ) {
    this.esEdicion = !!data;

    // Se dividió el formulario en grupos para el Stepper
    this.servicioForm = this.fb.group({
      datosGenerales: this.fb.group({
        fecha_servicio: [data?.fecha_servicio || new Date(), Validators.required],
        nombre_fallecido: [data?.nombre_fallecido || '', Validators.required],
        tipo_entidad: [data?.tipo_entidad || '', Validators.required],
        entidad_pagadora: [{ value: data?.entidad_pagadora || '', disabled: !data?.tipo_entidad }, Validators.required],
        estado: [data?.estado || 'Pendiente', Validators.required],
        fecha_pago: [{ value: data?.fecha_pago || null, disabled: data?.estado !== 'Pagado' }],
        monto: [data?.monto || null, [Validators.required, Validators.min(0)]]
      }),
      configuracionBase: this.fb.group({
        plan_base_id: [data?.plan_base_id || '', Validators.required],
        urna_id: [data?.urna_id || null],
        diferencia_valor_urna: [data?.diferencia_valor_urna || 0, Validators.min(0)],
        carroza_id: [data?.carroza_id || null, Validators.required]
      }),
      serviciosAdicionales: this.fb.group({
        luces_id: [null, Validators.required]
      })
    });

    const grupoGenerales = this.servicioForm.get('datosGenerales') as FormGroup;
    
    grupoGenerales.get('tipo_entidad')?.valueChanges.subscribe((tipo: TipoEntidad) => {
      const entidadControl = grupoGenerales.get('entidad_pagadora');
      if (tipo) {
        this.opcionesEntidadPagadora = this.entidadesDiccionario[tipo] || [];
        entidadControl?.enable({ emitEvent: false });
        if (entidadControl?.value && !this.opcionesEntidadPagadora.includes(entidadControl.value)) {
          entidadControl?.setValue('', { emitEvent: false });
        }
      } else {
        this.opcionesEntidadPagadora = [];
        entidadControl?.disable({ emitEvent: false });
        entidadControl?.setValue('', { emitEvent: false });
      }
      this.cdr.detectChanges();
    });

    if (this.esEdicion && data?.tipo_entidad) {
      this.opcionesEntidadPagadora = this.entidadesDiccionario[data.tipo_entidad as TipoEntidad] || [];
    }

    grupoGenerales.get('estado')?.valueChanges.subscribe(estado => {
      const fechaPagoControl = grupoGenerales.get('fecha_pago');
      if (estado === 'Pagado') {
        fechaPagoControl?.enable({ emitEvent: false });
        if (!fechaPagoControl?.value) {
          fechaPagoControl?.setValue(new Date(), { emitEvent: false });
        }
      } else {
        fechaPagoControl?.disable({ emitEvent: false });
        fechaPagoControl?.setValue(null, { emitEvent: false });
      }
      this.cdr.detectChanges();
    });

    this.servicioForm.get('configuracionBase.plan_base_id')?.valueChanges.subscribe(planId => {
      if (planId) this.precargarAdicionalesDelPlan(planId);
    });
  }

  async ngOnInit() {
    await Promise.all([
      this.cargarPlanesBase(),
      this.cargarInventario()
    ]);
  }

  async cargarPlanesBase() {
    this.planesBase = await this.catalogoService.obtenerPlanes();
    this.cdr.detectChanges();
  }

  async cargarInventario() {
    const supabase = this.supabaseService.client;
    
    const { data: adicionales } = await supabase
        .from('inv_adicionales')
        .select('*')
        .eq('disponible', true);

    const { data: carrozas } = await supabase
      .from('inv_carrozas')
      .select('id, marca, modelo, patente')
      .is('fecha_eliminacion', null);

    this.carrozasDisponibles = carrozas || [];

    if (this.esEdicion && this.data?.urna_id) {
      const { data: urna } = await supabase
        .from('inv_urnas')
        .select('id, nombre, tipo_urna')
        .eq('id', this.data.urna_id)
        .single();
      if (urna) this.urnaSeleccionada = urna;
    }

    if (adicionales) {
      const grupoAdicionales = this.servicioForm.get('serviciosAdicionales') as FormGroup;

      adicionales.forEach((item: Adicional) => {
        const cat = item.categoria;
        if (!this.adicionalesAgrupados[cat]) {
          this.adicionalesAgrupados[cat] = [];
          this.categoriasPresentes.push(cat);
        }
        this.adicionalesAgrupados[cat].push(item);

        if (cat !== CategoriaAdicional.LUCES && cat !== 'Luces') {
          const esFijo = (cat.toUpperCase() === 'FIJO');
          if (!grupoAdicionales.contains(`check_${item.id}`)) {
            grupoAdicionales.addControl(`check_${item.id}`, this.fb.control({ value: esFijo, disabled: esFijo }));
          }
        }
      });

      const ordenDeseado = ['Fijo', 'Luces', 'Floral', 'Comida', 'Extra'];
      this.categoriasPresentes.sort((a, b) => {
        const indexA = ordenDeseado.indexOf(a);
        const indexB = ordenDeseado.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });

      if (this.esEdicion && this.data?.adm_servicio_adicionales) {
        this.data.adm_servicio_adicionales.forEach((rel: any) => {
          const catItem = adicionales.find((i: Adicional) => i.id === rel.adicional_id)?.categoria;
          if (catItem === CategoriaAdicional.LUCES || catItem === 'Luces') {
            grupoAdicionales.get('luces_id')?.setValue(rel.adicional_id, { emitEvent: false });
          } else {
            grupoAdicionales.get(`check_${rel.adicional_id}`)?.setValue(true, { emitEvent: false });
          }
        });
      } else if (!this.esEdicion) {
        const luces = this.adicionalesAgrupados['Luces'] || this.adicionalesAgrupados['LUCES'];
        if (luces && luces.length > 0) {
          const luzPredeterminada = luces.find(l => 
            l.nombre.toLowerCase().includes('luces') || 
            l.nombre.toLowerCase().includes('luz')
          ) || luces.find(l => !l.nombre.toLowerCase().includes('cirio')) || luces[0];
          
          grupoAdicionales.get('luces_id')?.setValue(luzPredeterminada.id, { emitEvent: false });
        }
      }
      this.cdr.detectChanges();
    }
  }

  precargarAdicionalesDelPlan(planId: string) {
    if (this.esEdicion) return; 

    const grupoAdicionales = this.servicioForm.get('serviciosAdicionales') as FormGroup;

    Object.keys(grupoAdicionales.controls).forEach(key => {
      if (key.startsWith('check_') && grupoAdicionales.get(key)?.enabled) {
        grupoAdicionales.get(key)?.setValue(false, { emitEvent: false });
      }
    });
    grupoAdicionales.get('luces_id')?.setValue(null, { emitEvent: false });

    const planSeleccionado = this.planesBase.find(p => p.id === planId);
    let planTraiaLuces = false;
    
    if (planSeleccionado && planSeleccionado.adm_plan_adicionales) {
      planSeleccionado.adm_plan_adicionales.forEach((rel: any) => {
        const catItem = rel.inv_adicionales?.categoria;
        
        if (catItem === 'Luces' || catItem === 'LUCES') {
          grupoAdicionales.get('luces_id')?.setValue(rel.adicional_id, { emitEvent: false });
          planTraiaLuces = true;
        } else {
          grupoAdicionales.get(`check_${rel.adicional_id}`)?.setValue(true, { emitEvent: false });
        }
      });
    }

    if (!planTraiaLuces) {
      const luces = this.adicionalesAgrupados['Luces'] || this.adicionalesAgrupados['LUCES'];
      if (luces && luces.length > 0) {
        const luzPredeterminada = luces.find(l => 
          l.nombre.toLowerCase().includes('luces') || 
          l.nombre.toLowerCase().includes('luz')
        ) || luces.find(l => !l.nombre.toLowerCase().includes('cirio')) || luces[0];
        
        grupoAdicionales.get('luces_id')?.setValue(luzPredeterminada.id, { emitEvent: false });
      }
    }
    
    this.cdr.detectChanges();
  }

  abrirSelectorUrna() {
    const dialogRef = this.dialog.open(UrnaSelectorDialogComponent, {
      width: '900px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(urna => {
      if (urna) {
        this.servicioForm.get('configuracionBase')?.patchValue({ urna_id: urna.id });
        this.urnaSeleccionada = urna;
        this.cdr.detectChanges();
      }
    });
  }

  removerUrna() {
    this.servicioForm.get('configuracionBase')?.patchValue({ urna_id: null, diferencia_valor_urna: 0 });
    this.urnaSeleccionada = null;
    this.cdr.detectChanges();
  }

  async guardar() {
    if (this.servicioForm.invalid) {
      this.servicioForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    const formValues = this.servicioForm.getRawValue();
    const dg = formValues.datosGenerales;
    const cb = formValues.configuracionBase;
    const sa = formValues.serviciosAdicionales;

    try {
      const servicioData: Partial<ServicioContratado> = {
        fecha_servicio: dg.fecha_servicio,
        nombre_fallecido: dg.nombre_fallecido,
        tipo_entidad: dg.tipo_entidad as TipoEntidad,
        entidad_pagadora: dg.entidad_pagadora,
        estado: dg.estado,
        fecha_pago: dg.estado === 'Pagado' ? dg.fecha_pago : null,
        monto: dg.monto,
        plan_base_id: cb.plan_base_id,
        urna_id: cb.urna_id || null,
        diferencia_valor_urna: cb.diferencia_valor_urna || 0,
        carroza_id: cb.carroza_id
      };

      const relaciones: any[] = [];
      
      if (sa.luces_id) {
        relaciones.push({ adicional_id: sa.luces_id, cantidad: 1 });
      }

      Object.keys(sa).forEach(key => {
        if (key.startsWith('check_') && sa[key] === true) {
          const adicional_id = key.replace('check_', '');
          relaciones.push({ adicional_id: adicional_id, cantidad: 1 });
        }
      });

      if (this.esEdicion && this.data) {
        await this.serviciosService.actualizarServicio(this.data.id, servicioData, relaciones);
        this.notification.success('Servicio actualizado correctamente.');
      } else {
        await this.serviciosService.crearServicio(servicioData, relaciones);
        this.notification.success('Servicio registrado correctamente.');
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error al guardar servicio:', error);
      this.notification.error('Error al guardar: ' + (error.message || 'Intente nuevamente.'));
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}