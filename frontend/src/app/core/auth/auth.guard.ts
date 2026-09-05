import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../../shared/enums/role.enum';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Verificamos la sesión
  const session = await authService.obtenerSesionActual();
  
  if (!session) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Extraemos los roles permitidos tipándolos con el Enum
  const rolesPermitidos = route.data['roles'] as Array<Role>;
  
  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const perfil = await authService.obtenerPerfilUsuario(session.user.id);
    
    // Validamos que el perfil exista y que su rol esté en la lista permitida
    if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
      console.warn('Acceso denegado: No tienes el rol necesario para esta vista.');
      
      // Redirección inteligente dependiendo del rol que sí tiene
      if (perfil?.rol === Role.EMPLEADO) {
        router.navigate(['/empleado/dashboard']);
      } else {
        router.navigate(['/']);
      }
      return false;
    }
  }

  return true;
};