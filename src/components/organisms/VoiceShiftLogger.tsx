'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Check, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { feedback } from '@/lib/audio-haptic';
import { MOCK_MACHINES, MOCK_KARIGARS } from '@/lib/mock-data';
import { Drawer } from '@/components/ui/drawer';

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
  const { language } = useI18n();
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

    // 5. Detect Karigar Name (e.g. "કારીગર મહેશ", "મહેશભાઈ", "कारीગર દિનેશ", "Mahesh")
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
      {/* Floating Tactical Microphone Trigger */}
      <button
        onClick={startListening}
        className="fixed bottom-6 right-6 z-40 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-main)] px-4 py-3 shadow-lg active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer rounded-full"
        title="Voice Shift Logger"
      >
        <div className="relative">
          <Mic className="w-4 h-4 text-rose-500" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full bg-rose-400 opacity-75 rounded-full"></span>
            <span className="relative inline-flex h-2 w-2 bg-rose-500 rounded-full"></span>
          </span>
        </div>
        <span className="text-xs font-semibold text-[var(--text-main)]">
          Voice Logger
        </span>
      </button>

      {/* Voice Logger Right-Side Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => {
          stopListening();
          setIsOpen(false);
        }}
        title="Voice Shift Logger"
        subtitle="Speech Recognition & NLP Meter Parser"
        icon={<Sparkles className="w-5 h-5 text-[var(--text-main)]" />}
        footer={
          parsedData ? (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="w-1/3 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-muted)] border border-[var(--border)] text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="w-2/3 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer rounded-lg"
              >
                <Check className="w-4 h-4" />
                <span>Apply Parsed Data</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {/* Listening Oscilloscope Waveform Area */}
          <div className="bg-[var(--bg-canvas)] border border-[var(--border)] p-6 text-center space-y-4 rounded-xl">
            <span className="text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">
              Audio Waveform & Sampler
            </span>

            <div className="relative mx-auto w-20 h-20 flex items-center justify-center mt-2">
              {isListening && (
                <>
                  <div className="absolute inset-0 bg-rose-500/20 animate-ping rounded-full"></div>
                  <div className="absolute -inset-2 border border-rose-500/40 animate-pulse rounded-full"></div>
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative z-10 w-16 h-16 flex items-center justify-center transition-transform active:scale-95 cursor-pointer rounded-full shadow-sm ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-bold'
                }`}
              >
                <Mic className="w-7 h-7" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-[var(--text-main)]">
                {isListening ? 'Listening to speech stream...' : 'Microphone standby • Click to record'}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1.5 inline-block border border-[var(--border)] rounded-md">
                Pattern: &ldquo;Machine 4, Night Shift, Design 108, 450 meters, Mahesh&rdquo;
              </div>
            </div>

            {/* Live Transcript Bubble */}
            {transcript && (
              <div className="bg-[var(--bg-surface)] p-3 border border-[var(--border)] text-xs text-[var(--text-main)] text-left rounded-lg">
                <span className="text-[0.6875rem] text-[var(--text-muted)] block mb-1 font-semibold uppercase">
                  Live Transcription:
                </span>
                &ldquo;{transcript}&rdquo;
              </div>
            )}
          </div>

          {/* Parsed Result Card */}
          {parsedData && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Telemetry Parsed Successfully</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[var(--bg-surface-elevated)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block text-[0.6875rem] uppercase font-semibold">Machine</span>
                  <span className="font-bold text-[var(--text-main)] text-xs">{parsedData.machineName}</span>
                </div>

                <div className="bg-[var(--bg-surface-elevated)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block text-[0.6875rem] uppercase font-semibold">Shift</span>
                  <span className="font-bold text-[var(--text-main)] text-xs">
                    {parsedData.shiftType === 'night' ? 'Night Shift' : 'Day Shift'}
                  </span>
                </div>

                <div className="bg-[var(--bg-surface-elevated)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block text-[0.6875rem] uppercase font-semibold">Design / Lot</span>
                  <span className="font-bold text-[var(--text-main)] text-xs">{parsedData.lotNumber}</span>
                </div>

                <div className="bg-[var(--bg-surface-elevated)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block text-[0.6875rem] uppercase font-semibold">Meters Output</span>
                  <span className="font-bold text-[var(--text-main)] text-xs font-mono tabular-nums">{parsedData.meters} Meters</span>
                </div>

                <div className="col-span-2 bg-[var(--bg-surface-elevated)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block text-[0.6875rem] uppercase font-semibold">Operating Karigar</span>
                  <span className="font-bold text-[var(--text-main)] text-xs">{parsedData.karigarName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Demo Test Buttons */}
          <div className="pt-1 flex justify-between items-center text-xs text-[var(--text-muted)]">
            <span>Simulation:</span>
            <button
              type="button"
              onClick={() => {
                const sample = 'મશીન ૨, દિવસ શિફ્ટ, ડિઝાઇન ૧૧૨, ૫૨૦ મીટર, કારીગર દિનેશભાઈ ચૌધરી';
                setTranscript(sample);
                parseVoiceTranscript(sample);
              }}
              className="text-[var(--text-main)] hover:underline font-semibold cursor-pointer text-xs"
            >
              Test Gujarati Speech Sample →
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
};

