import { Injectable } from '@nestjs/common';
import { DispositivosRepository } from './dispositivos.repository';

@Injectable()
export class DispositivosService {
  constructor(private repo: DispositivosRepository) {}

  async findAll() { return this.repo.findAll(); }
  async findByUser(usuarioId: number) { return this.repo.findByUser(usuarioId); }
  async register(usuarioId: number, data: { token: string; plataforma: string }) {
    return this.repo.register(usuarioId, data);
  }
  async unregister(token: string) { return this.repo.unregister(token); }
}
