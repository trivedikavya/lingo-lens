import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, RefreshCw, Languages, ArrowRight } from 'lucide-react';

// === CONFIGURATION ===
// NOTE: In a real production app, use the official Lingo.dev SDK.
// For this demo, we mock the translation to show the UI flow immediately.
const mockTranslateWithLingo = async (text, targetLang) => {
  console.log(`Sending to Lingo.dev: ${text} -> ${targetLang}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // This is where you would call: await lingo.translate(text, targetLang)
  return `[${targetLang.toUpperCase()} TRANSLATION]: ${text}`; 
};

function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("Ready");

  // 1. Handle Image Upload
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      setExtractedText(""); 
      setTranslatedText("");
    }
  };

  // 2. The "Magic" Function (OCR + Translate)
  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);

    try {
      // Step A: Extract Text (OCR)
      setProgress("Scanning Image...");
      const worker = await Tesseract.createWorker('eng'); // 'eng' detects English characters better
      const result = await worker.recognize(image);
      const rawText = result.data.text;
      setExtractedText(rawText);
      await worker.terminate();

      // Step B: Translate (Lingo.dev)
      setProgress("Translating with Lingo...");
      const translation = await mockTranslateWithLingo(rawText, "es"); // Hardcoded to Spanish for demo
      setTranslatedText(translation);

    } catch (error) {
      console.error(error);
      setProgress("Error occurred");
    } finally {
      setIsProcessing(false);
      setProgress("Done!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
      
      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-4">
          LingoLens
        </h1>
        <p className="text-slate-400">Snap a photo. Read the world.</p>
      </header>

      {/* Main Card */}
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
        
        {/* Upload Section */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-blue-400 transition cursor-pointer relative bg-slate-800/50">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {!image ? (
            <div className="text-center">
              <Camera className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Drop an image or click to upload</p>
            </div>
          ) : (
            <img src={image} alt="Preview" className="max-h-64 rounded-lg shadow-lg object-contain" />
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-center">
          <button 
            onClick={processImage}
            disabled={!image || isProcessing}
            className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all ${
              !image 
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25"
            }`}
          >
            {isProcessing ? (
              <><RefreshCw className="animate-spin" /> {progress}</>
            ) : (
              <><Languages /> Extract & Translate</>
            )}
          </button>
        </div>

        {/* Results Section (Grid) */}
        {(extractedText || translatedText) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 animate-fade-in-up">
            
            {/* Extracted Text */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Original Text</h3>
              <p className="whitespace-pre-wrap text-slate-300 font-mono text-sm">
                {extractedText || "..."}
              </p>
            </div>

            {/* Translated Text */}
            <div className="bg-slate-900 p-6 rounded-xl border border-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Translated Result
              </h3>
              <p className="whitespace-pre-wrap text-white font-medium text-lg">
                {translatedText || "..."}
              </p>
            </div>

          </div>
        )}

      </div>
      
      {/* Footer */}
      <footer className="mt-12 text-slate-600 text-sm">
        Powered by Tesseract.js & Lingo.dev
      </footer>
    </div>
  );
}

export default App;