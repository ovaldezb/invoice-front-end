import { Amplify } from 'aws-amplify';
import { environment } from '../../environments/environment';

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: environment.aws.cognito.userPoolId,
      userPoolClientId: environment.aws.cognito.userPoolClientId,
      loginWith: {
        email: true,
        phone: false,
        username: false
      }
    }
  }
};

// Inicializar Amplify
Amplify.configure(amplifyConfig);
