const cypressConfig = require("../../cypress.config");

describe('ConfiguraCsdComponent', () => {
  beforeEach( () => {
    cy.visit('/login');
  });

  it('debe permitir el login con credenciales válidas', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').clear().type(cypressConfig.env.usuario);
    cy.get('input[name="password"]').clear().type(cypressConfig.env.password);
    cy.get('button[name="login"]').click();

    // Verifica que se redirige al dashboard o muestra el componente
    cy.url({timeout: 10000}).should('include', '/dashboard');
    cy.get('app-lista-facturas').should('exist');
  });

    
});
