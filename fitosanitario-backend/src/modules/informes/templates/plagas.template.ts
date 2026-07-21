import { createPdfDoc, addHeader, addFooter, drawTable } from './pdf-helper';

export function generarPdfPlagas(data: any[], cultivoId?: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPdfDoc();
      const buffers: Buffer[] = [];
      doc.on('data', (c: Buffer) => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const subtitle = cultivoId
        ? `Filtrado por cultivo ID: ${cultivoId}`
        : 'Listado completo de plagas y enfermedades';
      addHeader(doc, 'Plagas y Enfermedades', subtitle);

      const rows = data.map((p: any) => [
        p.nombre || '—',
        p.tipo || '—',
        p.descripcion || '—',
      ]);

      drawTable(doc, [
        { header: 'Nombre', width: 25, align: 'left' },
        { header: 'Tipo', width: 20, align: 'center' },
        { header: 'Descripción', width: 55, align: 'left' },
      ], rows);

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
