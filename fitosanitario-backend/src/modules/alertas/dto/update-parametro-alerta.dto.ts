import { PartialType } from '@nestjs/mapped-types';
import { CreateParametroAlertaDto } from './create-parametro-alerta.dto';

export class UpdateParametroAlertaDto extends PartialType(
  CreateParametroAlertaDto,
) {}
