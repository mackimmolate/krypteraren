import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { protectPdf } from './utils/pdf';
import './App.css';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [protectedPdfUrl, setProtectedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setProtectedPdfUrl(null);
    setPassword('');

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleProtect = async () => {
    if (!file || !password) return;

    setIsProcessing(true);
    setError(null);

    try {
      const protectedBytes = await protectPdf(file, password);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([protectedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setProtectedPdfUrl(url);
    } catch (err) {
      console.error(err);
      setError('Misslyckades med att skydda PDF. Försök igen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (protectedPdfUrl && file) {
      const link = document.createElement('a');
      link.href = protectedPdfUrl;
      const originalName = file.name.replace(/\.pdf$/i, '');
      link.download = `${originalName}_locked.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setProtectedPdfUrl(null);
    setError(null);
  };

  return (
    <div className="container">
      <h1>PDF-skydd</h1>
      <p>Säkra dina PDF-filer med valfritt lösenord.</p>

      <div className="card">
        {!file ? (
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <p>{isDragActive ? 'Släpp PDF-filen här...' : 'Dra och släpp en PDF-fil här, eller klicka för att välja'}</p>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-icon">
              PDF
              {protectedPdfUrl && (
                <div className="lock-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              )}
            </div>
            <p className="file-name">{file.name}</p>

            {!protectedPdfUrl ? (
              <>
                <div className="input-group">
                  <label htmlFor="password">Ange lösenord</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Skriv in lösenord..."
                  />
                </div>

                {error && <p className="error-msg">{error}</p>}

                <div className="actions">
                  <button className="btn-reset" onClick={handleReset}>Avbryt</button>
                  <button
                    className="btn-primary"
                    onClick={handleProtect}
                    disabled={!password || isProcessing}
                  >
                    {isProcessing ? 'Skyddar...' : 'Skydda PDF'}
                  </button>
                </div>
              </>
            ) : (
              <div className="actions">
                <button className="btn-reset" onClick={handleReset}>Börja om</button>
                <button className="btn-primary" onClick={handleDownload}>
                  Ladda ner låst PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
