import { env } from "process";

export const environment = {
  production: false,
  aws: {
    cognito: {
      userPoolId: 'us-west-1_ckWmEpVXx', // Reemplaza con tu User Pool ID
      userPoolClientId: '203pi65laddntano1o415mj4vf' // Reemplaza con tu Client ID
    }
  },
    urlBackEnd: 'https://v6z1l22kw7.execute-api.us-west-1.amazonaws.com/prod/',
    urlDatosFactura: 'https://1infhu90j4.execute-api.us-west-1.amazonaws.com/prod/datosfactura',
  envName: 'Dev'
};
