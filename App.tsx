
import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Info, 
  Ruler, 
  ShieldCheck, 
  RefreshCcw, 
  ChevronRight,
  Target,
  FileText,
  AlertTriangle,
  Wand2,
  Newspaper,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { ReferenceType, HeightEstimationResult, UserInput } from './types';
import { analyzeHeight, editImage, fetchLatestNews } from './services/geminiService';
import LandmarkOverlay from './components/LandmarkOverlay';

const App: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'config' | 'loading' | 'results'>('upload');
  const [input, setInput] = useState<UserInput>({
    image: '',
    wearingShoes: false,
    postureConfirmed: false,
    referenceType: ReferenceType.NONE,
  });
  const [result, setResult] = useState<HeightEstimationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [news, setNews] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInput(prev => ({ ...prev, image: event.target?.result as string }));
        setStep('config');
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!input.image) return;
    setStep('loading');
    setError(null);
    try {
      const analysisResult = await analyzeHeight(
        input.image, 
        input.referenceType, 
        input.wearingShoes
      );
      setResult(analysisResult);
      setStep('results');
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Ensure you've uploaded a clear full-body image and try again.");
      setStep('config');
    }
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    try {
      const editedBase64 = await editImage(input.image, editPrompt);
      setInput(prev => ({ ...prev, image: editedBase64 }));
      setEditPrompt('');
    } catch (err) {
      console.error(err);
      alert("Failed to edit image.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleFetchNews = async () => {
    setIsFetchingNews(true);
    try {
      const newsData = await fetchLatestNews();
      setNews(newsData);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch news.");
    } finally {
      setIsFetchingNews(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setInput({
      image: '',
      wearingShoes: false,
      postureConfirmed: false,
      referenceType: ReferenceType.NONE,
    });
    setResult(null);
    setError(null);
    setNews(null);
  };

  const cmToFtIn = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center pb-12 bg-slate-50">
      {/* Header */}
      <header className="w-full bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Ruler className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">StatureAI</h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-400 text-sm font-medium">
            <span className={step === 'upload' ? 'text-blue-600 font-bold' : ''}>Upload</span>
            <ChevronRight className="w-4 h-4" />
            <span className={step === 'config' ? 'text-blue-600 font-bold' : ''}>Configure</span>
            <ChevronRight className="w-4 h-4" />
            <span className={step === 'results' ? 'text-blue-600 font-bold' : ''}>Result</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full px-4 mt-8 flex-1">
        {step === 'upload' && (
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Scientific Height Estimation</h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Upload a full-body photo to calculate stature using anthropometric ratios and skeletal landmark detection powered by Gemini.
            </p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group shadow-sm"
            >
              <div className="bg-slate-100 p-6 rounded-full group-hover:bg-blue-100 transition-colors">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-600" />
              </div>
              <div className="text-slate-600">
                <span className="font-bold text-slate-900">Click to upload</span> or drag and drop
                <p className="text-sm mt-1">Full body standing photo (JPG, PNG)</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
              {[
                { icon: Target, title: "Precision Landmarks", desc: "Detects vertex, acromion, and malleolus points." },
                { icon: ShieldCheck, title: "Privacy First", desc: "Images are processed and never stored permanently." },
                { icon: FileText, title: "Statistical Ratios", desc: "Calculates stature based on known human averages." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <item.icon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'config' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 h-fit">
              <img src={input.image} alt="Preview" className="w-full h-auto rounded-xl" />
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" /> 
                Configuration
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Footwear Status</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setInput(p => ({ ...p, wearingShoes: false }))}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${!input.wearingShoes ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Barefoot
                    </button>
                    <button 
                      onClick={() => setInput(p => ({ ...p, wearingShoes: true }))}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${input.wearingShoes ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Wearing Shoes
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reference Object (Recommended)</label>
                  <select 
                    value={input.referenceType}
                    onChange={(e) => setInput(p => ({ ...p, referenceType: e.target.value as ReferenceType }))}
                    className="w-full p-3 bg-slate-100 border-none rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={ReferenceType.NONE}>None (Statistical Average)</option>
                    <option value={ReferenceType.DOOR}>Standard Door Frame (203cm)</option>
                    <option value={ReferenceType.A4_PAPER}>A4 Paper (29.7cm)</option>
                    <option value={ReferenceType.CREDIT_CARD}>ID/Credit Card (8.56cm)</option>
                    <option value={ReferenceType.SODA_CAN}>Standard Soda Can (12.2cm)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">A reference object in frame significantly improves absolute accuracy.</p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <input 
                    type="checkbox" 
                    id="posture" 
                    className="mt-1 w-4 h-4 text-blue-600 rounded" 
                    checked={input.postureConfirmed}
                    onChange={(e) => setInput(p => ({ ...p, postureConfirmed: e.target.checked }))}
                  />
                  <label htmlFor="posture" className="text-sm text-amber-900 leading-tight">
                    I confirm I am standing upright, looking forward, and my feet are fully visible in the frame.
                  </label>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button 
                  onClick={startAnalysis}
                  disabled={!input.postureConfirmed}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Analyze Stature
                </button>
                <button 
                  onClick={reset}
                  className="w-full text-sm font-medium text-slate-400 hover:text-slate-600 py-2"
                >
                  Change Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Anthropometry...</h2>
            <div className="space-y-1 text-slate-500 max-w-sm mx-auto">
              <p>Identifying vertex and malleolus points</p>
              <p>Calibrating pixel-to-stature ratio</p>
              <p>Applying perspective correction</p>
            </div>
          </div>
        )}

        {step === 'results' && result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Image & Editing */}
              <div className="lg:col-span-7 space-y-6">
                <LandmarkOverlay image={input.image} landmarks={result.landmarks} />
                
                {/* AI Image Editing Panel */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900">AI Image Studio</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Use text prompts to edit your photo (e.g., "Add a retro filter", "Change the background color").</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Enter edit prompt..."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      disabled={isEditing}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
                    />
                    <button 
                      onClick={handleEditImage}
                      disabled={isEditing || !editPrompt}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {isEditing ? 'Editing...' : 'Apply Edit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Data & News */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Stature Estimate</div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-black text-slate-900">{result.estimatedHeightCm.toFixed(1)}</span>
                    <span className="text-xl font-bold text-slate-500">cm</span>
                  </div>
                  <div className="text-xl font-medium text-blue-600 mb-4">{cmToFtIn(result.estimatedHeightCm)}</div>
                  
                  <div className="flex items-center gap-2 py-3 border-t border-b border-slate-50 mb-4">
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Confidence Interval</div>
                      <div className="text-sm font-medium text-slate-700">± {((result.confidenceRangeCm[1] - result.confidenceRangeCm[0]) / 2).toFixed(1)} cm</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Range</div>
                      <div className="text-sm font-medium text-slate-700">{result.confidenceRangeCm[0].toFixed(1)} - {result.confidenceRangeCm[1].toFixed(1)} cm</div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl mb-4">
                    <h4 className="text-xs font-bold text-blue-700 mb-2 uppercase flex items-center gap-1">
                      <Target className="w-3 h-3" /> Technical Insights
                    </h4>
                    <p className="text-xs text-blue-900 leading-relaxed mb-3">
                      {result.analysis}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[9px] text-blue-600 font-bold uppercase">Head Ratio</div>
                        <div className="text-xs font-mono font-bold text-blue-900">1 : {result.ratios?.headToBody.toFixed(2) || '7.50'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-blue-600 font-bold uppercase">Leg Ratio</div>
                        <div className="text-xs font-mono font-bold text-blue-900">{result.ratios?.legToTorso.toFixed(2) || '1.1'} : 1</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={reset}
                    className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" /> New Measurement
                  </button>
                </div>

                {/* News & Industry Updates */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <Newspaper className="w-5 h-5 text-indigo-600" />
                      <span>Industry Insights</span>
                    </div>
                    <button 
                      onClick={handleFetchNews}
                      disabled={isFetchingNews}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                    >
                      {isFetchingNews ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                      Fetch Latest News
                    </button>
                  </div>

                  {isFetchingNews && (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-indigo-200 animate-spin" />
                      <p className="text-xs text-slate-400">Grounding results with Google Search...</p>
                    </div>
                  )}

                  {news ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {news.text}
                      </div>
                      <div className="space-y-2 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sources & Links</p>
                        {news.sources.slice(0, 3).map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 group transition-all"
                          >
                            <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">{source.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : !isFetchingNews && (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">Click to fetch the latest scientific news about body metrics.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-6xl px-4 mt-20 pb-12 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} StatureAI Labs. Powered by Google Gemini.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#" className="hover:text-slate-600 underline">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 underline">Scientific Methodology</a>
          <a href="#" className="hover:text-slate-600 underline">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
