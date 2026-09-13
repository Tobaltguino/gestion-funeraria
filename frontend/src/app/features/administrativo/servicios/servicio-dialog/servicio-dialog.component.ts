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

import { ServiciosService } from '../services/servicios.service';
import { CatalogoService } from '../../catalogo/services/catalogo.service';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ServicioContratado, TipoEntidad } from '../models/servicio.interface';
import { PlanFunerario } from '../../catalogo/models/catalogo.interface';
import { Adicional, CategoriaAdicional } from '../../../inventario/adicionales/models/adicional.interface';
import { UrnaSelectorDialogComponent } from '../urna-selector-dialog/urna-selector-dialog.component';

@Component({
  selector: 'app-servicio-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule, 
    MatRadioModule, MatProgressSpinnerModule, MatTooltipModule
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

    this.servicioForm = this.fb.group({
      fecha_servicio: [data?.fecha_servicio || new Date(), Validators.required],
      nombre_fallecido: [data?.nombre_fallecido || '', Validators.required],
      
      tipo_entidad: [data?.tipo_entidad || '', Validators.required],
      entidad_pagadora: [{ value: data?.entidad_pagadora || '', disabled: !data?.tipo_entidad }, Validators.required],
      
      estado: [data?.estado || 'Pendiente', Validators.required],
      fecha_pago: [{ value: data?.fecha_pago || null, disabled: data?.estado !== 'Pagado' }],
      
      plan_base_id: [data?.plan_base_id || '', Validators.required],
      urna_id: [data?.urna_id || null],
      diferencia_valor_urna: [data?.diferencia_valor_urna || 0, Validators.min(0)],
      carroza_id: [data?.carroza_id || null],
      
      luces_id: [null, Validators.required] // <-- Luces obligatorio
    });

    this.servicioForm.get('tipo_entidad')?.valueChanges.subscribe((tipo: TipoEntidad) => {
      const entidadControl = this.servicioForm.get('entidad_pagadora');
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

    this.servicioForm.get('estado')?.valueChanges.subscribe(estado => {
      const fechaPagoControl = this.servicioForm.get('fecha_pago');
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

    this.servicioForm.get('plan_base_id')?.valueChanges.subscribe(planId => {
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
      adicionales.forEach((item: Adicional) => {
        const cat = item.categoria;
        if (!this.adicionalesAgrupados[cat]) {
          this.adicionalesAgrupados[cat] = [];
          this.categoriasPresentes.push(cat);
        }
        this.adicionalesAgrupados[cat].push(item);

        if (cat !== CategoriaAdicional.LUCES && cat !== 'Luces') {
          // REGLA: Si es Fijo, se marca y deshabilita
          const esFijo = (cat.toUpperCase() === 'FIJO');
          if (!this.servicioForm.contains(`check_${item.id}`)) {
            this.servicioForm.addControl(`check_${item.id}`, this.fb.control({ value: esFijo, disabled: esFijo }));
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
        // MODO EDICIÓN: Carga lo que ya estaba guardado en la base de datos
        this.data.adm_servicio_adicionales.forEach((rel: any) => {
          const catItem = adicionales.find((i: Adicional) => i.id === rel.adicional_id)?.categoria;
          if (catItem === CategoriaAdicional.LUCES || catItem === 'Luces') {
            this.servicioForm.get('luces_id')?.setValue(rel.adicional_id, { emitEvent: false });
          } else {
            this.servicioForm.get(`check_${rel.adicional_id}`)?.setValue(true, { emitEvent: false });
          }
        });
      } else if (!this.esEdicion) {
        // AQUI ESTÁ LA CORRECCIÓN: MODO NUEVO
        // Marcamos la luz por defecto apenas se abre la ventana
        const luces = this.adicionalesAgrupados['Luces'] || this.adicionalesAgrupados['LUCES'];
        if (luces && luces.length > 0) {
          const luzPredeterminada = luces.find(l => 
            l.nombre.toLowerCase().includes('luces') || 
            l.nombre.toLowerCase().includes('luz')
          ) || luces.find(l => !l.nombre.toLowerCase().includes('cirio')) || luces[0];
          
          this.servicioForm.get('luces_id')?.setValue(luzPredeterminada.id, { emitEvent: false });
        }
      }
      this.cdr.detectChanges();
    }
  }

  precargarAdicionalesDelPlan(planId: string) {
    if (this.esEdicion) return; 

    Object.keys(this.servicioForm.controls).forEach(key => {
      // Limpiar solo los checkboxes habilitados (evitamos limpiar los Fijos)
      if (key.startsWith('check_') && this.servicioForm.get(key)?.enabled) {
        this.servicioForm.get(key)?.setValue(false, { emitEvent: false });
      }
    });
    this.servicioForm.get('luces_id')?.setValue(null, { emitEvent: false });

    const planSeleccionado = this.planesBase.find(p => p.id === planId);
    let planTraiaLuces = false;
    
    if (planSeleccionado && planSeleccionado.adm_plan_adicionales) {
      planSeleccionado.adm_plan_adicionales.forEach((rel: any) => {
        const catItem = rel.inv_adicionales?.categoria;
        
        if (catItem === 'Luces' || catItem === 'LUCES') {
          this.servicioForm.get('luces_id')?.setValue(rel.adicional_id, { emitEvent: false });
          planTraiaLuces = true;
        } else {
          this.servicioForm.get(`check_${rel.adicional_id}`)?.setValue(true, { emitEvent: false });
        }
      });
    }

    // REGLA: Forzar luces por defecto si el plan no traía (prioriza "luces", evade "cirio")
    if (!planTraiaLuces) {
      const luces = this.adicionalesAgrupados['Luces'] || this.adicionalesAgrupados['LUCES'];
      if (luces && luces.length > 0) {
        const luzPredeterminada = luces.find(l => 
          l.nombre.toLowerCase().includes('luces') || 
          l.nombre.toLowerCase().includes('luz')
        ) || luces.find(l => !l.nombre.toLowerCase().includes('cirio')) || luces[0];
        
        this.servicioForm.get('luces_id')?.setValue(luzPredeterminada.id, { emitEvent: false });
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
        this.servicioForm.patchValue({ urna_id: urna.id });
        this.urnaSeleccionada = urna;
        this.cdr.detectChanges();
      }
    });
  }

  removerUrna() {
    this.servicioForm.patchValue({ urna_id: null, diferencia_valor_urna: 0 });
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

    try {
      const servicioData: Partial<ServicioContratado> = {
        fecha_servicio: formValues.fecha_servicio,
        nombre_fallecido: formValues.nombre_fallecido,
        tipo_entidad: formValues.tipo_entidad as TipoEntidad,
        entidad_pagadora: formValues.entidad_pagadora,
        estado: formValues.estado,
        fecha_pago: formValues.estado === 'Pagado' ? formValues.fecha_pago : null,
        plan_base_id: formValues.plan_base_id,
        urna_id: formValues.urna_id,
        diferencia_valor_urna: formValues.diferencia_valor_urna,
        carroza_id: formValues.carroza_id
      };

      const relaciones: any[] = [];
      
      if (formValues.luces_id) {
        relaciones.push({ adicional_id: formValues.luces_id, cantidad: 1 });
      }

      Object.keys(formValues).forEach(key => {
        if (key.startsWith('check_') && formValues[key] === true) {
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