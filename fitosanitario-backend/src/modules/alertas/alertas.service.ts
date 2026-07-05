import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertasRepository } from './alertas.repository';
import { DispositivosRepository } from '../dispositivos/dispositivos.repository';
import { PushService } from '../notifications/push.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';

@Injectable()
export class AlertasService {
  constructor(
    private repo: AlertasRepository,
    private dispositivosRepo: DispositivosRepository,
    private pushService: PushService,
  ) {}

  // ── Zonas ──
  async findAllZonas() {
    return this.repo.findAllZonas();
  }
  async findZonaById(id: number) {
    const zona = await this.repo.findZonaById(id);
    if (!zona) throw new NotFoundException('Zona no encontrada');
    return zona;
  }
  async createZona(data: any) {
    return this.repo.createZona(data);
  }
  async updateZona(id: number, data: any) {
    await this.findZonaById(id);
    return this.repo.updateZona(id, data);
  }
  async deleteZona(id: number) {
    await this.findZonaById(id);
    return this.repo.deleteZona(id);
  }

  // ── Parámetros ──
  async findAllParametros() {
    return this.repo.findAllParametros();
  }
  async findParametroById(id: number) {
    const p = await this.repo.findParametroById(id);
    if (!p) throw new NotFoundException('Parámetro no encontrado');
    return p;
  }
  async createParametro(data: any) {
    return this.repo.createParametro(data);
  }
  async updateParametro(id: number, data: any) {
    await this.findParametroById(id);
    return this.repo.updateParametro(id, data);
  }
  async deleteParametro(id: number) {
    await this.findParametroById(id);
    return this.repo.deleteParametro(id);
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
  async ejecutarDeteccion() {
    const brotes = await this.repo.detectarBrotes(72);
    const creadas: any[] = [];

    for (const brote of brotes) {
      const { parametro, reportes } = brote;
      const nivel =
        reportes.length >= 10
          ? 'CRITICO'
          : reportes.length >= 5
            ? 'ALTO'
            : 'MEDIO';
      const plagaId = parametro.plagaId;
      const cultivoId = parametro.cultivoId;

      const alerta = await this.repo.create({
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
          await this.repo.createNotificacion({
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
    return this.repo.findNotificacionesByUser(usuarioId);
  }

  async marcarNotificacionLeida(id: number) {
    return this.repo.marcarNotificacionLeida(id);
  }

  async countNotificacionesNoLeidas(usuarioId: number) {
    return this.repo.countNotificacionesNoLeidas(usuarioId);
  }
}
