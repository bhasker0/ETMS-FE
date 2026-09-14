'use client';

import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { useFeatureFlags } from '@/lib/featureFlags';

interface KYCDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: 'karigar' | 'party' | 'driver' | 'staff';
  onVerified?: (data: Record<string, unknown>) => void;
}

export function KYCOnboardingDrawer({
  isOpen,
  onClose,
  entityType = 'karigar',
  onVerified,
}: KYCDrawerProps) {
  const { isEnabled } = useFeatureFlags();

  const [docType, setDocType] = useState<'aadhaar' | 'pan' | 'gst' | 'license'>('aadhaar');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState({
    nameEn: '',
    nameNative: '',
    docNumber: '',
    dobOrRegDate: '',
    address: '',
    verified: false,
  });

  if (!isOpen || !isEnabled('feature_kyc_onboarding')) {
    return null;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      const reader = new FileReader();
      reader.onload = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const simulateBhashiniOcr = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (docType === 'aadhaar') {
        setExtractedData({
          nameEn: 'Ramesh Patel',
          nameNative: 'રમેશ પટેલ',
          docNumber: 'XXXX-XXXX-9142',
          dobOrRegDate: '14/08/1988',
          address: 'Plot 104, Sachin GIDC, Surat, Gujarat - 394230',
          verified: true,
        });
      } else if (docType === 'gst') {
        setExtractedData({
          nameEn: 'Radhe Krishna Embroidery Works',
          nameNative: 'રાધે કૃષ્ણા એમ્બ્રોઈડરી વર્ક્સ',
          docNumber: '24AABCR1234A1Z5',
          dobOrRegDate: '01/07/2017',
          address: 'Road No. 6, Sachin GIDC, Surat, Gujarat - 394230',
          verified: true,
        });
      } else {
        setExtractedData({
          nameEn: 'Suresh Kumar',
          nameNative: 'સુરેશ કુમાર',
          docNumber: 'ABCPS9871F',
          dobOrRegDate: '22/05/1992',
          address: 'Pandesara GIDC, Surat, Gujarat - 394221',
          verified: true,
        });
      }
    }, 900);
  };

  const handleConfirmSave = () => {
    if (onVerified) {
      onVerified({ ...extractedData, docType });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-lg h-full bg-[#FAF9F5] border-l border-[#EAEAEA] shadow-2xl flex flex-col justify-between animate-slide-left">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#EAEAEA] bg-white flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
              <ShieldCheck size={14} className="text-[#111111]" />
              <span>KYC & Document Verification</span>
            </div>
            <p className="text-xs text-[#666666]">
              Indic OCR extraction for {entityType.toUpperCase()} onboarding
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#F0EFEA] text-[#666666] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1.5">
              Select Identity Document
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['aadhaar', 'pan', 'gst', 'license'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setDocType(type);
                    setExtractedData({ nameEn: '', nameNative: '', docNumber: '', dobOrRegDate: '', address: '', verified: false });
                  }}
                  className={`py-2 px-2 text-xs font-medium rounded-md border text-center uppercase transition-all ${
                    docType === type
                      ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                      : 'border-[#EAEAEA] bg-white text-[#555555] hover:border-[#D5D4CE]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border border-dashed border-[#D5D4CE] rounded-lg p-5 bg-white text-center hover:border-[#111111] transition-all relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {docPreview ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={docPreview}
                  alt="Doc preview"
                  className="max-h-36 mx-auto rounded border border-[#EAEAEA] object-contain"
                />
                <p className="text-[11px] text-[#777777]">{docFile?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud size={24} className="mx-auto text-[#777777]" />
                <p className="text-xs font-medium text-[#222222]">
                  Click or drag photo / scan here
                </p>
                <p className="text-[10px] text-[#888888]">Supports JPG, PNG, PDF up to 10MB</p>
              </div>
            )}
          </div>

          {/* Trigger Scan Button */}
          {docPreview && (
            <button
              type="button"
              onClick={simulateBhashiniOcr}
              disabled={isScanning}
              className="w-full py-2.5 px-3 rounded-md bg-[#111111] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#222222] transition-colors disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Running Bhashini Indic OCR...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Extract Details via Bhashini OCR
                </>
              )}
            </button>
          )}

          {/* Extracted Data Card */}
          {extractedData.verified && (
            <div className="p-4 rounded-lg border border-[#EAEAEA] bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
                <span className="text-xs font-semibold text-[#111111]">OCR Extracted Fields</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-[#EBF7EE] text-[#1E7E34]">
                  <CheckCircle2 size={11} /> Auto-Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-[#777777] block">Full Name (English)</label>
                  <input
                    type="text"
                    value={extractedData.nameEn}
                    onChange={(e) => setExtractedData({ ...extractedData, nameEn: e.target.value })}
                    className="w-full mt-0.5 p-1.5 text-xs rounded border border-[#EAEAEA] bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#777777] block">Full Name (Native Script)</label>
                  <input
                    type="text"
                    value={extractedData.nameNative}
                    onChange={(e) => setExtractedData({ ...extractedData, nameNative: e.target.value })}
                    className="w-full mt-0.5 p-1.5 text-xs rounded border border-[#EAEAEA] bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#777777] block">Doc Number</label>
                  <input
                    type="text"
                    value={extractedData.docNumber}
                    onChange={(e) => setExtractedData({ ...extractedData, docNumber: e.target.value })}
                    className="w-full mt-0.5 p-1.5 text-xs rounded border border-[#EAEAEA] bg-[#FAF9F5] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#777777] block">DOB / Date</label>
                  <input
                    type="text"
                    value={extractedData.dobOrRegDate}
                    onChange={(e) => setExtractedData({ ...extractedData, dobOrRegDate: e.target.value })}
                    className="w-full mt-0.5 p-1.5 text-xs rounded border border-[#EAEAEA] bg-[#FAF9F5]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-[#777777] block">Address</label>
                  <textarea
                    rows={2}
                    value={extractedData.address}
                    onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })}
                    className="w-full mt-0.5 p-1.5 text-xs rounded border border-[#EAEAEA] bg-[#FAF9F5]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-[#EAEAEA] bg-white flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium rounded-md border border-[#D5D4CE] text-[#444444] hover:bg-[#F2F1ED] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!extractedData.verified}
            onClick={handleConfirmSave}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-[#111111] text-white hover:bg-[#222222] transition-colors disabled:opacity-40"
          >
            Confirm & Link KYC
          </button>
        </div>
      </div>
    </div>
  );
}
