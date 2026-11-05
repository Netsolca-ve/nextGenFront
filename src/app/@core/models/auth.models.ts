export interface AuthUser {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  tipoIdentificacion: string | null;
  identificacion: string | null;
  telefono: string | null;
  direccion: string | null;
  idRol: number | null;
  creadoEl: string;
  actualizadoEl: string;
}

export interface LoginRequest {
  correo: string;
  clave: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  correo: string;
  clave: string;
  tipoIdentificacion?: string;
  identificacion?: string;
  telefono?: string;
  direccion?: string;
  idRol?: number;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
}
