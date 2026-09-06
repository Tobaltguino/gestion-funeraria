import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

interface Servicio {
  icono: string;
  titulo: string;
  descripcion: string;
}

interface Celular {
  numero: string; // formato para mostrar
  numeroLimpio: string; // sólo dígitos con código de país, para wa.me
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly anioActual = new Date().getFullYear();
  menuAbierto = false;

  // ===== Datos reales de contacto =====
  readonly telefonoFijo = '(58) 2426056';
  readonly telefonoFijoLimpio = '+56582426056';

  readonly celulares: Celular[] = [
    { numero: '+569 71090319', numeroLimpio: '56971090319' },
    { numero: '+569 94586410', numeroLimpio: '56994586410' },
    { numero: '+569 52292234', numeroLimpio: '56952292234' }
  ];

  readonly instagram = {
    usuario: 'funeraria.alaluzdecristo',
    url: 'https://instagram.com/funeraria.alaluzdecristo'
  };

  // TODO: reemplazar por el enlace real de la página de Facebook
  readonly facebook = {
    nombre: 'Funeraria a La Luz de Cristo - Arica',
    url: 'https://www.facebook.com/funeraria.alaluzdecristo'
  };

  readonly correo = 'funeraria.alaluzdecristo@hotmail.com';
  readonly direccion = 'Av. Vicuña Mackenna N° 664, Arica';

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  mensajeWhatsapp(): string {
    return encodeURIComponent(
      'Hola, necesito conversar con Funeraria A la Luz de Cristo. ¿Podrían orientarme?'
    );
  }

  enlaceWhatsapp(numeroLimpio: string): string {
    return `https://wa.me/${numeroLimpio}?text=${this.mensajeWhatsapp()}`;
  }

  enlaceLlamada(numero: string): string {
    return `tel:${numero.replace(/\s/g, '')}`;
  }

  enlaceMapa(): string {
    // Agregamos el nombre de la funeraria para que Google Maps sea más preciso
    const busqueda = `Funeraria A la Luz de Cristo, ${this.direccion}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}`;
  }

  // ===== Servicios ofrecidos =====
  readonly servicios: Servicio[] = [
    {
      icono: 'church',
      titulo: 'Velatorios',
      descripcion:
        'Salas equipadas y en calma para recibir a familiares y amigos, con la privacidad que cada despedida merece.'
    },
    {
      icono: 'local_florist',
      titulo: 'Arreglos florales',
      descripcion:
        'Coronas y arreglos preparados el mismo día, elegidos junto a la familia para honrar a quien partió.'
    },
    {
      icono: 'directions_car',
      titulo: 'Traslados',
      descripcion:
        'Traslado del ser querido dentro y fuera de la región, coordinado con la documentación correspondiente.'
    },
    {
      icono: 'description',
      titulo: 'Trámites y documentación',
      descripcion:
        'Gestionamos el papeleo legal y administrativo para que la familia pueda dedicarse a despedirse con tranquilidad.'
    },
    {
      icono: 'volunteer_activism',
      titulo: 'Asesoría especializada',
      descripcion:
        'Orientación cercana antes, durante y después de la ceremonia, disponible las veinticuatro horas.'
    }
  ];
}