// TypeScript module augmentation for jsPDF autoTable plugin
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (...args: any[]) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}
