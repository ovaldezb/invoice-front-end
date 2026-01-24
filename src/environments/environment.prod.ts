export const environment = {
  production: true,
  aws: {
    cognito: {
      userPoolId: 'us-east-1_pfcGvfKy1', // Reemplaza con tu User Pool ID
      userPoolClientId: 'tfts8oboht5vbs12dsoie8ecs' // Reemplaza con tu Client ID
    }
  },
  urlBackEnd: 'https://8gf95lar45.execute-api.us-east-1.amazonaws.com/prod/',
  urlDatosFactura: 'https://52xqff88ne.execute-api.us-east-1.amazonaws.com/prod/datosfactura',
  envName: 'Prod',
  MERCADO_PAGO_PUBLIC_KEY: 'APP_USR-006b703d-94f3-4c71-9854-245c36535820'
};
