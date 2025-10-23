import { TestBed } from '@angular/core/testing';
import { FacturaCalculatorService } from './factura-calculator.service';
import { VentaTapete } from '../models/ventaTapete';
import { Ticket } from '../models/ticket';
import { Receptor } from '../models/receptor';
import { Certificado } from '../models/certificado';
import { Sucursal } from '../models/sucursal';

describe('FacturaCalculatorService', () => {
  let service: FacturaCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacturaCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate email correctly', () => {
    expect(service.isValidEmail('test@example.com')).toBe(true);
    expect(service.isValidEmail('invalid-email')).toBe(false);
    expect(service.isValidEmail('test@')).toBe(false);
    expect(service.isValidEmail('@example.com')).toBe(false);
  });

  it('should identify persona fisica RFC correctly', () => {
    expect(service.esPersonaFisica('XAXX010101000')).toBe(true);
    expect(service.esPersonaFisica('ABC123456789')).toBe(false);
  });

  it('should validate receptor correctly', () => {
    const validReceptor = new Receptor(
      'XAXX010101000',
      'Test Name',
      '12345',
      '601',
      'G03',
      'test@example.com',
      ''
    );
    expect(service.isReceptorValid(validReceptor)).toBe(true);

    const invalidReceptor = new Receptor('', '', '', '', '', '', '');
    expect(service.isReceptorValid(invalidReceptor)).toBe(false);
  });

  it('should format fecha factura correctly', () => {
    const fecha = service.getFechaFactura();
    expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});
