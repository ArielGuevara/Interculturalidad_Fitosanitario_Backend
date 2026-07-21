import { createPdfDoc, addHeader, addFooter, drawTable } from './pdf-helper';

const nombresTipo: Record<string, string> = {
  INSECTICIDA: 'Insecticida',
  FUNGICIDA: 'Fungicida',
  HERBICIDA: 'Herbicida',
  BIOLOGICO: 'Biológico',
};

export function generarPdfProductos(data: any[], tipoProducto?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createPdfDoc();
      const buffers: Buffer[] = [];
      doc.on('data', (c: Buffer) => buffers.push(c));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const subtitle = tipoProducto
        ? `Filtrado por tipo: ${nombresTipo[tipoProducto] || tipoProducto}`
        : 'Todos los productos fitosanitarios';
      addHeader(doc, 'Productos Fitosanitarios', subtitle);

      const rows = data.map((p: any) => [
        p.nombreComercial || '—',
        p.ingredienteActivo || '—',
        nombresTipo[p.tipo] || p.tipo || '—',
        p.unidadBase || '—',
      ]);

      drawTable(doc, [
        { header: 'Nombre Comercial', width: 30, align: 'left' },
        { header: 'Ingrediente Activo', width: 30, align: 'left' },
        { header: 'Tipo', width: 20, align: 'center' },
        { header: 'Unidad Base', width: 20, align: 'center' },
      ], rows);

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
