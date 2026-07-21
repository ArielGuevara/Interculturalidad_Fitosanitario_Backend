import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CultivosService } from '../cultivos/cultivos.service';
import { PlagasService } from '../plagas/plagas.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ProductosService } from '../productos/productos.service';
import { TratamientosService } from '../tratamientos/tratamientos.service';
import { generarPdfCultivos } from './templates/cultivos.template';
import { generarPdfPlagas } from './templates/plagas.template';
import { generarPdfUsuarios } from './templates/usuarios.template';
import { generarPdfProductos } from './templates/productos.template';
import { generarPdfTratamientos } from './templates/tratamientos.template';
import { GenerarInformeDto } from './dto/generar-informe.dto';

@Injectable()
export class InformesService {
  private readonly logger = new Logger(InformesService.name);

  constructor(
    private readonly cultivosService: CultivosService,
    private readonly plagasService: PlagasService,
    private readonly usuariosService: UsuariosService,
    private readonly productosService: ProductosService,
    private readonly tratamientosService: TratamientosService,
  ) {}

  async generar(dto: GenerarInformeDto): Promise<Buffer> {
    switch (dto.tipo) {
      case 'cultivos': {
        const data = await this.cultivosService.findAll();
        return generarPdfCultivos(data);
      }
      case 'plagas': {
        const cultivoId = dto.cultivoId ? Number(dto.cultivoId) : undefined;
        const data = await this.plagasService.findAll(undefined, cultivoId);
        return generarPdfPlagas(data, cultivoId);
      }
      case 'usuarios': {
        const rol = dto.rol || undefined;
        const data = await this.usuariosService.findAll(rol);
        return generarPdfUsuarios(data, rol);
      }
      case 'productos': {
        const tipoProducto = dto.tipoProducto || undefined;
        let data = await this.productosService.findAll();
        if (tipoProducto) {
          data = data.filter((p: any) => p.tipo === tipoProducto);
        }
        return generarPdfProductos(data, tipoProducto);
      }
      case 'tratamientos': {
        const cultivoId = dto.cultivoId ? Number(dto.cultivoId) : undefined;
        const data = await this.tratamientosService.findAll(undefined, cultivoId);
        return generarPdfTratamientos(data, cultivoId);
      }
      default:
        throw new BadRequestException(`Tipo de informe no válido: ${dto.tipo}`);
    }
  }
}
