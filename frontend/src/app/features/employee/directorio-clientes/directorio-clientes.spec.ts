import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectorioClientes } from './directorio-clientes';

describe('DirectorioClientes', () => {
  let component: DirectorioClientes;
  let fixture: ComponentFixture<DirectorioClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectorioClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectorioClientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
