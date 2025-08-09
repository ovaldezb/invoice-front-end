# Configuración de AWS Cognito

## Pasos para configurar AWS Cognito

### 1. Crear User Pool en AWS Cognito

1. Ve a la consola de AWS
2. Navega a Cognito > User Pools
3. Crea un nuevo User Pool con las siguientes configuraciones:

#### Configuración básica:
- **Pool name**: `invoice-app-users`
- **How do you want to allow users to sign in?**: Email
- **Do you want to configure advanced settings?**: No

#### Configuración de políticas de contraseña:
- **Password policy**: Requerir mayúsculas, minúsculas, números y caracteres especiales
- **Minimum password length**: 8
- **Temporary password expiration**: 7 días

#### Configuración de MFA:
- **Multi-factor authentication**: Opcional
- **User account recovery**: Habilitado

#### Configuración de mensajes:
- **Verification message**: Email
- **Email provider**: Send email through Cognito

### 2. Crear App Client

1. En tu User Pool, ve a "App integration"
2. Crea un nuevo App Client:
   - **App client name**: `invoice-app-client`
   - **Confidential client**: No
   - **Generate client secret**: No

### 3. Configurar el proyecto Angular

1. Actualiza el archivo `src/environments/environment.ts` con tus credenciales de desarrollo:
```typescript
export const environment = {
  production: false,
  aws: {
    cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX', // Tu User Pool ID
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX' // Tu Client ID
    }
  }
};
```

2. Actualiza el archivo `src/environments/environment.prod.ts` con tus credenciales de producción:
```typescript
export const environment = {
  production: true,
  aws: {
    cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX', // Tu User Pool ID de producción
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX' // Tu Client ID de producción
    }
  }
};
```

3. El archivo `src/app/config/amplify.config.ts` ya está configurado para leer las variables de environment automáticamente.

### 4. Funcionalidades disponibles

El servicio `AuthService` incluye las siguientes funcionalidades:

#### Autenticación:
- `login(email, password)`: Iniciar sesión
- `logout()`: Cerrar sesión
- `isAuthenticated()`: Verificar si el usuario está autenticado
- `getCurrentUser()`: Obtener usuario actual

#### Registro:
- `register(email, password, attributes)`: Registrar nuevo usuario
- `confirmRegistration(email, confirmationCode)`: Confirmar registro
- `resendConfirmationCode(email)`: Reenviar código de confirmación

#### Recuperación de contraseña:
- `forgotPassword(email)`: Solicitar restablecimiento
- `confirmForgotPassword(email, code, newPassword)`: Confirmar restablecimiento
- `changePassword(oldPassword, newPassword)`: Cambiar contraseña

### 5. Uso del servicio

```typescript
import { AuthService } from './services/auth.service';

constructor(private authService: AuthService) {}

// Login
this.authService.login('user@example.com', 'password').subscribe({
  next: (result) => console.log('Login exitoso'),
  error: (error) => console.error('Error:', error.message)
});

// Registro
this.authService.register('user@example.com', 'password123').subscribe({
  next: (result) => console.log('Usuario registrado'),
  error: (error) => console.error('Error:', error.message)
});

// Verificar autenticación
this.authService.isAuthenticated().subscribe(isAuth => {
  console.log('Autenticado:', isAuth);
});
```

### 6. Protección de rutas

Usa el `AuthGuard` para proteger rutas:

```typescript
// En app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]
}
```

### 7. Interceptor HTTP

El `AuthInterceptor` automáticamente añade el token de autenticación a todas las peticiones HTTP.

### 8. Variables de entorno (Opcional)

Para mayor seguridad, puedes usar variables de entorno:

1. Crea un archivo `.env` en la raíz del proyecto:
```
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

2. Actualiza `amplify.config.ts`:
```typescript
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env['COGNITO_USER_POOL_ID'] || 'YOUR_USER_POOL_ID',
      userPoolClientId: process.env['COGNITO_CLIENT_ID'] || 'YOUR_USER_POOL_CLIENT_ID',
      loginWith: {
        email: true,
        phone: false,
        username: false
      }
    }
  }
};
```

## Notas importantes

- Asegúrate de que tu User Pool esté en la misma región que tu aplicación
- El App Client debe estar configurado para permitir el flujo de autenticación que necesites
- Considera habilitar MFA para mayor seguridad
- Configura las políticas de contraseña según tus requisitos de seguridad
