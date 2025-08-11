import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { signIn, signOut, fetchAuthSession, getCurrentUser, fetchUserAttributes, confirmSignUp, resendSignUpCode, signUp, resetPassword, confirmResetPassword, updatePassword } from 'aws-amplify/auth';

export interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    loading: true
  });

  public authState$ = this.authState.asObservable();

  constructor() {
    this.checkAuthState();
  }

  /**
   * Verificar el estado de autenticación actual
   */
  private async checkAuthState(): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (user) {
        const attributes = await fetchUserAttributes();
        this.updateAuthState({
          isAuthenticated: true,
          loading: false
        });
      } else {
        this.updateAuthState({
          isAuthenticated: false,
          loading: false
        });
      }
    } catch (error) {
      this.updateAuthState({
        isAuthenticated: false,
        loading: false
      });
    }
  }

  /**
   * Iniciar sesión
   */
  login(email: string, password: string): Observable<any> {
    return from(signIn({ username: email, password })).pipe(
      map(async (signInOutput) => {
        if (signInOutput.isSignedIn) {
          this.updateAuthState({
          isAuthenticated: true,
          loading: false
        });
          return { success: true, message: 'Inicio de sesión exitoso' };
        } else {
          throw new Error('Error en el inicio de sesión');
        }
      }),
      catchError((error) => {
        console.error('Error en login:', error);
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<any> {
    return from(signOut()).pipe(
      map(() => {
        this.updateAuthState({
          isAuthenticated: false,
          loading: false
        });
        return { success: true, message: 'Sesión cerrada exitosamente' };
      }),
      catchError((error) => {
        console.error('Error en logout:', error);
        throw this.handleAuthError(error);
      })
    );
  }
//Chimaltecatl24!
  /**
   * Registro de usuario
   */
  register(email: string, password: string, attributes?: any): Observable<any> {
    const signUpData = {
      username: email,
      password: password,      
      options: {
        userAttributes: {
          email:email,
          'phone_number': '+52'+attributes.telefono || '',
          'given_name': attributes.nombreUsuario || '',
          'family_name': attributes.apellido || '',          
          'custom:group': attributes.tipo_usuario // Ejemplo de atributo personalizado
        }
      }
    };

    return from(signUp(signUpData)).pipe(
      map((result) => {
        return {
          success: true,
          message: 'Usuario registrado exitosamente. Verifica tu email para confirmar la cuenta.',
          userId: result.userId
        };
      }),
      catchError((error) => {
        console.error('Error en registro:', error);
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Confirmar registro de usuario
   */
  confirmRegistration(email: string, confirmationCode: string): Observable<any> {
    return from(confirmSignUp({ username: email, confirmationCode })).pipe(
      map(() => {
        return { success: true, message: 'Cuenta confirmada exitosamente' };
      }),
      catchError((error) => {
        console.error('Error en confirmación:', error);
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Reenviar código de confirmación
   */
  resendConfirmationCode(email: string): Observable<any> {
    return from(resendSignUpCode({ username: email })).pipe(
      map(() => {
        return { success: true, message: 'Código de confirmación reenviado' };
      }),
      catchError((error) => {
        console.error('Error al reenviar código:', error);
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  forgotPassword(email: string): Observable<any> {
    return from(resetPassword({ username: email })).pipe(
      map(() => {
        return { success: true, message: 'Código de restablecimiento enviado al email' };
      }),
      catchError((error) => {
        console.error('Error en forgot password:', error);
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Confirmar restablecimiento de contraseña
   */
  confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Observable<any> {
    return from(confirmResetPassword({ username: email, confirmationCode, newPassword })).pipe(
      map(() => {
        return { success: true, message: 'Contraseña restablecida exitosamente' };
      }),
      catchError((error) => {
        console.error('Error en confirm forgot password:', error);
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return from(updatePassword({ oldPassword, newPassword })).pipe(
      map(() => {
        return { success: true, message: 'Contraseña actualizada exitosamente' };
      }),
      catchError((error) => {
        console.error('Error en change password:', error);
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<any> {
    return await fetchAuthSession().then(user => {
      return user;
    })
  }
  

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return this.authState$.pipe(
      map(state => state.isAuthenticated)
    );
  }

  /**
   * Obtener estado de carga
   */
  isLoading(): Observable<boolean> {
    return this.authState$.pipe(
      map(state => state.loading)
    );
  }

  /**
   * Actualizar estado de autenticación
   */
  private updateAuthState(state: AuthState): void {
    this.authState.next(state);
  }

  /**
   * Manejar errores de autenticación
   */
  private handleAuthError(error: any): any {
    let message = 'Error de autenticación';

    if (error.name === 'NotAuthorizedException') {
      message = 'Credenciales incorrectas';
    } else if (error.name === 'UserNotFoundException') {
      message = 'Usuario no encontrado';
    } else if (error.name === 'UserNotConfirmedException') {
      message = 'Usuario no confirmado';
    } else if (error.name === 'CodeMismatchException') {
      message = 'Código de confirmación incorrecto';
    } else if (error.name === 'ExpiredCodeException') {
      message = 'Código expirado';
    } else if (error.name === 'LimitExceededException') {
      message = 'Demasiados intentos. Intenta más tarde';
    } else if (error.name === 'InvalidPasswordException') {
      message = 'La contraseña no cumple con los requisitos';
    } else if (error.name === 'UsernameExistsException') {
      message = 'El usuario ya existe';
    } else if (error.name === 'InvalidParameterException') {
      message = 'Parámetros inválidos';
    }

    return {
      name: error.name,
      message,
      originalError: error
    };
  }
}
