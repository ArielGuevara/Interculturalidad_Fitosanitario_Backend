import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Logger,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { InformesService } from './informes.service';
import { GenerarInformeDto } from './dto/generar-informe.dto';

@Controller('informes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MODERADOR', 'ADMIN')
export class InformesController {
  private readonly logger = new Logger(InformesController.name);

  constructor(private readonly informesService: InformesService) {}

  @Post('generar')
  async generar(@Body() dto: GenerarInformeDto, @Res() res: Response) {
    try {
      const pdfBuffer = await this.informesService.generar(dto);

      const nombres: Record<string, string> = {
        cultivos: 'cultivos',
        plagas: 'plagas_enfermedades',
        usuarios: 'usuarios',
        productos: 'productos_fitosanitarios',
        tratamientos: 'tratamientos_oficiales',
      };

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe_${nombres[dto.tipo] || dto.tipo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (error: any) {
      this.logger.error(`Error generando informe ${dto.tipo}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error al generar el informe PDF');
    }
  }
}
