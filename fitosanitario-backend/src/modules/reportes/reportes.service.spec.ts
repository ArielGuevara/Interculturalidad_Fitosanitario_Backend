import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesRepository } from './reportes.repository';
import { MultimediaService } from '../multimedia/multimedia.service';
import { CreateReporteDto } from './dto/create-reporte.dto';

describe('ReportesService', () => {
  let service: ReportesService;
  let reportesRepository: jest.Mocked<ReportesRepository>;
  let multimediaService: jest.Mocked<MultimediaService>;

  const mockReporte = {
    id: 1,
    titulo: 'Reporte test',
    descripcion: 'Descripción',
    descripcionProblema: 'Problema',
    usuarioId: 1,
    cultivoId: 1,
    plagaId: null,
    imagenesUrls: [],
    audioUrl: null,
    latitud: -1.23,
    longitud: -78.45,
    estado: 'PENDIENTE',
    sincronizado: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        {
          provide: ReportesRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByUsuario: jest.fn(),
            findPendientes: jest.fn(),
            findById: jest.fn(),
            cambiarEstado: jest.fn(),
            getHistorial: jest.fn(),
          },
        },
        {
          provide: MultimediaService,
          useValue: {
            uploadImages: jest.fn(),
            uploadAudio: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportesService>(ReportesService);
    reportesRepository = module.get(ReportesRepository);
    multimediaService = module.get(MultimediaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a reporte with images and audio', async () => {
      const dto: CreateReporteDto = {
        titulo: 'Reporte test',
        descripcion: 'Descripción',
        descripcionProblema: 'Problema',
        cultivoId: 1,
        latitud: -1.23,
        longitud: -78.45,
      };

      multimediaService.uploadImages.mockResolvedValue({
        count: 2,
        urls: ['url1', 'url2'],
      });
      multimediaService.uploadAudio.mockResolvedValue({ url: 'audio-url' });
      reportesRepository.create.mockResolvedValue(mockReporte);

      const result = await service.create({
        dto,
        usuarioId: 1,
        images: [
          {
            originalname: 'img.jpg',
            buffer: Buffer.from(''),
            mimetype: 'image/jpeg',
          } as Express.Multer.File,
        ],
        audio: {
          originalname: 'audio.mp3',
          buffer: Buffer.from(''),
          mimetype: 'audio/mpeg',
        } as Express.Multer.File,
      });

      expect(multimediaService.uploadImages).toHaveBeenCalled();
      expect(multimediaService.uploadAudio).toHaveBeenCalled();
      expect(reportesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Reporte test',
          usuarioId: 1,
          imagenesUrls: ['url1', 'url2'],
          audioUrl: 'audio-url',
        }),
      );
      expect(result).toEqual(mockReporte);
    });

    it('should create a reporte without images or audio', async () => {
      const dto: CreateReporteDto = {
        titulo: 'Reporte sin multimedia',
        descripcion: 'Solo texto',
        cultivoId: 1,
        latitud: -1.23,
        longitud: -78.45,
      };

      multimediaService.uploadImages.mockResolvedValue({ count: 0, urls: [] });
      multimediaService.uploadAudio.mockResolvedValue({ url: null });
      reportesRepository.create.mockResolvedValue(mockReporte);

      const result = await service.create({ dto, usuarioId: 1 });

      expect(multimediaService.uploadImages).not.toHaveBeenCalled();
      expect(multimediaService.uploadAudio).not.toHaveBeenCalled();
      expect(reportesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Reporte sin multimedia',
          imagenesUrls: [],
          audioUrl: null,
        }),
      );
      expect(result).toEqual(mockReporte);
    });

    it('should throw BadRequestException when more than 10 images', async () => {
      const dto: CreateReporteDto = {
        titulo: 'Muchas imágenes',
        cultivoId: 1,
        latitud: -1.23,
        longitud: -78.45,
      };

      const manyImages = Array.from({ length: 11 }, (_, i) => ({
        originalname: `img${i}.jpg`,
        buffer: Buffer.from(''),
        mimetype: 'image/jpeg',
      })) as Express.Multer.File[];

      await expect(
        service.create({ dto, usuarioId: 1, images: manyImages }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByUsuario', () => {
    it('should find reportes by usuario', async () => {
      reportesRepository.findByUsuario.mockResolvedValue([mockReporte]);

      const result = await service.findByUsuario(1);

      expect(reportesRepository.findByUsuario).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockReporte]);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException for non-existent reporte', async () => {
      reportesRepository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('should return reporte when found', async () => {
      reportesRepository.findById.mockResolvedValue(mockReporte);

      const result = await service.findById(1);

      expect(result).toEqual(mockReporte);
    });
  });
});
