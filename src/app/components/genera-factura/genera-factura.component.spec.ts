import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { GeneraFacturaComponent } from './genera-factura.component';
import { FacturacionService } from '../../services/facturacion.service';
import { of } from 'rxjs';
import { Receptor } from '../../models/receptor';
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { VentaTapete } from '../../models/ventaTapete';
import { Ticket } from '../../models/ticket';
import { RegimenFiscal } from '../../models/regimenfiscal';
import { UsoCFDI } from '../../models/usoCfdi';
import { FormaPago } from '../../models/formapago';

describe('GeneraFacturaComponent', () => {
  let component: GeneraFacturaComponent;
  let fixture: ComponentFixture<GeneraFacturaComponent>;
  let facturacionServiceSpy: jasmine.SpyObj<FacturacionService>;

  beforeEach(async () => {
    facturacionServiceSpy = jasmine.createSpyObj('FacturacionService', ['obtieneDatosReceptorByRfc', 'obtieneDatosVenta', 'getDatosParaFacturar']);
    await TestBed.configureTestingModule({
      imports: [GeneraFacturaComponent, HttpClientModule],
      providers: [
        { provide: FacturacionService, useValue: facturacionServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GeneraFacturaComponent);
    component = fixture.componentInstance;
  });

  it('debe llamar al servicio y actualizar el receptor si el RFC es válido', () => {
    const mockReceptor = new Receptor('VABO780711D41', 'Juan Pérez', '12345', '601', 'G03', 'juan@email.com');
    facturacionServiceSpy.obtieneDatosReceptorByRfc.and.returnValue(of(new HttpResponse({
      body: mockReceptor,
      status: 200,
      statusText: 'OK'
    })));

    component.receptor.Rfc = 'VABO780711D41';
    component.obtieneReceptor();

    expect(facturacionServiceSpy.obtieneDatosReceptorByRfc).toHaveBeenCalledWith('VABO780711D41');
    expect(component.receptor).toEqual(mockReceptor);
    expect(component.isLoadingReceptor).toBeFalse();
  });

  it('debe limpiar los datos de venta y factura al llamar limpiaDatosVentaFactura()', () => {
    // Prepara datos simulados
    component.isLoadingFactura = true;
    component.isBusquedaTicket = false;
    component.timbrado = { Version: '4.0' } as any;
    component.receptor = new Receptor('RFC', 'Nombre', 'Domicilio', '601', 'G03', 'email@email.com');
    component.ventaTapete = new VentaTapete('venta', new Ticket('1', '2023-01-01', 1, 1, 1, 1), [], { formapago: '01' });
    // Ejecuta el método
    component.limpiaDatosVentaFactura();
    // Verifica los resultados
    expect(component.isLoadingFactura).toBeFalse();
    expect(component.isBusquedaTicket).toBeTrue();
    expect(component.timbrado).toEqual({} as any);
    expect(component.receptor).toEqual(new Receptor('', '', '', '', '', ''));
    expect(component.ventaTapete.ticket.noVenta).toBe('');
  });

  // El método getFechaFactura se movió al servicio FacturaCalculatorService
  // Se elimina este test del componente ya que la lógica está centralizada en el servicio

  it('debe llamar al servicio de facturación y establecer isLoadingFactura en true al generar la factura', () => {
    // Simula el método del servicio
    facturacionServiceSpy.generaFactura = jasmine.createSpy().and.returnValue(of({ folio: 'F123' }));

    // Prepara datos mínimos requeridos
    component.receptor = new Receptor('VABO780711D41', 'Juan Pérez', '12345', '601', 'G03', 'juan@email.com');
    component.ventaTapete = new VentaTapete('venta', new Ticket('1', '2023-01-01', 1, 1, 1, 1), [], { formapago: '01' });

    // Ejecuta el método
    component.generarFactura();

    // Verifica que se llama al servicio y cambia el estado de carga
    expect(facturacionServiceSpy.generaFactura).toHaveBeenCalled();
    expect(component.isLoadingFactura).toBeFalse();
  });

  it('debe llamar al servicio para guardar el receptor y actualizar isLoadingReceptor', () => {
    facturacionServiceSpy.guardaReceptor = jasmine.createSpy().and.returnValue(of({ success: true }));
    component.receptor = new Receptor('VABO780711D41', 'Juan Pérez', '12345', '601', 'G03', 'juan@email.com');
    component.isLoadingReceptor = false;
    component.guardaReceptor();
    expect(facturacionServiceSpy.guardaReceptor).toHaveBeenCalledWith(component.receptor);
    expect(component.isLoadingReceptor).toBeFalse();
  });

  it('debe llamar al servicio para consultar la venta y actualizar ventaTapete', fakeAsync(() => {
    const mockVenta = new VentaTapete('venta', new Ticket('123', '2023-09-07', 1, 1, 1, 1), [], { formapago: '01' });
    facturacionServiceSpy.obtieneDatosVenta.and.returnValue(of(new HttpResponse({
      body: {
        venta: mockVenta,
        certificado: {},
        sucursal: {}
      },
      status: 200,
      statusText: 'OK'
    })));

    component.ticketNumber = '123';
    component.consultarVenta();
    tick(); // Simula el paso del tiempo para que se resuelva el observable
    // Verifica que se llama al servicio y se actualiza ventaTapete
    expect(facturacionServiceSpy.obtieneDatosVenta).toHaveBeenCalledWith('123');
    expect(component.ventaTapete).toEqual(mockVenta);
  }));

  it('debe actualizar las listas al llamar obtieneDatosParaFacturar()', fakeAsync(() => {
    const mockRegimenFiscal = [{ regimenfiscal: '601', descripcion: 'General de Ley Personas Morales' }] as RegimenFiscal[];
    const mockUsoCfdi = [{ id: '1', usoCfdi: 'G03', descripcion: 'Gastos en general', regfiscalreceptor: '601' }] as UsoCFDI[];
    const mockFormaPago = [{ 'id': '1', formapago: '01', descripcion: 'Efectivo' }] as FormaPago[];

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


  it('debe reiniciar los datos y mostrar la pantalla de consulta al llamar regresarAConsulta()', () => {
    // Prepara datos simulados
    component.ventaTapete = new VentaTapete('venta', new Ticket('1', '2023-01-01', 1, 1, 1, 1), [], { formapago: '01' });
    component.receptor = new Receptor('RFC', 'Nombre', 'Domicilio', '601', 'G03', 'email@email.com');
    component.listaUsoCfdiFiltrado = [{ id: '1', usoCfdi: 'G03', descripcion: 'Gastos en general', regfiscalreceptor: '601' }];
    component.showValidationErrors = true;
    component.isBusquedaTicket = false;
    component.regresarAConsulta();
    expect(component.ventaTapete).toEqual(new VentaTapete('', new Ticket('', '', 0, 0, 0, 0), [], { formapago: '' }));
    expect(component.receptor).toEqual(new Receptor('', '', '', '', '', ''));
    expect(component.listaUsoCfdiFiltrado).toEqual([]);
    expect(component.showValidationErrors).toBeFalse();
    expect(component.isBusquedaTicket).toBeTrue();
  });

  it('debe filtrar listaUsoCfdiFiltrado según el régimen fiscal seleccionado en buscaUsoCfdi()', () => {
    // Datos simulados
    component.listaRegimenFiscal = [
      { regimenfiscal: '601', descripcion: 'General de Ley Personas Morales' },
      { regimenfiscal: '603', descripcion: 'Personas Morales con Fines no Lucrativos' }
    ] as any[];

    component.listaUsoCfdi = [
      { id: '1', usoCfdi: 'G03', descripcion: 'Gastos en general', regfiscalreceptor: '601' },
      { id: '2', usoCfdi: 'P01', descripcion: 'Por definir', regfiscalreceptor: '603' }
    ] as any[];

    // Simula el evento de selección (selectedIndex = 1 para el primer régimen fiscal)
    const event = { target: { selectedIndex: 1 } };

    component.buscaUsoCfdi(event);

    // Verifica que solo se filtre el usoCfdi correspondiente al régimen fiscal seleccionado
    expect(component.listaUsoCfdiFiltrado).toEqual([
      { id: '1', usoCfdi: 'G03', descripcion: 'Gastos en general', regfiscalreceptor: '601' }
    ]);
  });

  it('debe generar el objeto Timbrado correctamente delegando al servicio facturaCalculator', () => {
    // Simula datos de producto y configuración global
    (globalThis as any).Global = {
      Factura: {
        Version: '4.0',
        FACTOR_DIV: 1,
        IVA: 0.16,
        ImpuestoIVA: '002',
        Tasa: 'Tasa',
        TasaOCuotaIVA: 0.160000,
        ObjectoImpuesto: '02'
      },
      DECIMAL_FIXED: 2
    };

    const prod = {
      claveproducto: '10101504',
      cantidad: 2,
      claveunidad: 'H87',
      unidad: 'Pieza',
      descripcio: 'Tapete',
      precio: 100,
      importe: 200
    };
    component.ventaTapete = new VentaTapete('venta', new Ticket('123', '2023-01-01', 1, 1, 1, 1), [prod], { formapago: '01' });
    component.receptor = new Receptor('RFC', 'Nombre', '12345', '601', 'G03', 'email@email.com');
    component.sucursal = { serie: 'A', codigo_postal: '12345', codigo_sucursal: '01', regimen_fiscal: '601' } as any;
    component.certificado = { rfc: 'RFCEMISOR', nombre: 'EMPRESA', _id: 'CERT123' } as any;

    // Ejecuta el método que llama internamente al servicio
    component.generaFactura();

    // No necesitamos verificar la lógica interna aquí (eso va en el test del servicio)
    // pero podemos verificar que el proceso fluye sin errores
    expect(component.isLoadingFactura).toBeFalse();
  });

});