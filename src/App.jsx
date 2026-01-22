import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, RefreshCw, Languages, ArrowRight, Globe, FileText } from 'lucide-react';

function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("Ready");
  
  // 1. NEW: Source Language (For OCR) & Target Language (For Translation)
  const [sourceLang, setSourceLang] = useState("jpn"); // Default to Japanese OCR
  const [targetLang, setTargetLang] = useState("en");  // Default to English Translation

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      setExtractedText(""); 
      setTranslatedText("");
      setProgress("Ready");
    }
  };

  const translateWithRealApi = async (text, target) => {
    const apiKey = import.meta.env.VITE_LINGO_API_KEY;

    if (!apiKey) return "Error: Missing API Key in .env";

    try {
      // ⚠️ CRITICAL FIX: Check your Lingo.dev Dashboard for the EXACT URL.
      // It is often just '/translate' or a specific version. 
      // Replace this URL with the one found in your docs.
      const response = await fetch('https://api.lingo.dev/translate', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text: text,
          target_language: target 
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} (Check Endpoint URL)`);
      }

      const data = await response.json();
      return data.translation || data.result; 

    } catch (error) {
      console.error(error);
      return `Translation Failed: ${error.message}`;
    }
  };

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);

    try {
      // PHASE 1: OCR (The "Eyes")
      // We pass 'sourceLang' here so Tesseract loads the right brain (e.g., Japanese)
      setProgress(`Loading OCR Model (${sourceLang})...`);
      const worker = await Tesseract.createWorker(sourceLang); 
      
      setProgress("Reading Text...");
      const result = await worker.recognize(image);
      const rawText = result.data.text;
      await worker.terminate();

      if (!rawText.trim()) throw new Error("No text found. Try a clearer image.");
      setExtractedText(rawText);

      // PHASE 2: TRANSLATE (The "Brain")
      setProgress(`Translating to ${targetLang.toUpperCase()}...`);
      const translation = await translateWithRealApi(rawText, targetLang);
      setTranslatedText(translation);

    } catch (error) {
      setExtractedText("Error processing image.");
      setTranslatedText(error.message);
    } finally {
      setIsProcessing(false);
      setProgress("Done!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">
          LingoLens
        </h1>
        <p className="text-slate-400">OCR & Translation Engine</p>
      </header>

      <div className="w-full max-w-4xl bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
        
        {/* === CONTROLS === */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
            {/* 1. Document Language (Source) */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Document Language
                </label>
                <select 
                    value={sourceLang} 
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="bg-slate-900 text-white p-3 rounded-lg border border-slate-600 focus:border-cyan-400 outline-none"
                >
                    <option value="eng">English Document</option>
                    <option value="jpn">Japanese (日本語)</option>
                    <option value="chi_sim">Chinese (Simplified)</option>
                    <option value="fra">French</option>
                    <option value="spa">Spanish</option>
                    <option value="hin">Hindi</option>
                </select>
            </div>

            <ArrowRight className="hidden md:block w-6 h-6 self-center text-slate-600" />

            {/* 2. Target Language */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Translate To
                </label>
                <select 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-slate-900 text-white p-3 rounded-lg border border-slate-600 focus:border-cyan-400 outline-none"
                >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="ja">Japanese</option>
                    <option value="hi">Hindi</option>
                </select>
            </div>
        </div>

        {/* Upload Zone */}
        <div className="group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-2xl p-10 hover:border-cyan-400 hover:bg-slate-700/30 transition-all cursor-pointer">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          {!image ? (
            <div className="text-center space-y-4">
              <Camera className="w-12 h-12 text-cyan-400 mx-auto" />
              <p className="text-lg font-medium text-slate-300">Drop your receipt/image here</p>
            </div>
          ) : (
            <img src={image} alt="Preview" className="max-h-64 rounded-lg shadow-lg" />
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={processImage}
            disabled={!image || isProcessing}
            className={`
              flex items-center gap-3 px-8 py-3 rounded-full font-bold text-lg shadow-xl transition-all
              ${!image ? "bg-slate-700 text-slate-500" : "bg-cyan-600 hover:bg-cyan-500 text-white"}
            `}
          >
            {isProcessing ? <RefreshCw className="animate-spin" /> : <Languages />}
            {isProcessing ? progress : "Extract & Translate"}
          </button>
        </div>

        {/* Results */}
        {(extractedText || translatedText) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Original Text (OCR)</h3>
              <p className="whitespace-pre-wrap text-slate-300 font-mono text-sm">{extractedText}</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-cyan-500/30">
              <h3 className="text-xs font-bold text-cyan-400 uppercase mb-4">Translation</h3>
              <p className="whitespace-pre-wrap text-white font-medium text-lg">
                {translatedText || "Waiting for translation..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;