import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComunidadModeracion } from './comunidad-moderacion';
import { RecomendacionesService } from '../../../core/services/recomendaciones';
import { CultivosService } from '../../../core/services/cultivos';
import { PlagasService } from '../../../core/services/plagas';
import { ProductosService } from '../../../core/services/productos';
import { TratamientosService } from '../../../core/services/tratamientos';
import { RecomendacionComunidad } from '../../../core/models/recomendacion.model';
import { of } from 'rxjs';

describe('ComunidadModeracion', () => {
  let component: ComunidadModeracion;
  let fixture: ComponentFixture<ComunidadModeracion>;
  let recomendacionesServiceMock: { findAll: ReturnType<typeof vi.fn> };

  const mockRecomendaciones: RecomendacionComunidad[] = [
    {
      id: 1, titulo: 'Recomendación de prueba', descripcion: 'Descripción',
      tipo: 'RECOMENDACION', valoracionPromedio: 4.5, totalValoraciones: 10,
      moderado: false, createdAt: '2025-01-01T00:00:00Z',
      usuario: { id: 1, nombre: 'Juan' }
    },
    {
      id: 2, titulo: 'Consulta sobre roya', descripcion: 'Descripción consulta',
      tipo: 'CONSULTA', valoracionPromedio: 3, totalValoraciones: 5,
      moderado: true, createdAt: '2025-01-02T00:00:00Z',
      usuario: { id: 2, nombre: 'María' }
    }
  ];

  beforeEach(async () => {
    recomendacionesServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockRecomendaciones))
    };

    await TestBed.configureTestingModule({
      imports: [ComunidadModeracion],
      providers: [
        { provide: RecomendacionesService, useValue: recomendacionesServiceMock },
        { provide: CultivosService, useValue: { findAll: () => of([]) } },
        { provide: PlagasService, useValue: { findAll: () => of([]) } },
        { provide: ProductosService, useValue: { findAll: () => of([]) } },
        { provide: TratamientosService, useValue: { findAll: () => of([]) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComunidadModeracion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load recomendaciones on init', () => {
    expect(recomendacionesServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(component.recomendaciones().length).toBe(2);
    expect(component.recomendaciones()[0].titulo).toBe('Recomendación de prueba');
    expect(component.recomendaciones()[1].titulo).toBe('Consulta sobre roya');
  });
});
