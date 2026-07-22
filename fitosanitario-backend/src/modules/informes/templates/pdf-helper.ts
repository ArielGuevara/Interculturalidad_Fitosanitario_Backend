import PDFDocument from 'pdfkit';

export interface Column {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export function createPdfDoc() {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  return doc;
}

type PdfDocument = ReturnType<typeof createPdfDoc>;

export function addHeader(doc: PdfDocument, title: string, subtitle?: string) {
  doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
  if (subtitle) {
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(subtitle, { align: 'center' });
  }
  doc.fillColor('#000');
  doc.moveDown(1.5);
}

export function addFooter(doc: PdfDocument) {
  const pages = doc.bufferedPageRange();
  const dateStr = new Date().toLocaleDateString('es-EC', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).font('Helvetica').fillColor('#999');
    doc.text(
      `Generado el ${dateStr} — Página ${i + 1} de ${pages.count}`,
      50, doc.page.height - 40,
      { align: 'center', width: doc.page.width - 100, lineBreak: false }
    );
    doc.fillColor('#000');
  }
}

const BOTTOM_MARGIN = 80;
const MARGIN = 50;

export function drawTable(
  doc: PdfDocument,
  columns: Column[],
  rows: string[][],
  startY?: number,
): number {
  const pageWidth = doc.page.width - MARGIN * 2;
  const rowHeight = 20;
  const headerHeight = 22;
  let y = startY ?? doc.y;
  let currentPage = doc.bufferedPageRange().count - 1;
  if (currentPage < 0) currentPage = 0;

  const colWidths = columns.map(c => {
    if (c.width) return (c.width / 100) * pageWidth;
    return pageWidth / columns.length;
  });

  const drawHeader = () => {
    doc.rect(MARGIN, y, pageWidth, headerHeight).fill('#256029');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
    let x = MARGIN;
    columns.forEach((col, i) => {
      doc.text(col.header, x + 4, y + 6, {
        width: colWidths[i] - 8,
        align: col.align || 'left',
      });
      x += colWidths[i];
    });
    y += headerHeight;
  };

  const fitsOnPage = (height: number) => y + height <= doc.page.height - BOTTOM_MARGIN;
  const ensureRoom = (height: number) => {
    if (!fitsOnPage(height)) {
      doc.addPage();
      y = MARGIN;
      drawHeader();
    }
  };

  drawHeader();

  rows.forEach((row, i) => {
    ensureRoom(rowHeight);
    doc.rect(MARGIN, y, pageWidth, rowHeight).fill(i % 2 === 0 ? '#f5f5f5' : '#fff');
    doc.font('Helvetica').fontSize(8).fillColor('#333');
    let x = MARGIN;
    columns.forEach((col, ci) => {
      doc.text(row[ci] || '—', x + 4, y + 6, {
        width: colWidths[ci] - 8,
        align: col.align || 'left',
        ellipsis: true,
      });
      x += colWidths[ci];
    });
    doc.rect(MARGIN, y, pageWidth, rowHeight).stroke('#ddd');
    y += rowHeight;
  });

  if (doc.y > doc.page.height - BOTTOM_MARGIN) {
    doc.y = y;
  } else {
    doc.y = y + 10;
  }
  return y;
}
