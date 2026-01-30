import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { EmitirFacturaComponent } from './emitir-factura.component';

describe('EmitirFacturaComponent', () => {
  let component: EmitirFacturaComponent;
  let fixture: ComponentFixture<EmitirFacturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmitirFacturaComponent],
      providers: [provideHttpClient()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EmitirFacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
