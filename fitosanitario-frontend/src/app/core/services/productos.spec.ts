import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductosService } from './productos';
import { environment } from '../../../environments/environment';
import { Producto } from '../models/producto.model';

describe('ProductosService', () => {
  let service: ProductosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductosService]
    });
    service = TestBed.inject(ProductosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll() should return list of productos', () => {
    const mockProductos: Producto[] = [
      { id: 1, nombreComercial: 'Cipermex', ingredienteActivo: 'Cipermex', tipo: 'INSECTICIDA', unidadBase: 'L' },
      { id: 2, nombreComercial: 'Amistar', ingredienteActivo: 'Azoxistrobina', tipo: 'FUNGICIDA', unidadBase: 'L' }
    ];

    service.findAll().subscribe(productos => {
      expect(productos).toEqual(mockProductos);
      expect(productos.length).toBe(2);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/productos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProductos);
  });
});
