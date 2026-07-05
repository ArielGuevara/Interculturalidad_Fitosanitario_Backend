import { PartialType } from '@nestjs/mapped-types';
import { CreateZonaAlertaDto } from './create-zona-alerta.dto';

export class UpdateZonaAlertaDto extends PartialType(CreateZonaAlertaDto) {}
