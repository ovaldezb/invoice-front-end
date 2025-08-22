import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneraFacturaComponent } from './genera-factura.component';

describe('GeneraFacturaComponent', () => {
  let component: GeneraFacturaComponent;
  let fixture: ComponentFixture<GeneraFacturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneraFacturaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneraFacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
