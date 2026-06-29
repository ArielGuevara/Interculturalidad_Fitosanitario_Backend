import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlagasService } from './plagas';
import { environment } from '../../../environments/environment';
import { Plaga } from '../models/plaga.model';

describe('PlagasService', () => {
  let service: PlagasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlagasService]
    });
    service = TestBed.inject(PlagasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll() should return list of plagas', () => {
    const mockPlagas: Plaga[] = [
      { id: 1, nombre: 'Gusano cogollero', tipo: 'PLAGA', descripcion: 'Ataca el maíz' },
      { id: 2, nombre: 'Roya', tipo: 'ENFERMEDAD', descripcion: 'Hongo del cafeto' }
    ];

    service.findAll().subscribe(plagas => {
      expect(plagas).toEqual(mockPlagas);
      expect(plagas.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/plagas`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlagas);
  });

  it('findById() should return a single plaga', () => {
    const mockPlaga: Plaga = { id: 1, nombre: 'Gusano cogollero', tipo: 'PLAGA', descripcion: 'Ataca el maíz' };

    service.findById(1).subscribe(plaga => {
      expect(plaga).toEqual(mockPlaga);
      expect(plaga.nombre).toBe('Gusano cogollero');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/plagas/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlaga);
  });
});
