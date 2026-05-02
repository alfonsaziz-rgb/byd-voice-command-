/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Fragment } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  History, 
  Car, 
  ChevronRight,
  Wind,
  Sun,
  ShieldCheck,
  AlertCircle,
  Copy,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COMMAND_DATABASE, CommandMapping } from './constants';
import { processVoiceCommand } from './services/geminiService';

interface ActionLog {
  id: string;
  timestamp: Date;
  input: string;
  command: CommandMapping | null;
  language: string;
  certainty: boolean;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentResult, setCurrentResult] = useState<CommandMapping | null>(null);
  const [history, setHistory] = useState<ActionLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'ar-SA' | 'en-US'>('ar-SA');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initial check for Speech Recognition availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('المتصفح لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge.');
    }
  }, []);

  useEffect(() => {
    if (!isRecording) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      // If recognition is already active, stop it before switching language
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = selectedLang; 

      let silenceTimer: any;

      recognitionRef.current.onresult = (event: any) => {
        const results = event.results;
        const lastResult = results[results.length - 1];
        const currentTranscript = lastResult[0].transcript;
        
        setTranscript(currentTranscript);

        if (lastResult.isFinal) {
          clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            handleProcess(currentTranscript);
          }, 300); 
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.log("Auto-restarting listener...");
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.');
          setIsRecording(false);
        } else if (event.error === 'network') {
          setError('خطأ في الاتصال بالشبكة.');
        }
      };

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isRecording, selectedLang]);

  const switchLanguage = (lang: 'ar-SA' | 'en-US') => {
    setSelectedLang(lang);
    setTranscript('');
    setCurrentResult(null);
  };

  const startSystem = () => {
    setIsRecording(true);
    setError(null);
    // Dummy speak to unlock audio context in some browsers
    const u = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(u);
  };

  const handleProcess = async (textOverride?: string) => {
    const input = textOverride || transcript;
    if (!input || input.trim().length < 2) return;

    // Normalization helper for more robust matching
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىي]/g, 'ي') // Normalize Yaa/Alif Maqsura
        .replace(/[^\w\s\u0621-\u064A]/g, ''); // Remove punctuation
    };

    const normalizedInput = normalizeText(input);

    // Fast Local Match for maximum speed
    const localMatch = COMMAND_DATABASE.find(cmd => 
      cmd.keywords.some(k => normalizedInput.includes(normalizeText(k)))
    );

    if (localMatch) {
      const result: ActionLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        input,
        command: localMatch,
        language: selectedLang,
        certainty: true
      };
      
      setCurrentResult(localMatch);
      setHistory(prev => [result, ...prev].slice(0, 10));
      speakChinese(localMatch.chinese);
      setTranscript('');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processVoiceCommand(input);
      setCurrentResult(result.mapping);
      
      const newLog: ActionLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        input,
        command: result.mapping,
        language: result.detectedLanguage,
        certainty: result.isCertain
      };
      
      setHistory(prev => [newLog, ...prev].slice(0, 5));
      
      if (result.mapping && result.isCertain) {
        speakChinese(result.mapping.chinese);
      }
      
      if (!result.isCertain) {
        setError('الأمر غير واضح تماماً. تم تقريب المعنى.');
      }
    } catch (err) {
      setError('فشل في معالجة الأمر.');
    } finally {
      setIsProcessing(false);
      // Clear current transcript after a while to be ready for next command
      setTimeout(() => setTranscript(''), 3000);
    }
  };

  const speakChinese = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Try to find a Chinese voice explicitly
    const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN') || v.name.includes('Chinese'));
    if (zhVoice) utterance.voice = zhVoice;
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9; // Slightly slower for car clarity
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#0057FF]/30">
      {/* Sidebar / Top Nav Overlay */}
      <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0057FF] rounded-lg flex items-center justify-center">
            <Car size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">BYD Voice Command</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Voice Assistant v2025</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex bg-white/5 p-0.5 rounded-full border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => switchLanguage('ar-SA')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${selectedLang === 'ar-SA' ? 'bg-[#0057FF] text-white shadow-[0_0_15px_rgba(0,87,255,0.4)]' : 'text-white/40 hover:text-white/60'}`}
            >
              العربية
            </button>
            <button 
              onClick={() => switchLanguage('en-US')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 ${selectedLang === 'en-US' ? 'bg-[#0057FF] text-white shadow-[0_0_15px_rgba(0,87,255,0.4)]' : 'text-white/40 hover:text-white/60'}`}
            >
              ENGLISH
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 pt-32 pb-12 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        {!isRecording ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-8 text-center"
          >
            <div className="w-24 h-24 bg-[#0057FF]/20 rounded-full flex items-center justify-center border border-[#0057FF]/30">
              <Mic size={48} className="text-[#0057FF] animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">تفعيل النظام التلقائي</h2>
              <p className="text-white/40 text-sm max-w-xs">
                لتفعيل المساعد الصوتي التلقائي 2025، يرجى النقر على الزر أدناه للسماح للمتصفح بالاستماع والرد.
              </p>
            </div>
            <button 
              onClick={startSystem}
              className="px-10 py-4 bg-[#0057FF] hover:bg-[#0047D1] rounded-full font-bold text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              تشغيل النظام آلياً
            </button>
          </motion.div>
        ) : (
          <Fragment>
            {/* Visualizer - Always Active */}
            <div className="relative w-full max-w-md flex flex-col items-center gap-12">
          
          <div className="relative flex items-center justify-center">
            {/* Ambient Pulse */}
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"
            />
            
            {/* Always Listening Visualizer */}
            <div className="relative w-48 h-48 rounded-full bg-zinc-900/50 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="flex gap-1.5 items-end h-20">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isProcessing ? [4, 40, 4] : [8, 48, 8],
                      opacity: isProcessing ? [0.3, 0.6, 0.3] : 1
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: isProcessing ? 0.3 : 0.8, 
                      delay: i * 0.05 
                    }}
                    className={`w-1.5 rounded-full ${isProcessing ? 'bg-amber-400' : 'bg-[#0057FF]'}`}
                  />
                ))}
              </div>
              
              <div className="absolute bottom-6 left-0 w-full text-center">
                <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/30">
                  {isProcessing ? 'Processing' : 'Monitoring'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4 w-full">
            <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[32px] p-8 min-h-[120px] border border-white/10 w-full relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#050505] border border-white/10 rounded-full">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Live Audio Feed</p>
              </div>

              {transcript ? (
                <p className="text-2xl font-semibold text-white leading-tight">
                  <span className="text-blue-500">“</span>
                  {transcript}
                  <span className="text-blue-500">”</span>
                </p>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <p className="text-sm italic">
                    {selectedLang === 'en-US' ? 'System is active. Speak any command...' : 'نظام المساعد الصيني نشط. تحدث الآن...'}
                  </p>
                  <p className="text-[10px] font-medium" dir={selectedLang === 'ar-SA' ? 'rtl' : 'ltr'}>
                    {selectedLang === 'en-US' ? 'Try: "Open Window" or "Full AC"' : 'قل أشياء مثل "افتح الشباك" أو "شغل التكيف"'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Result Area - Now purely informational */}
        <AnimatePresence>
          {currentResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-12 w-full max-w-2xl bg-gradient-to-br from-[#101115] to-[#0A0A0A] rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              <div className="relative flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#0057FF]/20 text-[#0057FF] text-[10px] font-bold rounded-full uppercase tracking-tighter">
                      Executed Command
                    </span>
                    {history[0]?.certainty && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck size={12} />
                        <span className="text-[10px] font-bold uppercase">Verified 100%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <Volume2 size={16} className="animate-pulse" />
                    <span className="text-[10px] font-bold uppercase">Auto-Played</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-6xl font-bold tracking-tight text-white">
                    {currentResult.chinese}
                  </h2>
                  <p className="text-2xl font-medium text-white/40 font-mono tracking-wide">
                    {currentResult.pinyin}
                  </p>
                </div>

                <div className="h-px bg-white/10 w-full my-2" />

                <div className="flex flex-col gap-2">
                  {selectedLang === 'en-US' ? (
                    <div>
                      <p className="text-[10px] text-white/30 uppercase mb-1">Meaning (English)</p>
                      <p className="font-medium text-xl text-blue-400">{currentResult.english}</p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-[10px] text-white/30 uppercase mb-1">الترجمة (العربية)</p>
                      <p className="font-medium text-xl text-blue-400" dir="rtl">{currentResult.arabic || 'أمر تلقائي'}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Action History */}
        {history.length > 0 && (
          <div className="mt-16 w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-6 px-4">
              <History size={16} className="text-white/40" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Recent Activity</h3>
            </div>
            
            <div className="space-y-3">
              {history.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-colors cursor-pointer group"
                  onClick={() => setCurrentResult(item.command)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:scale-110 transition-transform">
                      {item.command?.id === 'ac_on' || item.command?.id === 'ac_off' ? <Wind size={18} /> : 
                       item.command?.id === 'open_sunroof' ? <Sun size={18} /> : <Car size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">"{item.input}"</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">{item.command?.english}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white/60">{item.command?.chinese}</p>
                    <p className="text-[8px] text-white/20">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="mt-8 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-3">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        )}
      </Fragment>
    )}
  </main>

      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/5 blur-[120px] rounded-full" />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}
