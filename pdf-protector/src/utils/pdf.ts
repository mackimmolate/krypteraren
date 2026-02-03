import { PDFDocument, PDFHeader } from 'pdf-lib-plus-encrypt';

function createOwnerPassword(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

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

  // Force upgrade to PDF 1.7 to enable AES-128 encryption (modern standard)
  // The library uses the document header version to determine encryption level.
  pdfDoc.context.header = PDFHeader.forVersion(1, 7);

  // Only require a password to open the PDF.
  // Use a random owner password so permissions cannot be trivially bypassed.
  const ownerPassword = createOwnerPassword();

  pdfDoc.encrypt({
    userPassword: password,
    ownerPassword,
    permissions: {
      printing: 'highResolution',
      modifying: true,
      copying: true,
      annotating: true,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: true,
    },
  });

  // Save the encrypted PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
