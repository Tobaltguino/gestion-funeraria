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
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
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

// 🔥 IMPORTA AQUÍ TU DIRECTIVA DEL RUT (Ajusta la ruta según tu proyecto)
import { RutFormatDirective } from '../../../../shared/directives/rut-format.directive'; 

@Component({
  selector: 'app-servicio-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatTimepickerModule, MatCheckboxModule, 
    MatRadioModule, MatProgressSpinnerModule, MatTooltipModule, MatStepperModule,
    RutFormatDirective // <-- NUEVO: Agregamos la directiva aquí
  ],
  providers: [provideNativeDateAdapter()],
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
  cargando = true;

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

    const crearFechaConHora = (horaString: string) => {
      if (!horaString) return null;
      const partes = horaString.split(':');
      const fecha = new Date();
      fecha.setHours(parseInt(partes[0], 10), parseInt(partes[1], 10), 0);
      return fecha;
    };

    this.servicioForm = this.fb.group({
      solicitante: this.fb.group({
        solicitante_nombre: [data?.solicitante_nombre || '', Validators.required],
        solicitante_rut: [data?.solicitante_rut || ''],
        solicitante_direccion: [data?.solicitante_direccion || ''],
        solicitante_ciudad: [data?.solicitante_ciudad || ''],
        solicitante_fono: [data?.solicitante_fono || ''],
        solicitante_email: [data?.solicitante_email || '', Validators.email], // <-- Validación de Email
        consentimiento_redes: [data?.consentimiento_redes || false]
      }),
      fallecido: this.fb.group({
        nombre_fallecido: [data?.nombre_fallecido || '', Validators.required],
        fallecido_rut: [data?.fallecido_rut || ''],
        retirado_desde: [data?.retirado_desde || ''],
        velado_en: [data?.velado_en || ''],
        hora_misa: [crearFechaConHora(data?.hora_misa)]
      }),
      logistica: this.fb.group({
        fecha_servicio: [data?.fecha_servicio || new Date(), Validators.required],
        dia_funeral: [data?.dia_funeral || ''],
        lugar_funeral: [data?.lugar_funeral || ''],
        hora_funeral: [crearFechaConHora(data?.hora_funeral)],
        plan_base_id: [data?.plan_base_id || '', Validators.required],
        urna_id: [data?.urna_id || null],
        diferencia_valor_urna: [data?.diferencia_valor_urna || 0, Validators.min(0)],
        carroza_id: [data?.carroza_id || null, Validators.required],
        adicionales: this.fb.group({
          luces_id: [null, Validators.required]
        })
      }),
      pagos: this.fb.group({
        tipo_entidad: [data?.tipo_entidad || '', Validators.required],
        entidad_pagadora: [{ value: data?.entidad_pagadora || '', disabled: !data?.tipo_entidad }, Validators.required],
        monto: [data?.monto || null, [Validators.required, Validators.min(0)]], // <-- Validación de Monto
        monto_entidad: [data?.monto_entidad || 0, Validators.min(0)],
        diferencia: [{ value: data?.diferencia || 0, disabled: true }],
        estado: [data?.estado || 'Pendiente', Validators.required],
        fecha_pago: [{ value: data?.fecha_pago || null, disabled: data?.estado !== 'Pagado' }]
      })
    });

    this.iniciarListeners();
  }

  iniciarListeners() {
    const grupoPagos = this.servicioForm.get('pagos') as FormGroup;
    
    grupoPagos.get('tipo_entidad')?.valueChanges.subscribe((tipo: TipoEntidad) => {
      const entidadControl = grupoPagos.get('entidad_pagadora');
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

    grupoPagos.get('estado')?.valueChanges.subscribe(estado => {
      const fechaPagoControl = grupoPagos.get('fecha_pago');
      if (estado === 'Pagado') {
        fechaPagoControl?.enable({ emitEvent: false });
        if (!fechaPagoControl?.value) fechaPagoControl?.setValue(new Date(), { emitEvent: false });
      } else {
        fechaPagoControl?.disable({ emitEvent: false });
        fechaPagoControl?.setValue(null, { emitEvent: false });
      }
      this.cdr.detectChanges();
    });

    const calcularDiferencia = () => {
      const montoTotal = grupoPagos.get('monto')?.value || 0;
      const montoEntidad = grupoPagos.get('monto_entidad')?.value || 0;
      const resta = Math.max(0, montoTotal - montoEntidad);
      grupoPagos.get('diferencia')?.setValue(resta, { emitEvent: false });
    };
    grupoPagos.get('monto')?.valueChanges.subscribe(calcularDiferencia);
    grupoPagos.get('monto_entidad')?.valueChanges.subscribe(calcularDiferencia);

    this.servicioForm.get('logistica.plan_base_id')?.valueChanges.subscribe(planId => {
      if (planId) this.precargarAdicionalesDelPlan(planId);
    });

    if (this.esEdicion && this.data?.tipo_entidad) {
      this.opcionesEntidadPagadora = this.entidadesDiccionario[this.data.tipo_entidad as TipoEntidad] || [];
    }
  }

  get resumen() {
    return this.servicioForm.getRawValue();
  }

  async ngOnInit() {
    this.cargando = true;
    this.cdr.detectChanges();

    await Promise.all([this.cargarPlanesBase(), this.cargarInventario()]);
    
    this.cargando = false;
    this.cdr.detectChanges();
  }

  async cargarPlanesBase() {
    this.planesBase = await this.catalogoService.obtenerPlanes();
  }

  async cargarInventario() {
    const supabase = this.supabaseService.client;
    
    const [reqAdicionales, reqCarrozas] = await Promise.all([
      supabase.from('inv_adicionales').select('*').eq('disponible', true),
      supabase.from('inv_carrozas').select('id, marca, modelo, patente').is('fecha_eliminacion', null)
    ]);

    const adicionales = reqAdicionales.data;
    this.carrozasDisponibles = reqCarrozas.data || [];

    if (this.esEdicion && this.data?.urna_id) {
      const { data: urna } = await supabase.from('inv_urnas').select('id, nombre, tipo_urna').eq('id', this.data.urna_id).single();
      if (urna) this.urnaSeleccionada = urna;
    }

    if (adicionales) {
      const grupoAdicionales = this.servicioForm.get('logistica.adicionales') as FormGroup;

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
        const indexA = ordenDeseado.indexOf(a), indexB = ordenDeseado.indexOf(b);
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
          const luzPred = luces.find(l => l.nombre.toLowerCase().includes('luz')) || luces[0];
          grupoAdicionales.get('luces_id')?.setValue(luzPred.id, { emitEvent: false });
        }
      }
    }
  }

  precargarAdicionalesDelPlan(planId: string) {
    if (this.esEdicion) return; 
    const grupoAdicionales = this.servicioForm.get('logistica.adicionales') as FormGroup;

    Object.keys(grupoAdicionales.controls).forEach(key => {
      if (key.startsWith('check_') && grupoAdicionales.get(key)?.enabled) grupoAdicionales.get(key)?.setValue(false, { emitEvent: false });
    });
    grupoAdicionales.get('luces_id')?.setValue(null, { emitEvent: false });

    const planSel = this.planesBase.find(p => p.id === planId);
    let planTraiaLuces = false;
    
    if (planSel && planSel.adm_plan_adicionales) {
      planSel.adm_plan_adicionales.forEach((rel: any) => {
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
      if (luces && luces.length > 0) grupoAdicionales.get('luces_id')?.setValue(luces[0].id, { emitEvent: false });
    }
    this.cdr.detectChanges();
  }

  abrirSelectorUrna() {
    const dialogRef = this.dialog.open(UrnaSelectorDialogComponent, { width: '900px', disableClose: true });
    dialogRef.afterClosed().subscribe(urna => {
      if (urna) {
        this.servicioForm.get('logistica')?.patchValue({ urna_id: urna.id });
        this.urnaSeleccionada = urna;
        this.cdr.detectChanges();
      }
    });
  }

  removerUrna() {
    this.servicioForm.get('logistica')?.patchValue({ urna_id: null, diferencia_valor_urna: 0 });
    this.urnaSeleccionada = null;
    this.cdr.detectChanges();
  }

  async guardar() {
    if (this.servicioForm.invalid) {
      this.servicioForm.markAllAsTouched();
      this.notification.warning('Faltan campos obligatorios o hay errores en el formulario.');
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    const raw = this.servicioForm.getRawValue();

    const formatearHora = (valorHora: any): string | null => {
      if (!valorHora) return null;
      if (valorHora instanceof Date) {
        const horas = String(valorHora.getHours()).padStart(2, '0');
        const minutos = String(valorHora.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}:00`;
      }
      return valorHora.length === 5 ? `${valorHora}:00` : valorHora;
    };

    try {
      const servicioData: Partial<ServicioContratado> = {
        solicitante_nombre: raw.solicitante.solicitante_nombre,
        solicitante_rut: raw.solicitante.solicitante_rut,
        solicitante_direccion: raw.solicitante.solicitante_direccion,
        solicitante_ciudad: raw.solicitante.solicitante_ciudad,
        solicitante_fono: raw.solicitante.solicitante_fono,
        solicitante_email: raw.solicitante.solicitante_email,
        consentimiento_redes: raw.solicitante.consentimiento_redes,
        
        nombre_fallecido: raw.fallecido.nombre_fallecido,
        fallecido_rut: raw.fallecido.fallecido_rut,
        retirado_desde: raw.fallecido.retirado_desde,
        velado_en: raw.fallecido.velado_en,
        hora_misa: formatearHora(raw.fallecido.hora_misa) || '',

        fecha_servicio: raw.logistica.fecha_servicio,
        dia_funeral: raw.logistica.dia_funeral,
        lugar_funeral: raw.logistica.lugar_funeral,
        hora_funeral: formatearHora(raw.logistica.hora_funeral) || '',
        plan_base_id: raw.logistica.plan_base_id,
        urna_id: raw.logistica.urna_id || null,
        diferencia_valor_urna: raw.logistica.diferencia_valor_urna || 0,
        carroza_id: raw.logistica.carroza_id,

        tipo_entidad: raw.pagos.tipo_entidad as TipoEntidad,
        entidad_pagadora: raw.pagos.entidad_pagadora,
        monto: raw.pagos.monto,
        monto_entidad: raw.pagos.monto_entidad,
        diferencia: raw.pagos.diferencia,
        estado: raw.pagos.estado,
        fecha_pago: raw.pagos.estado === 'Pagado' ? raw.pagos.fecha_pago : null,
      };

      const relaciones: any[] = [];
      if (raw.logistica.adicionales.luces_id) {
        relaciones.push({ adicional_id: raw.logistica.adicionales.luces_id, cantidad: 1 });
      }
      Object.keys(raw.logistica.adicionales).forEach(key => {
        if (key.startsWith('check_') && raw.logistica.adicionales[key] === true) {
          relaciones.push({ adicional_id: key.replace('check_', ''), cantidad: 1 });
        }
      });

      let servicioGuardado;
      if (this.esEdicion && this.data) {
        servicioGuardado = await this.serviciosService.actualizarServicio(this.data.id, servicioData, relaciones);
        this.notification.success('Servicio actualizado correctamente.');
      } else {
        servicioGuardado = await this.serviciosService.crearServicio(servicioData, relaciones);
        this.notification.success('Contrato generado correctamente.');
      }

      this.dialogRef.close(servicioGuardado);
    } catch (error: any) {
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