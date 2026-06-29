import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecomendacionesService } from './recomendaciones';
import { environment } from '../../../environments/environment';
import { RecomendacionComunidad } from '../models/recomendacion.model';

describe('RecomendacionesService', () => {
  let service: RecomendacionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecomendacionesService]
    });
    service = TestBed.inject(RecomendacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll() should return list of recomendaciones', () => {
    const mockRecomendaciones: RecomendacionComunidad[] = [
      {
        id: 1, titulo: 'Recomendación 1', descripcion: 'Descripción',
        tipo: 'RECOMENDACION', valoracionPromedio: 4.5, totalValoraciones: 10,
        moderado: false, createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: 2, titulo: 'Consulta 1', descripcion: 'Descripción consulta',
        tipo: 'CONSULTA', valoracionPromedio: 3, totalValoraciones: 5,
        moderado: true, createdAt: '2025-01-02T00:00:00Z'
      }
    ];

    service.findAll().subscribe(recomendaciones => {
      expect(recomendaciones).toEqual(mockRecomendaciones);
      expect(recomendaciones.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/recomendaciones`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRecomendaciones);
  });

  it('findAll() should pass tipo filter as query param', () => {
    service.findAll({ tipo: 'RECOMENDACION' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url === `${environment.apiUrl}/recomendaciones` &&
      r.params.get('tipo') === 'RECOMENDACION'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
