import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TratamientosService } from './tratamientos';
import { environment } from '../../../environments/environment';
import { TratamientoOficial } from '../models/tratamiento.model';

describe('TratamientosService', () => {
  let service: TratamientosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TratamientosService]
    });
    service = TestBed.inject(TratamientosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll() should return list of tratamientos', () => {
    const mockTratamientos: TratamientoOficial[] = [
      {
        id: 1, cultivoId: 1, plagaId: 1, productoId: 1,
        dosis: 2, unidadDosis: 'L/ha', metodoAplicacion: 'FOLIAR',
        intervaloDias: 7, numeroAplicaciones: 3, duracionTotalDias: 21,
        diasCarencia: 14, fechaValidacion: '2025-01-01T00:00:00Z'
      },
      {
        id: 2, cultivoId: 2, plagaId: 2, productoId: 2,
        dosis: 1.5, unidadDosis: 'L/ha', metodoAplicacion: 'SUELO',
        intervaloDias: 10, numeroAplicaciones: 2, duracionTotalDias: 20,
        diasCarencia: 7, fechaValidacion: '2025-01-02T00:00:00Z'
      }
    ];

    service.findAll().subscribe(tratamientos => {
      expect(tratamientos).toEqual(mockTratamientos);
      expect(tratamientos.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tratamientos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTratamientos);
  });
});
