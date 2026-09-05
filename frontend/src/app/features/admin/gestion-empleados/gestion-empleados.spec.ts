import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionEmpleados } from './gestion-empleados';

describe('GestionEmpleados', () => {
  let component: GestionEmpleados;
  let fixture: ComponentFixture<GestionEmpleados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionEmpleados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionEmpleados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
