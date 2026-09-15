export enum TipoDocumento {
  IMPORTANTE = 'Importante',
  VARIOS = 'Varios',
  LEGAL = 'Legal',
  CONTRATO = 'Contrato'
}

export interface Documento {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoDocumento | string;
  url: string;
  
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}