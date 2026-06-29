import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MultimediaService } from './multimedia';
import { environment } from '../../../environments/environment';

describe('MultimediaService', () => {
  let service: MultimediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MultimediaService]
    });
    service = TestBed.inject(MultimediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('uploadImage() should POST to correct endpoint and return URL list', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockResponse = { count: 1, urls: ['http://localhost:9000/images/test.jpg'] };

    service.uploadImage(file).subscribe(response => {
      expect(response.count).toBe(1);
      expect(response.urls.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/multimedia/upload-image`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResponse);
  });

  it('fixMinioUrl() should keep URL unchanged when already pointing to minioPublicUrl', () => {
    const url = 'http://localhost:9000/images/test.jpg';
    const fixed = service.fixMinioUrl(url);
    expect(fixed).toBe(url);
  });

  it('fixMinioUrl() should replace 127.0.0.1 with minioPublicUrl', () => {
    const url = 'http://127.0.0.1:9000/images/test.jpg';
    const fixed = service.fixMinioUrl(url);
    expect(fixed).not.toContain('127.0.0.1');
  });

  it('fixMinioUrl() should return empty string for null/undefined', () => {
    expect(service.fixMinioUrl(null)).toBe('');
    expect(service.fixMinioUrl(undefined)).toBe('');
  });

  it('fixMinioUrl() should return original for invalid URL', () => {
    expect(service.fixMinioUrl('not-a-url')).toBe('not-a-url');
  });
});
