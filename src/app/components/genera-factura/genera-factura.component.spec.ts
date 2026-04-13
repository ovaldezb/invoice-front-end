import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { GeneraFacturaComponent } from './genera-factura.component';
import { FacturacionService } from '../../services/facturacion.service';
import { environment } from '../../../environments/environment';
import { of, BehaviorSubject } from 'rxjs';
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { VentaTapete } from '../../models/ventaTapete';
import { Ticket } from '../../models/ticket';
import { AuthService } from '../../services/auth.service';
import { EnvironmentService } from '../../services/environment.service';

describe('GeneraFacturaComponent', () => {
  let component: GeneraFacturaComponent;
  let fixture: ComponentFixture<GeneraFacturaComponent>;
  let facturacionServiceSpy: jasmine.SpyObj<FacturacionService>;
  let environmentServiceSpy: jasmine.SpyObj<EnvironmentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  
  const authStateSubject = new BehaviorSubject({ isAuthenticated: false, loading: false, user: null });

  beforeEach(async () => {
    facturacionServiceSpy = jasmine.createSpyObj('FacturacionService', ['obtieneDatosVenta']);
    environmentServiceSpy = jasmine.createSpyObj('EnvironmentService', ['getEnvironment']);
    authServiceSpy = jasmine.createSpyObj('AuthService', [], { authState$: authStateSubject.asObservable() });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [GeneraFacturaComponent, HttpClientModule],
      providers: [
        { provide: FacturacionService, useValue: facturacionServiceSpy },
        { provide: EnvironmentService, useValue: environmentServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GeneraFacturaComponent);
    component = fixture.componentInstance;
    
    environmentServiceSpy.getEnvironment.and.returnValue(of(new HttpResponse({ body: { environment: 'test' } })));
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe llamar al servicio para consultar la venta y actualizar ventaTapete', fakeAsync(() => {
    const mockVenta = new VentaTapete('venta', new Ticket('123', '2023-09-07', 1, 1, 1, 1), [], { formapago: '01' });
    facturacionServiceSpy.obtieneDatosVenta.and.returnValue(of(new HttpResponse({
      body: {
        venta: mockVenta,
        certificado: { _id: 'cert1' },
        sucursal: { codigo_sucursal: 'suc1' }
      },
      status: 200
    })));

    component.ticketNumber = '123';
    component.consultarVenta();
    tick();

    expect(facturacionServiceSpy.obtieneDatosVenta).toHaveBeenCalledWith('123');
    expect(component.ventaTapete).toEqual(mockVenta);
    expect(component.isBusquedaTicket).toBeFalse();
  }));

  it('debe reiniciar los datos y mostrar la pantalla de consulta al llamar regresarAConsulta()', () => {
    component.ventaTapete = new VentaTapete('venta', new Ticket('1', '2023-01-01', 1, 1, 1, 1), [], { formapago: '01' });
    component.isBusquedaTicket = false;
    
    component.regresarAConsulta();
    
    expect(component.ventaTapete.ticket.noVenta).toBe('');
    expect(component.isBusquedaTicket).toBeTrue();
    expect(routerSpy.navigate).toHaveBeenCalledWith([], jasmine.any(Object));
  });

  it('debe obtener el ambiente al inicializar', () => {
    component.ngOnInit();
    expect(environmentServiceSpy.getEnvironment).toHaveBeenCalled();
    expect(component.backEndEnv).toBe('test');
  });

  it('debe suscribirse a los cambios de autenticación', () => {
    authStateSubject.next({ isAuthenticated: true, loading: false, user: {} as any });
    fixture.detectChanges();
    expect(component.isAuthenticated).toBeTrue();
  });
});