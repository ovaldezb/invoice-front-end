describe('Hello World Test', () => {
    it('should display the correct message', () => {
        cy.visit('/');
        cy.contains('Hello World');
    });
});