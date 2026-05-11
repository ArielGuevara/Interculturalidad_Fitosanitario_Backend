import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';

const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_IMAGE_COUNT = 10;

@Injectable()
export class MultimediaService {
  private readonly maxImageSizeBytes: number;
  private readonly maxAudioSizeBytes: number;

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.maxImageSizeBytes =
      this.configService.get<number>('uploads.maxImageSizeBytes') ??
      DEFAULT_MAX_IMAGE_SIZE_BYTES;

    this.maxAudioSizeBytes =
      this.configService.get<number>('uploads.maxAudioSizeBytes') ??
      DEFAULT_MAX_AUDIO_SIZE_BYTES;
  }

  private validateImageFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Imagen requerida');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('MIME inválido (solo imágenes)');
    }
    if (file.size > this.maxImageSizeBytes) {
      throw new BadRequestException('Imagen supera el tamaño máximo permitido');
    }
    if (!file?.buffer) {
  throw new BadRequestException('Archivo inválido: buffer vacío');
}
  }

  private validateAudioFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Audio requerido');
    }
    if (!file.mimetype?.startsWith('audio/')) {
      throw new BadRequestException('MIME inválido (solo audio)');
    }
    if (file.size > this.maxAudioSizeBytes) {
      throw new BadRequestException('Audio supera el tamaño máximo permitido');
    }
  }

  async uploadImages(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes enviar al menos 1 imagen');
    }
    if (files.length > MAX_IMAGE_COUNT) {
      throw new BadRequestException(`Máximo ${MAX_IMAGE_COUNT} imágenes`);
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        this.validateImageFile(file);
        const objectKey = this.storageService.generateObjectKey({
          folder: 'images',
          originalName: file.originalname,
          contentType: file.mimetype,
        });

        return this.storageService.uploadBuffer({
          buffer: file.buffer,
          objectKey,
          contentType: file.mimetype,
        });
      }),
    );

    return {
      count: uploads.length,
      urls: uploads.map((u) => u.url),
    };
  }

  async uploadAudio(file: Express.Multer.File) {
    this.validateAudioFile(file);

    const objectKey = this.storageService.generateObjectKey({
      folder: 'audio',
      originalName: file.originalname,
      contentType: file.mimetype,
    });

    const upload = await this.storageService.uploadBuffer({
      buffer: file.buffer,
      objectKey,
      contentType: file.mimetype,
    });

    return { url: upload.url };
  }

  getLimits() {
    return {
      maxImageSizeBytes: this.maxImageSizeBytes,
      maxAudioSizeBytes: this.maxAudioSizeBytes,
      maxImageCount: MAX_IMAGE_COUNT,
    };
  }
}
