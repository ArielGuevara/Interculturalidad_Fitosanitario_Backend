import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CultivosService } from './cultivos';
import { environment } from '../../../environments/environment';
import { Cultivo } from '../models/cultivo.model';

describe('CultivosService', () => {
  let service: CultivosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CultivosService]
    });
    service = TestBed.inject(CultivosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll() should return list of cultivos', () => {
    const mockCultivos: Cultivo[] = [
      { id: 1, nombre: 'Maíz', descripcion: 'Cultivo de maíz' },
      { id: 2, nombre: 'Frijol', descripcion: 'Cultivo de frijol' }
    ];

    service.findAll().subscribe(cultivos => {
      expect(cultivos).toEqual(mockCultivos);
      expect(cultivos.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cultivos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCultivos);
  });

  it('findById() should return a single cultivo', () => {
    const mockCultivo: Cultivo = { id: 1, nombre: 'Maíz', descripcion: 'Cultivo de maíz' };

    service.findById(1).subscribe(cultivo => {
      expect(cultivo).toEqual(mockCultivo);
      expect(cultivo.nombre).toBe('Maíz');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cultivos/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCultivo);
  });
});
