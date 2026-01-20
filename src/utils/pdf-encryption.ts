import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

export async function encryptPdfFile(file: File, password: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        if (reader.result instanceof ArrayBuffer) {
          const pdfBytes = new Uint8Array(reader.result);

          // Encrypt the PDF
          // encryptPDF(pdfBytes, userPassword, ownerPassword, permissions)
          // We use the same password for user and owner for simplicity, or just user.
          // Usually owner password allows more permissions.
          const encryptedBytes = await encryptPDF(pdfBytes, password, password);

          const blob = new Blob([encryptedBytes as unknown as BlobPart], { type: 'application/pdf' });
          resolve(blob);
        } else {
          reject(new Error('Failed to read file'));
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsArrayBuffer(file);
  });
}
