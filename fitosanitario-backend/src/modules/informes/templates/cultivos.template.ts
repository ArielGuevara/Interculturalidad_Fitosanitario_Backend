import { createPdfDoc, addHeader, addFooter, drawTable } from './pdf-helper';

export function generarPdfCultivos(data: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPdfDoc();
      const buffers: Buffer[] = [];
      doc.on('data', (c: Buffer) => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      addHeader(doc, 'Catálogo de Cultivos', 'Listado completo de cultivos registrados');

      const rows = data.map((c: any) => [
        c.nombre || '—',
        c.descripcion || '—',
      ]);

      drawTable(doc, [
        { header: 'Nombre', width: 30, align: 'left' },
        { header: 'Descripción', width: 70, align: 'left' },
      ], rows);

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
