import { PDFDocument, PDFHeader } from 'pdf-lib-plus-encrypt';

/**
 * Protects a PDF file with a password.
 * @param file The original PDF file.
 * @param password The password to set for the PDF.
 * @returns A Promise that resolves to the protected PDF bytes.
 */
export async function protectPdf(file: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Encrypt the document
  // We set both the user password (required to open) and owner password (required to change permissions)
  // to the same value, as the requirement implies simple access control.

  // Force upgrade to PDF 1.7 to enable AES-128 encryption (modern standard)
  // The library uses the document header version to determine encryption level.
  pdfDoc.context.header = PDFHeader.forVersion(1, 7);

  pdfDoc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: 'highResolution', // Allow printing
      modifying: false,           // Disallow modification
      copying: true,              // Allow copying text (can be stricter if needed)
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  // Save the encrypted PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
