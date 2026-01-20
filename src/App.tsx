import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Lock, FileText, Download, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { encryptPdfFile } from './utils/pdf-encryption';

// Types
type AppState = 'idle' | 'selected' | 'processing' | 'completed';

function App() {
  const [state, setState] = useState<AppState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [protectedUrl, setProtectedUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && acceptedFiles[0].type === 'application/pdf') {
      setFile(acceptedFiles[0]);
      setState('selected');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setPassword('');
    if (protectedUrl) {
      URL.revokeObjectURL(protectedUrl);
      setProtectedUrl(null);
    }
  };

  const handleEncrypt = async () => {
    if (!file || !password) return;

    setState('processing');

    try {
      const encryptedBlob = await encryptPdfFile(file, password);
      const url = URL.createObjectURL(encryptedBlob);
      setProtectedUrl(url);
      setState('completed');
    } catch (error) {
      console.error('Encryption failed:', error);
      alert('Failed to encrypt PDF. Please try a different file.');
      setState('selected');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-indigo-600 p-6 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">PDF Locker</h1>
          <p className="text-indigo-100 text-sm">Secure your documents locally. Private & Fast.</p>
        </div>

        <div className="p-8">

          {/* IDLE STATE: Dropzone */}
          {state === 'idle' && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200
                ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">Drop your PDF here</p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                </div>
              </div>
            </div>
          )}

          {/* SELECTED STATE: File Info & Password */}
          {state === 'selected' && file && (
            <div className="animate-fade-in">
              <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between border border-gray-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={handleReset} className="text-gray-400 hover:text-red-500 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Set a Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleEncrypt}
                  disabled={!password}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Protect PDF
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING STATE */}
          {state === 'processing' && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800">Encrypting PDF...</h3>
              <p className="text-gray-500 text-sm mt-2">This happens locally on your device.</p>
            </div>
          )}

          {/* COMPLETED STATE */}
          {state === 'completed' && (
            <div className="text-center animate-fade-in">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">File Protected!</h2>
              <p className="text-gray-600 mb-8">Your PDF is now encrypted and ready.</p>

              <div className="space-y-3">
                <a
                    href={protectedUrl!}
                    download={`locked-${file?.name || 'document.pdf'}`}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Protected PDF
                </a>
                <button
                  onClick={handleReset}
                  className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Protect Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-gray-400 text-sm">
        Offline Capable • Client-Side Encryption • Zero Data Collection
      </p>
    </div>
  );
}

export default App;
