import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ListaFacturasComponent } from './lista-facturas.component';
import { AuthService } from '../../services/auth.service';
import { TimbresService } from '../../services/timbres.service';
import { FacturacionService } from '../../services/facturacion.service';
import { of } from 'rxjs';

describe('ListaFacturasComponent', () => {
  let component: ListaFacturasComponent;
  let fixture: ComponentFixture<ListaFacturasComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let timbresServiceSpy: jasmine.SpyObj<TimbresService>;
  let facturacionServiceSpy: jasmine.SpyObj<FacturacionService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    timbresServiceSpy = jasmine.createSpyObj('TimbresService', ['getFacturasEmitidasByMes']);
    facturacionServiceSpy = jasmine.createSpyObj('FacturacionService', ['cancelaFactura']);

    // Mock getCurrentUser to return a resolved promise with mock user data
    authServiceSpy.getCurrentUser.and.returnValue(Promise.resolve({
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com'
          }
        }
      }
    }));

    timbresServiceSpy.getFacturasEmitidasByMes.and.returnValue(of({ body: [] }));

    await TestBed.configureTestingModule({
      imports: [ListaFacturasComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TimbresService, useValue: timbresServiceSpy },
        { provide: FacturacionService, useValue: facturacionServiceSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ListaFacturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
