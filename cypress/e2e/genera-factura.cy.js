describe('Generar Factura - Flujo E2E', () => {
  beforeEach(() => {
    cy.visit('/factura'); // Ajusta la ruta si tu app no inicia en "/"
  });

    it('Consulta venta con número de ticket válido', () => {
        cy.get('input#ticketNumber').type('TNPI3112-982895');
        cy.get('button').contains('Consultar Venta').click();

        // Espera a que cargue la segunda pantalla
        cy.contains('Sistema de Facturación de Tapetes Tufan').should('be.visible');
        cy.get('span').contains('TNPI3112-982895').should('exist');
    });

    it('Muestra error si el número de ticket no existe o es incorrecto', () => {
        cy.get('input#ticketNumber').type('TICKETINVALIDO123');
        cy.get('button').contains('Consultar Venta').click();

        // Verifica que se muestre el mensaje de error
        cy.contains('Sucursal no encontrada').should('be.visible');
        // Verifica que no se muestre la segunda pantalla
        cy.contains('Sistema de Facturación de Tapetes Tufan').should('not.exist');
    });

    it('El botón "Generar Factura" está deshabilitado si faltan campos obligatorios', () => {
        cy.get('input#ticketNumber').type('TNPI3112-982895');
        cy.get('button').contains('Consultar Venta').click();

        // Asegúrate de que los campos obligatorios estén vacíos
        cy.get('input#rfc').clear();
        cy.get('input#domicilioFiscal').clear();
        cy.get('input#nombre').clear();
        cy.get('input#email').clear();
        // Verifica que el botón esté deshabilitado
        cy.contains('button','Generar Factura').should('be.disabled');
    });
    it('Al ingresar un RFC existente se llenan automáticamente los campos del formulario', () => {
        cy.get('input#ticketNumber').type('TNPI3112-982895');
        cy.get('button').contains('Consultar Venta').click();

        // Ingresa un RFC existente
        cy.get('input#rfc').type('VABO780711D41').blur(); // Usamos blur para simular que el usuario salió del campo

        // Espera a que los campos se llenen (puedes ajustar el tiempo si hay petición a backend)
        cy.get('input#domicilioFiscal').should('not.have.value', '');
        cy.get('input#nombre').should('not.have.value', '');
        cy.get('input#email').should('not.have.value', '');
        cy.get('select#regimenFiscal').should('not.have.value', '');
        cy.get('select#usoCfdi').should('not.have.value', '');
        // Verifica que el botón esté deshabilitado
        cy.contains('button','Generar Factura').should('be.enabled');
    });
    
    it('Al ingresar un RFC inexistente los campos permanecen vacíos y el botón está deshabilitado', () => {
        cy.get('input#ticketNumber').type('TNPI3112-982895');
        cy.get('button').contains('Consultar Venta').click();

        // Ingresa un RFC que no existe y pierde el foco
        cy.get('input#rfc').type('RFCNOEXISTE123').blur();

        // Verifica que los campos estén vacíos
        cy.get('input#domicilioFiscal').should('have.value', '');
        cy.get('input#nombre').should('have.value', '');
        cy.get('input#email').should('have.value', '');
        cy.get('select#regimenFiscal').should('have.value', '');
        cy.get('select#usoCfdi').should('have.value', '');
        // Verifica que el botón esté deshabilitado
        cy.contains('button','Generar Factura').should('be.disabled');
    });

    it('Muestra error CFDI40143 si el RFC es incorrecto y los demás campos son válidos', () => {
      cy.get('input#ticketNumber').type('TNPI3112-982895');
      cy.get('button').contains('Consultar Venta').click();
    
      // Ingresa un RFC incorrecto y llena los demás campos correctamente
      cy.get('input#rfc').type('RFCINCORRECTO123').blur();
      cy.get('input#domicilioFiscal').type('52756');
      cy.get('input#nombre').type('OMAR VALDEZ BECERRIL');
      cy.get('input#email').type('juan.perez@email.com');
      cy.get('select#regimenFiscal').select('601'); // Ajusta el valor según tus opciones
      cy.get('select#usoCfdi').select('G03'); // Ajusta el valor según tus opciones
    
      // Intenta generar la factura
      cy.contains('button','Generar Factura').should('be.enabled').click();
    
      // Verifica que se muestre el mensaje de error CFDI40143
      cy.contains('CFDI40143 - Este RFC del receptor no existe en la lista de RFC inscritos no cancelados del SAT.').should('be.visible');
    });
    it('Muestra error CFDI40145 si el nombre es incorrecto y los demás datos son correctos', () => {
        cy.get('input#ticketNumber').type('TNPI3112-982895');
        cy.get('button').contains('Consultar Venta').click();
        
        // Ingresa un RFC válido y los demás datos correctos, excepto el nombre
        cy.get('input#domicilioFiscal').type('52756');
        cy.get('input#nombre').type('omar valdez'); // Nombre incorrecto
        cy.get('input#email').type('juan.perez@email.com');
        cy.get('select#regimenFiscal').select('601'); // Ajusta el valor según tus opciones
        cy.get('select#usoCfdi').select('G03'); // Ajusta el valor según tus opciones
        cy.get('input#rfc').type('VABO780711D41');
        // Intenta generar la factura
        cy.contains('button','Generar Factura').should('be.enabled').click();
        
        // Verifica que se muestre el mensaje de error CFDI40145
        cy.contains('CFDI40145 - El campo Nombre del receptor, debe pertenecer al nombre asociado al RFC registrado en el campo Rfc del Receptor.').should('be.visible');
    });
    it('Muestra error CFDI40147 si el domicilio fiscal es incorrecto y los demás datos son correctos', () => {
        cy.get('input#ticketNumber').type('TNPI3112-982895');
        cy.get('button').contains('Consultar Venta').click();
    
      // Ingresa un RFC válido y los demás datos correctos, excepto el domicilio fiscal
      
        cy.get('input#domicilioFiscal').type('00000'); // Domicilio fiscal incorrecto
        cy.get('input#nombre').type('OMAR VALDEZ BECERRIL');
        cy.get('input#email').type('juan.perez@email.com');
        cy.get('select#regimenFiscal').select('601'); // Ajusta el valor según tus opciones
        cy.get('select#usoCfdi').select('G03'); // Ajusta el valor según tus opciones
        cy.get('input#rfc').type('VABO780711D41');
        // Intenta generar la factura
        cy.contains('button','Generar Factura').should('be.enabled').click();
    
        // Verifica que se muestre el mensaje de error CFDI40147
        cy.contains('CFDI40147 - El campo DomicilioFiscalReceptor del receptor, debe encontrarse en la lista de RFC inscritos no cancelados en el SAT.').should('be.visible');
    });
    it('Muestra error CFDI40158 si el régimen fiscal es incorrecto y los demás datos son correctos', () => {
        cy.get('input#ticketNumber').type('TNPI3112-982895');
        cy.get('button').contains('Consultar Venta').click();
        // Ingresa datos correctos excepto el régimen fiscal
        cy.get('input#domicilioFiscal').type('52756');
        cy.get('input#nombre').type('OMAR VALDEZ BECERRIL');
        cy.get('input#email').type('juan.perez@email.com');
        cy.get('select#regimenFiscal').select('622'); // Régimen fiscal incorrecto (ajusta el valor según tus opciones)
        cy.get('select#usoCfdi').select('G03'); // Ajusta el valor según tus opciones
        cy.get('input#rfc').type('VABO780711D41');
        // Intenta generar la factura
        cy.contains('button','Generar Factura').should('be.enabled').click();
        // Verifica que se muestre el mensaje de error CFDI40158
        cy.contains('CFDI40158 - La clave del campo RegimenFiscalR debe corresponder con el tipo de persona (física o moral).').should('be.visible');
    });
});