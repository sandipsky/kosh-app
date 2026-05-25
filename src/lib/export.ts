import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type Cell = string | number;

export interface ExportTable {
  /** Sheet name in Excel, also used in the PDF title. */
  name: string;
  /** Header row. */
  columns: string[];
  /** Body rows; each row should be the same length as columns. */
  rows: Cell[][];
  /** Optional footer row (e.g. totals). Same length as columns. */
  footer?: Cell[];
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Save one or more tables as a single .xlsx workbook (one sheet per table). */
export function exportToExcel(baseName: string, tables: ExportTable[]): void {
  const wb = XLSX.utils.book_new();
  for (const t of tables) {
    const aoa: Cell[][] = [t.columns, ...t.rows];
    if (t.footer) aoa.push(t.footer);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Trim sheet names to 31 chars (Excel limit) and strip illegal chars.
    const sheetName = t.name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31) || 'Sheet';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  XLSX.writeFile(wb, `${baseName}-${timestamp()}.xlsx`);
}

/** Save one or more tables as a single .pdf (each table on its own page or stacked). */
export function exportToPdf(
  baseName: string,
  title: string,
  tables: ExportTable[]
): void {
  // Landscape works better for wider tables like the contributions matrix.
  const wideCols = tables.some((t) => t.columns.length > 6);
  const doc = new jsPDF({
    orientation: wideCols ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, 40, 58);
  doc.setTextColor(0);

  let startY = 80;
  tables.forEach((t, idx) => {
    if (idx > 0) {
      doc.setFontSize(12);
      doc.text(t.name, 40, startY);
      startY += 12;
    }
    autoTable(doc, {
      head: [t.columns],
      body: t.rows.map((r) => r.map((c) => String(c))),
      foot: t.footer ? [t.footer.map((c) => String(c))] : undefined,
      startY,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error: lastAutoTable is attached by jspdf-autotable
    startY = (doc.lastAutoTable?.finalY ?? startY) + 24;
  });

  doc.save(`${baseName}-${timestamp()}.pdf`);
}
