export enum CarrozaEstado {
  DISPONIBLE = 'Disponible',
  EN_USO = 'En Uso',
  MANTENIMIENTO = 'Mantenimiento'
}

export enum CarrozaColor {
  BLANCO = 'Blanco',
  NEGRO = 'Negro',
  GRIS = 'Gris'
}

export enum CarrozaMarca {
  MERCEDES = 'Mercedes-Benz',
  FORD = 'Ford',
  CHEVROLET = 'Chevrolet',
  HYUNDAI = 'Hyundai',
  KIA = 'Kia',
  PEUGEOT = 'Peugeot',
  OTRAS = 'Otras'
}

export interface Carroza {
  id: string;
  marca: CarrozaMarca; // Actualizado a Enum
  modelo: string;
  color: CarrozaColor; // Actualizado a Enum
  patente: string;
  estado: CarrozaEstado;
  imagenes: string[];
  fecha_eliminacion?: string | null;
  fecha_creada?: string;
  fecha_actualizada?: string;
}