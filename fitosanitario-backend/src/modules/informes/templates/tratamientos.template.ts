import { createPdfDoc, addHeader, addFooter, drawTable } from './pdf-helper';

export function generarPdfTratamientos(data: any[], cultivoId?: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPdfDoc();
      const buffers: Buffer[] = [];
      doc.on('data', (c: Buffer) => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const subtitle = cultivoId
        ? `Filtrado por cultivo ID: ${cultivoId}`
        : 'Todos los tratamientos oficiales';
      addHeader(doc, 'Tratamientos Oficiales', subtitle);

      const rows = data.map((t: any) => [
        t.cultivo?.nombre || '—',
        t.plaga?.nombre || '—',
        t.producto?.nombreComercial || '—',
        `${t.dosis} ${t.unidadDosis}`,
        t.metodoAplicacion || '—',
        t.moderador?.nombre || '—',
        t.fechaValidacion
          ? new Date(t.fechaValidacion).toLocaleDateString('es-EC')
          : '—',
      ]);

      drawTable(doc, [
        { header: 'Cultivo', width: 16, align: 'left' },
        { header: 'Plaga', width: 16, align: 'left' },
        { header: 'Producto', width: 18, align: 'left' },
        { header: 'Dosis', width: 12, align: 'center' },
        { header: 'Método', width: 14, align: 'center' },
        { header: 'Moderador', width: 14, align: 'left' },
        { header: 'Fecha', width: 10, align: 'center' },
      ], rows);

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
