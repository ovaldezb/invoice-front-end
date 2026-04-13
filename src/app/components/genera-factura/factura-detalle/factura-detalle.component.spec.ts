import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FacturaDetalleComponent } from './factura-detalle.component';
import { FacturacionService } from '../../../services/facturacion.service';
import { FacturaCalculatorService } from '../../../services/factura-calculator.service';
import { ParsePdfService } from '../../../services/parse-pdf.service';
import { of } from 'rxjs';
import { Receptor } from '../../../models/receptor';
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { VentaTapete } from '../../../models/ventaTapete';
import { Ticket } from '../../../models/ticket';
import { RegimenFiscal } from '../../../models/regimenfiscal';
import { UsoCFDI } from '../../../models/usoCfdi';
import { FormaPago } from '../../../models/formapago';
import { Global } from '../../../services/Global';

describe('FacturaDetalleComponent', () => {
  let component: FacturaDetalleComponent;
  let fixture: ComponentFixture<FacturaDetalleComponent>;
  let facturacionServiceSpy: jasmine.SpyObj<FacturacionService>;
  let facturaCalculatorSpy: jasmine.SpyObj<FacturaCalculatorService>;
  let pdfServiceSpy: jasmine.SpyObj<ParsePdfService>;

  beforeEach(async () => {
    facturacionServiceSpy = jasmine.createSpyObj('FacturacionService', [
      'obtieneDatosReceptorByRfc',
      'getDatosParaFacturar',
      'generaFactura',
      'guardaReceptor'
    ]);
    facturaCalculatorSpy = jasmine.createSpyObj('FacturaCalculatorService', [
      'isReceptorValid',
      'isValidEmail',
      'buildTimbrado',
      'esPersonaFisica'
    ]);
    pdfServiceSpy = jasmine.createSpyObj('ParsePdfService', ['parsePdf']);

    await TestBed.configureTestingModule({
      imports: [FacturaDetalleComponent, HttpClientModule],
      providers: [
        { provide: FacturacionService, useValue: facturacionServiceSpy },
        { provide: FacturaCalculatorService, useValue: facturaCalculatorSpy },
        { provide: ParsePdfService, useValue: pdfServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FacturaDetalleComponent);
    component = fixture.componentInstance;
    
    // Default mock behavior
    facturacionServiceSpy.getDatosParaFacturar.and.returnValue(of(new HttpResponse({ body: {} })));
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe llamar al servicio y actualizar el receptor si el RFC es válido (onRfcBlur)', () => {
    const mockReceptor = new Receptor('VABO780711D41', 'Juan Pérez', '12345', '601', 'G03', 'juan@email.com', 'ID123');
    facturacionServiceSpy.obtieneDatosReceptorByRfc.and.returnValue(of(new HttpResponse({
      body: mockReceptor,
      status: 200
    })));

    component.receptor.Rfc = 'VABO780711D41';
    component.onRfcBlur();

    expect(facturacionServiceSpy.obtieneDatosReceptorByRfc).toHaveBeenCalledWith('VABO780711D41');
    expect(component.receptor).toEqual(mockReceptor);
    expect(component.isLoadingReceptor).toBeFalse();
  });

  it('debe actualizar las listas al llamar obtieneDatosParaFacturar()', fakeAsync(() => {
    const mockRegimenFiscal = [{ regimenfiscal: '601', descripcion: 'General' }] as RegimenFiscal[];
    const mockUsoCfdi = [{ id: '1', usoCfdi: 'G03', descripcion: 'Gastos', regfiscalreceptor: '601' }] as UsoCFDI[];
    const mockFormaPago = [{ id: '1', formapago: '01', descripcion: 'Efectivo' }] as FormaPago[];

    facturacionServiceSpy.getDatosParaFacturar.and.returnValue(of(new HttpResponse({
      body: {
        regimen_fiscal: mockRegimenFiscal,
        uso_cfdi: mockUsoCfdi,
        forma_pago: mockFormaPago
      }
    })));

    component.obtieneDatosParaFacturar();
    tick();

    expect(component.listaRegimenFiscal).toEqual(mockRegimenFiscal);
    expect(component.listaUsoCfdi).toEqual(mockUsoCfdi);
    expect(component.listaFormaPago).toEqual(mockFormaPago);
  }));

  it('debe filtrar listaUsoCfdiFiltrado según el régimen fiscal seleccionado en buscaUsoCfdi()', () => {
    component.listaRegimenFiscal = [
      { regimenfiscal: '601', descripcion: 'General' }
    ] as any[];
    component.listaUsoCfdi = [
      { id: '1', usoCfdi: 'G03', descripcion: 'Gastos', regfiscalreceptor: '601' },
      { id: '2', usoCfdi: 'P01', descripcion: 'Por definir', regfiscalreceptor: '603' }
    ] as any[];

    const event = { target: { selectedIndex: 1 } };
    component.buscaUsoCfdi(event);

    expect(component.listaUsoCfdiFiltrado).toEqual([
      { id: '1', usoCfdi: 'G03', descripcion: 'Gastos', regfiscalreceptor: '601' }
    ]);
  });

  it('debe llamar al servicio de facturación al generar la factura si el formulario es válido', () => {
    facturaCalculatorSpy.isReceptorValid.and.returnValue(true);
    facturaCalculatorSpy.buildTimbrado.and.returnValue({} as any);
    facturacionServiceSpy.generaFactura.and.returnValue(of(new HttpResponse({
      body: { uuid: 'UUID123' },
      status: 200
    })));

    component.ventaTapete = new VentaTapete('venta', new Ticket('1', '2023-01-01', 1, 1, 1, 1), [], { formapago: '01' });
    component.receptor = new Receptor('VABO780711D41', 'Juan Pérez', '12345', '601', 'G03', 'juan@email.com', 'ID123');
    
    component.generarFactura();

    expect(facturacionServiceSpy.generaFactura).toHaveBeenCalled();
    expect(component.isLoadingFactura).toBeFalse();
  });

  it('debe emitir onReset al llamar regresar()', () => {
    spyOn(component.onReset, 'emit');
    component.regresar();
    expect(component.onReset.emit).toHaveBeenCalled();
  });

  it('debe inicializar la búsqueda de receptor si se sube un PDF exitosamente', fakeAsync(() => {
    const mockPdfResponse = {
      body: {
        csf: {
          Rfc: 'VABO780711D41',
          razonSocial: 'JUAN PEREZ',
          codigoPostal: '12345',
          regimenFiscal: ['General de Ley']
        }
      }
    };
    pdfServiceSpy.parsePdf.and.returnValue(of(new HttpResponse(mockPdfResponse)));
    
    // Mocking regimen fiscal base for filtering
    component.listaRegimenFiscalBase = [{ regimenfiscal: '601', descripcion: 'General de Ley' }] as any[];
    
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    component.selectedPdf = file;
    
    component.uploadPdf();
    tick();

    expect(component.receptor.Rfc).toBe('VABO780711D41');
    expect(component.receptor.Nombre).toBe('JUAN PEREZ');
    expect(component.receptor.DomicilioFiscalReceptor).toBe('12345');
    expect(component.isUploadingPdf).toBeFalse();
  }));
});
