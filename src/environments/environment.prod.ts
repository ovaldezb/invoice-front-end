export const environment = {
  production: true,
  aws: {
    cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX', // Reemplaza con tu User Pool ID de producción
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX' // Reemplaza con tu Client ID de producción
    }
  }
};
