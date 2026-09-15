import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// FullCalendar Imports
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

import { AgendaCarrozasService } from './services/agenda-carrozas.service';
import { AgendaCarroza } from './models/agenda-carroza.interface';
import { AgendaCarrozasDialogComponent } from './agenda-carrozas-dialog/agenda-carrozas-dialog.component';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Role } from '../../../shared/enums/role.enum';

@Component({
  selector: 'app-agenda-carrozas',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, FullCalendarModule
  ],
  templateUrl: './agenda-carroza.component.html',
  styleUrls: ['./agenda-carroza.component.scss']
})
export class AgendaCarrozaComponent implements OnInit {
  private agendaService = inject(AgendaCarrozasService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  cargando = false;
  esAdmin = false;
  
  listaAgendas: AgendaCarroza[] = [];

  // Almacenamos el rango actual para recargar tras guardar un modal
  rangoActualVisible = { inicio: '', fin: '' };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'timeGridWeek', 
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'listWeek,timeGridWeek,dayGridMonth'
    },
    buttonText: {
      today: 'HOY',
      month: 'MES',
      week: 'SEMANA',
      list: 'AGENDA'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    datesSet: this.handleDatesSet.bind(this), // <-- SE DISPARA AL CAMBIAR DE MES/SEMANA
    height: 'auto',
    allDaySlot: false,
    slotMinTime: '06:00:00', 
    slotMaxTime: '22:00:00',
    noEventsText: 'No hay eventos para mostrar'
  };

  async ngOnInit() {
    await this.verificarRol();
    // Ya no llamamos a cargarAgendas aquí. FullCalendar dispara datesSet automáticamente al renderizar.
  }

  async verificarRol() {
    const session = await this.authService.obtenerSesionActual();
    if (session) {
      const perfil = await this.authService.obtenerPerfilUsuario(session.user.id);
      this.esAdmin = perfil?.rol === Role.ADMIN
    }
  }

  // Captura el cambio de fechas en el calendario
  async handleDatesSet(dateInfo: any) {
    const inicio = dateInfo.startStr.split('T')[0];
    const fin = dateInfo.endStr.split('T')[0];
    
    this.rangoActualVisible = { inicio, fin };
    await this.cargarAgendasPorRango(inicio, fin);
  }

  async cargarAgendasPorRango(inicio: string, fin: string) {
    this.cargando = true;
    this.cdr.detectChanges();
    try {
      this.listaAgendas = await this.agendaService.obtenerAgendas(inicio, fin);
      this.mapearEventosAlCalendario();
    } catch (error) {
      console.error('Error al cargar la agenda:', error);
      this.notification.error('No se pudo cargar la agenda de carrozas.');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  mapearEventosAlCalendario() {
    const eventosMapeados: EventInput[] = this.listaAgendas.map(agenda => {
      let colorEstado = '#1565c0'; 
      if (agenda.estado === 'Finalizado') colorEstado = '#2e7d32'; 
      else if (agenda.estado === 'Programado') colorEstado = '#ef6c00'; 
      else if (agenda.estado === 'Cancelado') colorEstado = '#d32f2f'; 

      return {
        id: agenda.id,
        title: `${agenda.tipo_evento} - ${agenda.inv_carrozas?.patente || 'Carroza'}`,
        start: `${agenda.fecha_evento}T${agenda.hora_inicio}`,
        end: `${agenda.fecha_evento}T${agenda.hora_termino}`,
        backgroundColor: colorEstado,
        borderColor: colorEstado,
        extendedProps: { agendaData: agenda }
      };
    });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: eventosMapeados
    };
  }

  handleEventClick(clickInfo: any) {
    const agendaSeleccionada = clickInfo.event.extendedProps.agendaData;
    this.abrirFormulario(agendaSeleccionada);
  }

  abrirFormulario(agenda?: AgendaCarroza) {
    const dialogRef = this.dialog.open(AgendaCarrozasDialogComponent, {
      width: '700px',
      disableClose: true,
      data: agenda || null
    });

    dialogRef.afterClosed().subscribe(seGuardo => {
      if (seGuardo && this.rangoActualVisible.inicio) {
        // Recargamos el mismo rango en lugar de todo
        this.cargarAgendasPorRango(this.rangoActualVisible.inicio, this.rangoActualVisible.fin);
      }
    });
  }
}