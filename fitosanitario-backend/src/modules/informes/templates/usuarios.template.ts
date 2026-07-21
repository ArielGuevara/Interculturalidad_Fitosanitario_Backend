import { createPdfDoc, addHeader, addFooter, drawTable } from './pdf-helper';

export function generarPdfUsuarios(data: any[], rol?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPdfDoc();
      const buffers: Buffer[] = [];
      doc.on('data', (c: Buffer) => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const nombresRol: Record<string, string> = {
        AGRICULTOR: 'Agricultores',
        MODERADOR: 'Moderadores',
        ADMIN: 'Administradores',
      };
      const subtitle = rol
        ? `Usuarios con rol: ${nombresRol[rol] || rol}`
        : 'Todos los usuarios registrados';
      addHeader(doc, 'Usuarios del Sistema', subtitle);

      const rows = data.map((u: any) => [
        u.nombre || '—',
        u.email || '—',
        u.telefono || '—',
        nombresRol[u.rol] || u.rol || '—',
        u.activo ? 'Activo' : 'Inactivo',
        u.fechaRegistro
          ? new Date(u.fechaRegistro).toLocaleDateString('es-EC')
          : '—',
      ]);

      drawTable(doc, [
        { header: 'Nombre', width: 20, align: 'left' },
        { header: 'Email', width: 25, align: 'left' },
        { header: 'Teléfono', width: 15, align: 'left' },
        { header: 'Rol', width: 15, align: 'center' },
        { header: 'Estado', width: 10, align: 'center' },
        { header: 'Registro', width: 15, align: 'center' },
      ], rows);

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
