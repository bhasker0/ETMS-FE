'use client';

import React, { useState } from 'react';
import { Mic, Sparkles, RefreshCw } from 'lucide-react';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface SpeechDataEntryButtonProps {
  formType: 'challan' | 'karigar' | 'party' | 'expense' | 'uchapat';
  onDataExtracted: (fields: Record<string, unknown>) => void;
  className?: string;
}

export function SpeechDataEntryButton({
  formType,
  onDataExtracted,
  className = '',
}: SpeechDataEntryButtonProps) {
  const { isEnabled } = useFeatureFlags();
  const { hasCompanyFeature } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isEnabled('feature_speech_data_entry') || !hasCompanyFeature('speech_data_entry')) {
    return null;
  }

  const handleStartVoiceEntry = () => {
    setIsRecording(true);

    // Simulate 2 seconds of speech capture
    setTimeout(() => {
      setIsRecording(false);
      setIsProcessing(true);

      // Simulate Bhashini ASR + Structured Slot Filling
      setTimeout(() => {
        setIsProcessing(false);

        let extractedFields: Record<string, unknown> = {};

        switch (formType) {
          case 'challan':
            extractedFields = {
              partyName: 'Shri Radhe Krishna Textiles',
              lotNumber: 'LOT-9140',
              fabricType: 'Pure Georgette 60g',
              meters: 1850,
              taka: 18,
              sacCode: '9988',
              ratePerThousand: 0.40,
            };
            toast.success('Spoken lot details populated via Bhashini ASR!', {
              description: '1,850m Georgette Lot #9140 for Radhe Krishna Textiles',
            });
            break;

          case 'karigar':
            extractedFields = {
              name: 'Mukesh Bhai Solanki',
              mobile: '+91 98251 44556',
              role: 'Master Operator',
              ratePer1000Stitches: 0.42,
              machineAssignment: 'Machine #02',
            };
            toast.success('Karigar details populated via Bhashini Speech!', {
              description: 'Mukesh Solanki (Master Operator) on Machine #02',
            });
            break;

          case 'expense':
            extractedFields = {
              category: 'DIRECT_OPERATIONAL',
              title: 'Embroidery Machine Lubricant Oil',
              amount: 1450,
              paymentMode: 'UPI',
              remarks: '2x 5L can for Sachin GIDC shift #1',
            };
            toast.success('Expense entry populated via Voice!', {
              description: 'Rs. 1,450 for Machine Lubricant Oil',
            });
            break;

          case 'uchapat':
            extractedFields = {
              karigarName: 'Ramesh Patel',
              amount: 2500,
              mode: 'CASH',
              purpose: 'Weekly family grocery advance',
            };
            toast.success('Uchapat advance populated via Voice!', {
              description: 'Rs. 2,500 Cash advance for Ramesh Patel',
            });
            break;

          case 'party':
            extractedFields = {
              name: 'Surat Silk Prints',
              gstin: '24AAACS9988Z1Z9',
              city: 'Surat',
              contactPerson: 'Kishore Bhai',
              mobile: '+91 98250 88776',
            };
            toast.success('Party profile auto-populated via Bhashini!', {
              description: 'Surat Silk Prints (GSTIN: 24AAACS9988Z1Z9)',
            });
            break;
        }

        onDataExtracted(extractedFields);
      }, 1000);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleStartVoiceEntry}
      disabled={isRecording || isProcessing}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-xl transition-all transform active:scale-95 cursor-pointer shadow-sm ${
        isRecording
          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-rose-500/30 animate-pulse'
          : isProcessing
          ? 'bg-slate-800 text-slate-200 border-white/15'
          : 'bg-slate-900/90 text-slate-100 border-white/15 hover:border-rose-400/50 hover:bg-slate-900'
      } ${className}`}
      title="Speak to Auto-Fill Form Fields (Bhashini Indic ASR)"
    >
      {isRecording ? (
        <>
          <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
          <span>Listening...</span>
        </>
      ) : isProcessing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
          <span>Processing Speech...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Voice Auto-Fill</span>
        </>
      )}
    </button>
  );
}
