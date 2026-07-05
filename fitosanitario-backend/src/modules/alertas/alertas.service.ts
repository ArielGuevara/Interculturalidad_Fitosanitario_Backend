import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertasRepository } from './alertas.repository';
import { ZonasRepository } from './zonas.repository';
import { ParametrosAlertaRepository } from './parametros-alerta.repository';
import { NotificacionesRepository } from './notificaciones.repository';
import { DispositivosRepository } from '../dispositivos/dispositivos.repository';
import { PushService } from '../notifications/push.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';

@Injectable()
export class AlertasService {
  constructor(
    private repo: AlertasRepository,
    private zonasRepo: ZonasRepository,
    private parametrosRepo: ParametrosAlertaRepository,
    private notificacionesRepo: NotificacionesRepository,
    private dispositivosRepo: DispositivosRepository,
    private pushService: PushService,
  ) {}

  // ── Zonas ──
  async findAllZonas() {
    return this.zonasRepo.findAll();
  }
  async findZonaById(id: number) {
    const zona = await this.zonasRepo.findById(id);
    if (!zona) throw new NotFoundException('Zona no encontrada');
    return zona;
  }
  async createZona(data: any) {
    return this.zonasRepo.create(data);
  }
  async updateZona(id: number, data: any) {
    await this.findZonaById(id);
    return this.zonasRepo.update(id, data);
  }
  async deleteZona(id: number) {
    await this.findZonaById(id);
    return this.zonasRepo.delete(id);
  }

  // ── Parámetros ──
  async findAllParametros() {
    return this.parametrosRepo.findAll();
  }
  async findParametroById(id: number) {
    const p = await this.parametrosRepo.findById(id);
    if (!p) throw new NotFoundException('Parámetro no encontrado');
    return p;
  }
  async createParametro(data: any) {
    return this.parametrosRepo.create(data);
  }
  async updateParametro(id: number, data: any) {
    await this.findParametroById(id);
    return this.parametrosRepo.update(id, data);
  }
  async deleteParametro(id: number) {
    await this.findParametroById(id);
    return this.parametrosRepo.delete(id);
  }

  // ── Alertas ──
  async findAll() {
    return this.repo.findAll();
  }
  async findById(id: number) {
    const a = await this.repo.findById(id);
    if (!a) throw new NotFoundException('Alerta no encontrada');
    return a;
  }
  async create(dto: CreateAlertaDto) {
    return this.repo.create(dto);
  }
  async marcarLeida(id: number) {
    await this.findById(id);
    return this.repo.marcarLeida(id);
  }

  // ── Detección ──
  async ejecutarDeteccion(ventanaHoras?: number) {
    const horas = ventanaHoras ?? 72;
    const brotes = await this.repo.detectarBrotes(horas);
    const creadas: any[] = [];

    for (const brote of brotes) {
      const { parametro, reportes, zonaId } = brote;
      const nivel =
        reportes.length >= 10
          ? 'CRITICO'
          : reportes.length >= 5
            ? 'ALTO'
            : 'MEDIO';
      const plagaId = parametro.plagaId;
      const cultivoId = parametro.cultivoId;

      const alerta = await this.repo.create({
        zonaId,
        parametroId: parametro.id,
        plagaId,
        cultivoId,
        titulo: `Brote detectado: ${parametro.nombre}`,
        descripcion: `Se detectaron ${reportes.length} reportes en las últimas ${parametro.ventanaHoras} horas.`,
        nivel,
        totalReportes: reportes.length,
        latitud: reportes[0]?.latitud,
        longitud: reportes[0]?.longitud,
      });

      // Notificar a todos los usuarios con dispositivos registrados
      const dispositivos = await this.dispositivosRepo.findAll();
      const usuariosNotificados = new Set<number>();
      const pushTokens: string[] = [];
      for (const d of dispositivos) {
        if (!usuariosNotificados.has(d.usuarioId)) {
          usuariosNotificados.add(d.usuarioId);
          await this.notificacionesRepo.create({
            usuarioId: d.usuarioId,
            alertaId: alerta.id,
            titulo: alerta.titulo,
            cuerpo: alerta.descripcion,
          });
        }
        pushTokens.push(d.token);
      }

      // Enviar push real via Expo
      await this.pushService.sendToTokens(
        pushTokens,
        alerta.titulo,
        alerta.descripcion,
        { alertaId: alerta.id, tipo: 'alerta' },
      );

      creadas.push(alerta);
    }

    return { alertasCreadas: creadas.length, totalBrotes: brotes.length };
  }

  // ── Notificaciones ──
  async findNotificacionesByUser(usuarioId: number) {
    return this.notificacionesRepo.findByUser(usuarioId);
  }

  async marcarNotificacionLeida(id: number) {
    return this.notificacionesRepo.marcarLeida(id);
  }

  async countNotificacionesNoLeidas(usuarioId: number) {
    return this.notificacionesRepo.countNoLeidas(usuarioId);
  }
}
