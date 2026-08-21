'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Check, X, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { feedback } from '@/lib/audio-haptic';
import { MOCK_MACHINES, MOCK_KARIGARS } from '@/lib/mock-data';

interface ParsedShiftVoiceData {
  rawTranscript: string;
  machineId?: string;
  machineName?: string;
  shiftType?: 'day' | 'night';
  lotNumber?: string;
  meters?: number;
  stitches?: number;
  karigarId?: string;
  karigarName?: string;
}

interface VoiceShiftLoggerProps {
  onApplyParsedData?: (data: ParsedShiftVoiceData) => void;
}

export const VoiceShiftLogger: React.FC<VoiceShiftLoggerProps> = ({ onApplyParsedData }) => {
  const { t, language } = useI18n();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedShiftVoiceData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        // Speech recognition not supported in this browser
      }
    }
  }, []);

  const startListening = () => {
    feedback.playKeyTick();
    feedback.vibrate(50);
    setTranscript('');
    setParsedData(null);
    setIsOpen(true);

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Provide simulated fallback for testing in browsers without Web Speech
      simulateVoiceInput();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      // Select appropriate recognition language
      if (language === 'gu') {
        recognition.lang = 'gu-IN';
      } else if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
        if (event.results[0].isFinal) {
          parseVoiceTranscript(current);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech start error:', e);
      simulateVoiceInput();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  // Heuristic Natural Language Parser for Surat Embroidery Terms
  const parseVoiceTranscript = (text: string) => {
    const lower = text.toLowerCase();
    const result: ParsedShiftVoiceData = { rawTranscript: text };

    // 1. Detect Machine Number (e.g. "મશીન 4", "मशीन 2", "machine 3", "4 નંબર")
    const machineMatch = lower.match(/(?:મશીન|मशीन|machine|નંબર|नंबर)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:મશીન|मशीन|machine)/i);
    if (machineMatch) {
      const mNum = machineMatch[1];
      const foundMachine = MOCK_MACHINES.find(
        (m) => m.name.includes(mNum) || m.nameEn.includes(mNum) || m.id.endsWith(mNum)
      );
      if (foundMachine) {
        result.machineId = foundMachine.id;
        result.machineName = foundMachine.name;
      }
    } else {
      // Default to machine 1 if not parsed
      result.machineId = MOCK_MACHINES[0].id;
      result.machineName = MOCK_MACHINES[0].name;
    }

    // 2. Detect Shift Type (e.g. "નાઇટ", "રાત", "દિવસ", "ડે", "night", "day")
    if (lower.includes('નાઇટ') || lower.includes('રાત') || lower.includes('नाइट') || lower.includes('night')) {
      result.shiftType = 'night';
    } else {
      result.shiftType = 'day';
    }

    // 3. Detect Design / Lot (e.g. "ડિઝાઇન 108", "લૉટ 112", "lot 108", "108 નંબર")
    const lotMatch = lower.match(/(?:ડિઝાઇન|ડિઝાઈન|ડિઝાઇન|डिजाइन|लॉट|lot|design)\s*(\d+)/i);
    if (lotMatch) {
      result.lotNumber = `LOT-${lotMatch[1]}`;
    } else {
      result.lotNumber = 'LOT-108';
    }

    // 4. Detect Meters or Stitches (e.g. "420 મીટર", "500 मीटर", "500000 ટાંકા", "500 meter")
    const meterMatch = lower.match(/(\d+)\s*(?:મીટર|मीटर|meter|mtr)/i);
    if (meterMatch) {
      result.meters = parseInt(meterMatch[1], 10);
      result.stitches = result.meters * 800; // approximate
    } else {
      const stitchMatch = lower.match(/(\d+)\s*(?:ટાંકા|टांके|stitches|ટાંકો)/i);
      if (stitchMatch) {
        result.stitches = parseInt(stitchMatch[1], 10);
        result.meters = Math.round(result.stitches / 800);
      } else {
        result.meters = 480;
        result.stitches = 384000;
      }
    }

    // 5. Detect Karigar Name (e.g. "કારીગર મહેશ", "મહેશભાઈ", "कारीगर दिनेश", "Mahesh")
    for (const k of MOCK_KARIGARS) {
      const firstGu = k.name.split(' ')[0];
      const firstEn = k.nameEn.split(' ')[0].toLowerCase();
      if (text.includes(firstGu) || lower.includes(firstEn)) {
        result.karigarId = k.id;
        result.karigarName = k.name;
        break;
      }
    }

    if (!result.karigarName) {
      result.karigarId = MOCK_KARIGARS[0].id;
      result.karigarName = MOCK_KARIGARS[0].name;
    }

    setParsedData(result);
    feedback.playSuccessChime();
  };

  // Simulated Voice Demo for browsers without Web Speech
  const simulateVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      const sample = 'મશીન ૪, નાઇટ શિફ્ટ, ડિઝાઇન ૧૦૮, ૪૫૦ મીટર, કારીગર મહેશભાઈ પાટીલ';
      setTranscript(sample);
      setIsListening(false);
      parseVoiceTranscript(sample);
    }, 2000);
  };

  const handleApply = () => {
    if (parsedData && onApplyParsedData) {
      feedback.triggerSaveFeedback();
      onApplyParsedData(parsedData);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Microphone Trigger Button */}
      <button
        onClick={startListening}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#0099B8] to-[#0E7090] hover:from-[#0E7090] hover:to-[#0099B8] text-white p-4 rounded-full shadow-2xl border-4 border-white active:scale-95 transition-all flex items-center justify-center group"
        title="બોલીને શિફ્ટ નોંધો (Voice Shift Logger)"
      >
        <div className="relative">
          <Mic className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      </button>

      {/* Voice Logger Modal Sheet */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">{t.voiceLoggerTitle}</h3>
                  <p className="text-2xs text-amber-400">ગુજરાતી / हिंदी / English Voice AI</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Listening Wave Area */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                {isListening && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                    <div className="absolute -inset-3 rounded-full border-2 border-amber-400/40 animate-pulse"></div>
                  </>
                )}
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <Mic className="w-10 h-10" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-200">
                  {isListening ? t.listeningVoice : 'બોલવા માટે માઇક દબાવો'}
                </div>
                <div className="text-xs text-amber-400 font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg inline-block border border-slate-800">
                  {t.voiceHint}
                </div>
              </div>

              {/* Live Transcript Bubble */}
              {transcript && (
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm text-slate-200 text-left font-medium">
                  <span className="text-2xs text-slate-400 block mb-0.5">લાઈવ બોલાયેલ શબ્દો:</span>
                  &ldquo;{transcript}&rdquo;
                </div>
              )}
            </div>

            {/* Parsed Result Card */}
            {parsedData && (
              <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {t.voiceParsedResult}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-900/50">
                    <span className="text-slate-400 block text-2xs">મશીન:</span>
                    <span className="font-bold text-white text-sm">{parsedData.machineName}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-900/50">
                    <span className="text-slate-400 block text-2xs">શિફ્ટ:</span>
                    <span className="font-bold text-amber-400 text-sm">
                      {parsedData.shiftType === 'night' ? '🌙 રાત (Night)' : '☀️ દિવસ (Day)'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-900/50">
                    <span className="text-slate-400 block text-2xs">લોટ / ડિઝાઇન:</span>
                    <span className="font-bold text-white text-sm">{parsedData.lotNumber}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-900/50">
                    <span className="text-slate-400 block text-2xs">ઉત્પાદન મીટર:</span>
                    <span className="font-bold text-emerald-400 text-sm">{parsedData.meters} મીટર</span>
                  </div>

                  <div className="col-span-2 bg-slate-900/90 p-2.5 rounded-xl border border-emerald-900/50">
                    <span className="text-slate-400 block text-2xs">કારીગરનું નામ:</span>
                    <span className="font-bold text-white text-sm">{parsedData.karigarName}</span>
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-base shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {t.confirmAndApply}
                </button>
              </div>
            )}

            {/* Quick Demo Test Buttons */}
            <div className="pt-1 flex justify-between items-center text-xs text-slate-400">
              <span>અથવા નમૂનો ચકાસો:</span>
              <button
                onClick={() => {
                  const sample = 'મશીન ૨, દિવસ શિફ્ટ, ડિઝાઇન ૧૧૨, ૫૨૦ મીટર, કારીગર દિનેશભાઈ ચૌધરી';
                  setTranscript(sample);
                  parseVoiceTranscript(sample);
                }}
                className="text-amber-400 hover:underline font-bold"
              >
                ટેસ્ટ વોઇસ સેમ્પલ ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
