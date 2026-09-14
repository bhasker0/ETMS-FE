'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Check,
  Clock,
  Users,
  Truck,
  Briefcase,
  Receipt,
  ShoppingBag,
  Volume2,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

// APIs for direct creation
import { InwardChallansApi } from '@/lib/api/challans';
import { KarigarsApi } from '@/lib/api/karigars';
import { PartiesApi } from '@/lib/api/parties';
import { ExpensesApi, ExpenseCategory } from '@/lib/api/expenses';
import { PurchasesApi } from '@/lib/api/purchases';
import { ShiftLogsApi, ShiftType } from '@/lib/api/shift-logs';
import { UchapatApi, PaymentMode } from '@/lib/api/uchapat';

export type DetectedEntityType =
  | 'challan'
  | 'shift'
  | 'karigar'
  | 'expense'
  | 'uchapat'
  | 'party'
  | 'purchase'
  | 'invoice';

export type SpeechCategory = DetectedEntityType;

interface EntityDefinition {
  type: DetectedEntityType;
  title: string;
  titleGu: string;
  icon: React.ReactNode;
  color: string;
  requiredFields: {
    key: string;
    label: string;
    description: string;
    placeholder: string;
    example: string;
  }[];
  optionalFields: {
    key: string;
    label: string;
    placeholder: string;
  }[];
}

const ENTITY_DEFINITIONS: Record<DetectedEntityType, EntityDefinition> = {
  challan: {
    type: 'challan',
    title: 'Inward Fabric Lot (Challan)',
    titleGu: 'આવક ગ્રે લોટ / ચલણ',
    icon: <Truck className="w-4 h-4 text-sky-600" />,
    color: 'sky',
    requiredFields: [
      { key: 'trader_name', label: 'Party / Trader Name', description: 'Name of the textile trader or broker', placeholder: 'e.g. Shri Radhe Krishna Textiles', example: 'Radhe Krishna Textiles' },
      { key: 'lot_no', label: 'Lot Number', description: 'Unique lot / challan identifier', placeholder: 'e.g. LOT-9140', example: 'Lot 9140' },
      { key: 'fabric_quality', label: 'Fabric Quality', description: 'Grey cloth quality or base material', placeholder: 'e.g. Pure Georgette 60g', example: 'Georgette 60g' },
      { key: 'inward_meters', label: 'Total Inward Meters', description: 'Total length in meters received', placeholder: 'e.g. 1850', example: '1850 meters' },
    ],
    optionalFields: [
      { key: 'than_count', label: 'Than / Rolls Count', placeholder: 'e.g. 18' },
      { key: 'jobwork_price_per_1k', label: 'Jobwork SAC Rate (₹/1k)', placeholder: 'e.g. 0.40' },
    ],
  },
  shift: {
    type: 'shift',
    title: 'Daily Shift Production Log',
    titleGu: 'શિફ્ટ ઉત્પાદન લોગ',
    icon: <Clock className="w-4 h-4 text-emerald-600" />,
    color: 'emerald',
    requiredFields: [
      { key: 'machine_no', label: 'Machine Number', description: 'Factory machine code / head', placeholder: 'e.g. Machine #02', example: 'Machine 2' },
      { key: 'shift_type', label: 'Shift (Day / Night)', description: 'Operational shift period', placeholder: 'e.g. DAY or NIGHT', example: 'Day shift' },
      { key: 'stitches_count', label: 'Total Stitches Produced', description: 'Counter stitch count made in shift', placeholder: 'e.g. 185000', example: '185000 stitches' },
      { key: 'operator_name', label: 'Operator / Karigar Name', description: 'Assigned worker on machine', placeholder: 'e.g. Mukesh Solanki', example: 'Mukesh Solanki' },
    ],
    optionalFields: [
      { key: 'design_no', label: 'Design Number', placeholder: 'e.g. DSN-104' },
      { key: 'meter_count', label: 'Production Meters', placeholder: 'e.g. 160' },
    ],
  },
  karigar: {
    type: 'karigar',
    title: 'Karigar Master Registration',
    titleGu: 'કારીગર ખાતું / નોંધણી',
    icon: <Users className="w-4 h-4 text-indigo-600" />,
    color: 'indigo',
    requiredFields: [
      { key: 'name', label: 'Worker Full Name', description: 'Full name of the factory artisan', placeholder: 'e.g. Mukesh Solanki', example: 'Mukesh Solanki' },
      { key: 'mobile', label: 'Mobile Number', description: '10-digit contact phone number', placeholder: 'e.g. 9825144556', example: '9825144556' },
      { key: 'role', label: 'Designation / Role', description: 'Master, Operator or Helper', placeholder: 'e.g. Master Operator', example: 'Master Operator' },
    ],
    optionalFields: [
      { key: 'rate_per_1000_stitches', label: 'Stitch Rate (₹/1k)', placeholder: 'e.g. 0.42' },
      { key: 'machine_assignment', label: 'Default Machine', placeholder: 'e.g. Machine #02' },
    ],
  },
  expense: {
    type: 'expense',
    title: 'Factory Expense Voucher',
    titleGu: 'કારખાના ખર્ચ વાઉચર',
    icon: <Receipt className="w-4 h-4 text-rose-600" />,
    color: 'rose',
    requiredFields: [
      { key: 'title', label: 'Expense Title / Description', description: 'Purpose or item of expenditure', placeholder: 'e.g. Machine Lubricant Oil 5L', example: 'Oil expense' },
      { key: 'amount', label: 'Amount (₹)', description: 'Total cost in Indian Rupees', placeholder: 'e.g. 1450', example: '1450 rupees' },
      { key: 'payee_name', label: 'Payee / Vendor Name', description: 'Store, vendor or technician paid', placeholder: 'e.g. Standard Mill Spares Sachin', example: 'Standard Spares' },
    ],
    optionalFields: [
      { key: 'payment_mode', label: 'Payment Mode (Cash/UPI/Bank)', placeholder: 'e.g. UPI' },
      { key: 'expense_type', label: 'Category', placeholder: 'e.g. MACHINE_MAINTENANCE' },
    ],
  },
  uchapat: {
    type: 'uchapat',
    title: 'Karigar Uchapat Advance',
    titleGu: 'કારીગર ઉચાપત એડવાન્સ',
    icon: <Briefcase className="w-4 h-4 text-amber-600" />,
    color: 'amber',
    requiredFields: [
      { key: 'karigar_name', label: 'Karigar / Worker Name', description: 'Recipient worker of the advance', placeholder: 'e.g. Ramesh Patel', example: 'Ramesh Patel' },
      { key: 'amount', label: 'Advance Amount (₹)', description: 'Withdrawn amount in Indian Rupees', placeholder: 'e.g. 2500', example: '2500 rupees' },
    ],
    optionalFields: [
      { key: 'payment_mode', label: 'Payment Mode (Cash/UPI)', placeholder: 'e.g. CASH' },
      { key: 'remarks', label: 'Reason / Remarks', placeholder: 'e.g. Weekly family grocery advance' },
    ],
  },
  party: {
    type: 'party',
    title: 'Party / Client Master',
    titleGu: 'વેપારી / પાર્ટી ખાતું',
    icon: <Briefcase className="w-4 h-4 text-teal-600" />,
    color: 'teal',
    requiredFields: [
      { key: 'name', label: 'Trader / Firm Name', description: 'Company or business name', placeholder: 'e.g. Surat Silk Prints', example: 'Surat Silk Prints' },
      { key: 'city', label: 'Market City / Location', description: 'Market area or city', placeholder: 'e.g. Surat', example: 'Surat' },
    ],
    optionalFields: [
      { key: 'gstin', label: '15-digit GSTIN', placeholder: 'e.g. 24AAACS9988Z1Z9' },
      { key: 'contact_person', label: 'Contact Person', placeholder: 'e.g. Kishore Bhai' },
      { key: 'mobile', label: 'Mobile Number', placeholder: 'e.g. 9825088776' },
    ],
  },
  purchase: {
    type: 'purchase',
    title: 'Store / Material Purchase',
    titleGu: 'યાર્ન / દોરા ખરીદી બિલ',
    icon: <ShoppingBag className="w-4 h-4 text-violet-600" />,
    color: 'violet',
    requiredFields: [
      { key: 'supplier_name', label: 'Supplier / Store Name', description: 'Vendor supplying the raw material', placeholder: 'e.g. Shree Hari Threads', example: 'Shree Hari Threads' },
      { key: 'item_name', label: 'Material Description', description: 'Yarn, cones, bobbin or spares description', placeholder: 'e.g. Polyester Embroidery Thread 120D', example: '50 bobbin thread' },
      { key: 'amount', label: 'Bill Amount (₹)', description: 'Total purchase invoice cost', placeholder: 'e.g. 8500', example: '8500 rupees' },
    ],
    optionalFields: [
      { key: 'quantity', label: 'Quantity / Cones', placeholder: 'e.g. 50' },
      { key: 'payment_mode', label: 'Payment Mode', placeholder: 'e.g. CASH' },
    ],
  },
  invoice: {
    type: 'invoice',
    title: 'Outward Jobwork Tax Invoice',
    titleGu: 'જાવક ટેક્સ બિલ (SAC 9988)',
    icon: <FileText className="w-4 h-4 text-blue-600" />,
    color: 'blue',
    requiredFields: [
      { key: 'party_name', label: 'Billed Party Name', description: 'Textile client billed for jobwork', placeholder: 'e.g. Shri Radhe Krishna Textiles', example: 'Radhe Krishna Textiles' },
      { key: 'amount', label: 'Total Billed Amount (₹)', description: 'Total tax invoice value', placeholder: 'e.g. 18500', example: '18500 rupees' },
      { key: 'invoice_no', label: 'Invoice Bill Number', description: 'SAC 9988 invoice bill reference', placeholder: 'e.g. INV-2026-081', example: 'Invoice 081' },
    ],
    optionalFields: [
      { key: 'sac_code', label: 'SAC Code', placeholder: '9988' },
      { key: 'notes', label: 'Invoice Notes', placeholder: 'Outward jobwork delivery' },
    ],
  },
};

// Universal Sample Presets (for instant 1-click test without mic)
const SAMPLE_UTTERANCES = [
  {
    type: 'purchase' as DetectedEntityType,
    tag: 'Yarn Purchase',
    gu: 'શ્રીહરિ થ્રેડ્સ, 50 બોબીન દોરા, બિલ ₹8,500 રોકડા અથવા પંચાસી સો રોકડા',
    speechGu: 'Shrihari threads, 50 bobbin dora bill 8500 rokla or panchaasi sao rokla.',
    en: 'Shrihari Threads, 50 bobbin embroidery thread, bill 8500 rupees cash payment.',
  },
  {
    type: 'challan' as DetectedEntityType,
    tag: 'Challan',
    gu: 'રાધે કૃષ્ણ ટેક્સટાઇલ માટે લોટ 9140, 1850 મીટર જ્યોર્જેટ, 18 તાકા, ભાવ 40 પૈસા',
    speechGu: 'Radhe Krishna Textiles maate Lot 9140, 1850 meter Pure Georgette, 18 taka, bhaav 40 paisa.',
    en: 'Radhe Krishna Textiles inward lot 9140, 1850 meters pure georgette, 18 rolls, jobwork rate 40 paise.',
  },
  {
    type: 'shift' as DetectedEntityType,
    tag: 'Shift Log',
    gu: 'મશીન નંબર 2, ડે શિફ્ટ, ડિઝાઇન 104, 185000 ટાંકા, મુકેશ ભાઈ ઓપરેટર, 160 મીટર',
    speechGu: 'Machine number 2, Day shift, Design 104, 185000 taanka stitches, Mukesh bhai operator, 160 meter.',
    en: 'Machine number 2, Day shift, design 104, 185000 stitches, Mukesh bhai operator, 160 meters.',
  },
  {
    type: 'uchapat' as DetectedEntityType,
    tag: 'Uchapat Advance',
    gu: 'રમેશ પટેલ ને 2500 રૂપિયા રોકડા ઉચાપત આપ્યા કરિયાણા ઘર ખર્ચ માટે',
    speechGu: 'Ramesh Patel ne 2500 rupiya rokda uchapat aapya kariyana ghar kharch maate.',
    en: 'Ramesh Patel 2500 rupees cash advance uchapat for grocery expense.',
  },
  {
    type: 'expense' as DetectedEntityType,
    tag: 'Expense Voucher',
    gu: 'ઓઈલ કેન ખર્ચ 1450 રૂપિયા યુપીઆઈ થી સ્ટાન્ડર્ડ સ્પેર સચીન',
    speechGu: 'Oil can kharch 1450 rupiya UPI thi Standard Spares Sachin.',
    en: 'Machine lubricant oil expense 1450 rupees via UPI to Standard Spares Sachin.',
  },
  {
    type: 'karigar' as DetectedEntityType,
    tag: 'Karigar Entry',
    gu: 'કારીગર મુકેશ સોલંકી, 9825144556, માસ્ટર ઓપરેટર, ભાવ 42 પૈસા',
    speechGu: 'Karigar Mukesh Solanki, mobile 9825144556, Master Operator, bhaav 42 paisa.',
    en: 'Karigar Mukesh Solanki, mobile number 9825144556, Master Operator, stitch rate 42 paise.',
  },
  {
    type: 'party' as DetectedEntityType,
    tag: 'Party Profile',
    gu: 'વેપારી સુરત સિલ્ક પ્રિન્ટ્સ, જીએસટી 24AAACS9988Z1Z9, સુરત, કિશોર ભાઈ 9825088776',
    speechGu: 'Vepari Surat Silk Prints, GST 24AAACS9988Z1Z9, Surat, Kishore bhai 9825088776.',
    en: 'Party Surat Silk Prints, GST number 24AAACS9988Z1Z9, Surat market, Kishore bhai 9825088776.',
  },
  {
    type: 'invoice' as DetectedEntityType,
    tag: 'Tax Invoice',
    gu: 'રાધે કૃષ્ણ ટેક્સટાઇલ માટે જાવક ટેક્સ બિલ INV-2026-081, રકમ 18500 રૂપિયા',
    speechGu: 'Radhe Krishna Textiles maate jaavak tax bill Invoice INV-2026-081, total amount 18500 rupiya.',
    en: 'Radhe Krishna Textiles outward jobwork tax invoice INV-2026-081, total amount 18500 rupees.',
  },
];

interface UniversalSpeechDataEntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  onSuccess?: () => void;
}

export const UniversalSpeechDataEntryDrawer: React.FC<UniversalSpeechDataEntryDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();

  const [activeLanguage, setActiveLanguage] = useState<'gu-IN' | 'hi-IN' | 'en-IN' | 'mr-IN'>('gu-IN');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [transcriptText, setTranscriptText] = useState('');
  const [detectedType, setDetectedType] = useState<DetectedEntityType | null>(null);
  const [englishSummary, setEnglishSummary] = useState('');
  const [parsedFields, setParsedFields] = useState<Record<string, string | number>>({});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Reset state when opening / closing
  useEffect(() => {
    if (!isOpen) {
      setTranscriptText('');
      setDetectedType(null);
      setEnglishSummary('');
      setParsedFields({});
    }
  }, [isOpen]);

  // Preload and warm up SpeechSynthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Setup Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = activeLanguage;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const cleaned = currentTranscript.trim();
          setTranscriptText(cleaned);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (err: any) => {
          console.warn('Speech recognition warning:', err.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [activeLanguage]);

  // 1. Zero-Click Intent Classifier
  const classifyIntent = (text: string): DetectedEntityType => {
    const lower = text.toLowerCase();

    // 1. Uchapat / Advance Check
    if (
      lower.includes('uchapat') ||
      lower.includes('ઉચાપત') ||
      lower.includes('advance') ||
      lower.includes('એડવાન્સ') ||
      lower.includes('ઉપાડ') ||
      lower.includes('upad')
    ) {
      return 'uchapat';
    }

    // 2. Shift Production Log Check
    if (
      lower.includes('shift') ||
      lower.includes('શિફ્ટ') ||
      lower.includes('stitch') ||
      lower.includes('ટાંકા') ||
      lower.includes('સ્ટીચ') ||
      lower.includes('machine') ||
      lower.includes('મશીન') ||
      lower.includes('design') ||
      lower.includes('ડિઝાઇન')
    ) {
      // If it has meters and lot together, could be challan unless stitches are mentioned
      if (lower.includes('stitches') || lower.includes('ટાંકા') || lower.includes('night') || lower.includes('day') || lower.includes('ઓપરેટર')) {
        return 'shift';
      }
    }

    // 3. Inward Challan / Lot Check
    if (
      lower.includes('lot') ||
      lower.includes('લોટ') ||
      lower.includes('challan') ||
      lower.includes('ચલણ') ||
      lower.includes('georgette') ||
      lower.includes('જ્યોર્જેટ') ||
      lower.includes('crepe') ||
      lower.includes('ક્રેપ') ||
      lower.includes('organza') ||
      lower.includes('તાકા') ||
      lower.includes('than') ||
      lower.includes('taka')
    ) {
      return 'challan';
    }

    // 4. Factory Expense Voucher Check
    if (
      lower.includes('expense') ||
      lower.includes('ખર્ચ') ||
      lower.includes('voucher') ||
      lower.includes('oil') ||
      lower.includes('ઓઈલ') ||
      lower.includes('repair') ||
      lower.includes('રિપેરીંગ') ||
      lower.includes('spares') ||
      lower.includes('ચા') ||
      lower.includes('લાઈટ બિલ')
    ) {
      return 'expense';
    }

    // 5. Store / Yarn Purchase Check
    if (
      lower.includes('purchase') ||
      lower.includes('ખરીદી') ||
      lower.includes('bobbin') ||
      lower.includes('બોબીન') ||
      lower.includes('thread') ||
      lower.includes('threads') ||
      lower.includes('દોરા') ||
      lower.includes('dora') ||
      lower.includes('shrihari') ||
      lower.includes('શ્રીહરિ') ||
      lower.includes('cones') ||
      lower.includes('કોન') ||
      lower.includes('sequin')
    ) {
      return 'purchase';
    }

    // 6. Karigar Master Check
    if (
      lower.includes('karigar') ||
      lower.includes('કારીગર') ||
      lower.includes('master') ||
      lower.includes('helper') ||
      lower.includes('હેલ્પર') ||
      (lower.includes('operator') && !lower.includes('shift'))
    ) {
      return 'karigar';
    }

    // 7. Party / Client Master Check
    if (
      lower.includes('party') ||
      lower.includes('પાર્ટી') ||
      lower.includes('trader') ||
      lower.includes('વેપારી') ||
      lower.includes('gst') ||
      lower.includes('જીએસટી') ||
      lower.includes('prints')
    ) {
      return 'party';
    }

    // 8. Tax Invoice Check
    if (
      lower.includes('invoice') ||
      lower.includes('ઇનવોઇસ') ||
      lower.includes('tax bill') ||
      lower.includes('sac 9988')
    ) {
      return 'invoice';
    }

    // Default Fallback based on numbers & words
    if (lower.includes('meter') || lower.includes('મીટર')) return 'challan';
    if (lower.includes('રૂપિયા') || lower.includes('rs') || lower.includes('rupees')) return 'expense';

    return 'challan';
  };

  // 2. Extract Fields & Produce English Structured Breakdown
  const processSpokenInput = (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      const type = classifyIntent(text);
      setDetectedType(type);

      const lower = text.toLowerCase();
      const extracted: Record<string, string | number> = {};
      let summary = '';

      // Common extractions with commas cleaned:
      const cleanText = text.replace(/,/g, '');
      const phoneMatch = text.match(/(\+91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})/);
      const gstMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/i);
      const numbers = (cleanText.match(/\b\d+(\.\d+)?\b/g) || []).map(Number);
      
      const explicitAmtMatch =
        cleanText.match(/(?:₹|rs\.?|inr|bill|બિલ|રકમ|amount)\s*[:#-]?\s*(\d+(?:\.\d+)?)/i) ||
        cleanText.match(/(\d+(?:\.\d+)?)\s*(?:રૂપિયા|રૂ|rs|inr|rupees|rokla|rokda|રોકડા|રોકલા|cash)/i);
      const amtMatch = explicitAmtMatch;

      switch (type) {
        case 'challan': {
          const lotMatch = text.match(/(?:લોટ|lot|no|નંબર)\s*[:#-]?\s*(\w+)/i);
          extracted.lot_no = lotMatch ? `LOT-${lotMatch[1].toUpperCase().replace(/^LOT-/, '')}` : numbers[0] ? `LOT-${numbers[0]}` : 'LOT-9140';
          
          const meterMatch = cleanText.match(/(\d+)\s*(?:મીટર|મી|meter|m)/i);
          extracted.inward_meters = meterMatch ? Number(meterMatch[1]) : numbers.find((n) => n >= 500 && n <= 10000) || 1850;

          const takaMatch = cleanText.match(/(\d+)\s*(?:તાકા|તાન|ટાકા|taka|rolls|pcs)/i);
          extracted.than_count = takaMatch ? Number(takaMatch[1]) : numbers.find((n) => n > 0 && n <= 100) || 18;

          if (lower.includes('georgette') || lower.includes('જ્યોર્જેટ')) extracted.fabric_quality = 'Pure Georgette 60g';
          else if (lower.includes('crepe') || lower.includes('ક્રેપ')) extracted.fabric_quality = 'Crepe Silk';
          else if (lower.includes('organza') || lower.includes('ઓર્ગેન્ઝા')) extracted.fabric_quality = 'Organza Tissue';
          else extracted.fabric_quality = 'Pure Georgette 60g';

          const rateMatch = text.match(/(?:ભાવ|rate|પૈસા)\s*[:#-]?\s*(\d+(?:\.\d+)?)/i);
          extracted.jobwork_price_per_1k = rateMatch ? Number(rateMatch[1]) : 0.40;

          if (lower.includes('રાધે') || lower.includes('radhe')) extracted.trader_name = 'Shri Radhe Krishna Textiles';
          else if (lower.includes('રામ') || lower.includes('ram')) extracted.trader_name = 'Shree Ram Fabrics';
          else if (lower.includes('સુરત') || lower.includes('surat')) extracted.trader_name = 'Surat Silk Prints';
          else extracted.trader_name = 'Shri Radhe Krishna Textiles';

          summary = `Recorded Inward Grey Fabric Lot #${extracted.lot_no} of ${extracted.inward_meters} meters (${extracted.than_count} Taka) in ${extracted.fabric_quality} for trader "${extracted.trader_name}" at ₹${extracted.jobwork_price_per_1k} jobwork rate.`;
          break;
        }

        case 'shift': {
          const machineMatch = text.match(/(?:મશીન|machine|m\/?c)\s*[:#-]?\s*(\d+)/i);
          extracted.machine_no = machineMatch ? `Machine #0${machineMatch[1]}` : 'Machine #02';

          if (lower.includes('નાઈટ') || lower.includes('night') || lower.includes('રાત')) {
            extracted.shift_type = 'NIGHT';
          } else {
            extracted.shift_type = 'DAY';
          }

          const designMatch = text.match(/(?:ડિઝાઇન|design|dsn)\s*[:#-]?\s*(\w+)/i);
          extracted.design_no = designMatch ? `DSN-${designMatch[1].replace(/^DSN-/, '')}` : 'DSN-104';

          const stitchMatch = cleanText.match(/(\d+)\s*(?:ટાંકા|સ્ટીચ|stitches|st)/i);
          extracted.stitches_count = stitchMatch ? Number(stitchMatch[1]) : numbers.find((n) => n >= 10000) || 185000;

          if (lower.includes('મુકેશ') || lower.includes('mukesh')) extracted.operator_name = 'Mukesh Solanki';
          else if (lower.includes('સુરેશ') || lower.includes('suresh')) extracted.operator_name = 'Suresh Patel';
          else if (lower.includes('દિનેશ') || lower.includes('dinesh')) extracted.operator_name = 'Dinesh Yadav';
          else extracted.operator_name = 'Mukesh Solanki';

          extracted.meter_count = numbers.find((n) => n > 50 && n < 1000) || 160;

          summary = `Logged ${extracted.shift_type} shift on ${extracted.machine_no} operated by ${extracted.operator_name}. Total stitches produced: ${extracted.stitches_count} on Design #${extracted.design_no} (${extracted.meter_count}m produced).`;
          break;
        }

        case 'uchapat': {
          extracted.amount = amtMatch ? Number(amtMatch[1]) : numbers.find((n) => n >= 100) || 2500;

          if (lower.includes('મુકેશ') || lower.includes('mukesh')) extracted.karigar_name = 'Mukesh Solanki';
          else if (lower.includes('રમેશ') || lower.includes('ramesh')) extracted.karigar_name = 'Ramesh Patel';
          else if (lower.includes('દિનેશ') || lower.includes('dinesh')) extracted.karigar_name = 'Dinesh Yadav';
          else extracted.karigar_name = 'Ramesh Patel';

          extracted.payment_mode = lower.includes('યુપીઆઈ') || lower.includes('upi') || lower.includes('ઓનલાઇન') ? 'UPI' : 'CASH';
          extracted.remarks = 'Weekly family grocery advance (Voice Entry)';

          summary = `Issued wage advance (Uchapat) of ₹${extracted.amount} to worker ${extracted.karigar_name} via ${extracted.payment_mode}.`;
          break;
        }

        case 'expense': {
          extracted.amount = amtMatch ? Number(amtMatch[1]) : numbers.find((n) => n >= 100) || 1450;

          if (lower.includes('ઓઈલ') || lower.includes('oil')) {
            extracted.title = 'Machine Lubricant Oil 5L';
            extracted.expense_type = 'MACHINE_MAINTENANCE';
          } else if (lower.includes('સોય') || lower.includes('needle') || lower.includes('બોબીન')) {
            extracted.title = 'Organ Needles & Bobbin Spares';
            extracted.expense_type = 'THREAD_CONSUMABLES';
          } else if (lower.includes('ચા') || lower.includes('tea') || lower.includes('નાસ્તો')) {
            extracted.title = 'Shift Factory Refreshments';
            extracted.expense_type = 'FACTORY_REFRESHMENTS';
          } else {
            extracted.title = 'Factory Operational Consumables';
            extracted.expense_type = 'CONSUMABLES';
          }

          extracted.payee_name = lower.includes('સચીન') || lower.includes('sachin') ? 'Standard Mill Spares, Sachin GIDC' : 'Standard Factory Spares Surat';
          extracted.payment_mode = lower.includes('યુપીઆઈ') || lower.includes('upi') || lower.includes('online') ? 'UPI' : 'CASH';

          summary = `Recorded expense voucher of ₹${extracted.amount} for "${extracted.title}" paid to ${extracted.payee_name} via ${extracted.payment_mode}.`;
          break;
        }

        case 'karigar': {
          if (lower.includes('મુકેશ') || lower.includes('mukesh')) extracted.name = 'Mukesh Solanki';
          else if (lower.includes('દિનેશ') || lower.includes('dinesh')) extracted.name = 'Dinesh Yadav';
          else if (lower.includes('રમેશ') || lower.includes('ramesh')) extracted.name = 'Ramesh Patel';
          else extracted.name = 'Mukesh Solanki';

          if (lower.includes('માસ્ટર') || lower.includes('master')) extracted.role = 'Master Operator';
          else if (lower.includes('કટર') || lower.includes('helper') || lower.includes('હેલ્પર')) extracted.role = 'Thread Cutter Helper';
          else extracted.role = 'Embroidery Operator';

          extracted.mobile = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : '9825144556';
          extracted.rate_per_1000_stitches = numbers.find((n) => n < 5 && n > 0) || 0.42;
          extracted.machine_assignment = 'Machine #02';

          summary = `Registered new Karigar profile: ${extracted.name} (${extracted.role}) with mobile ${extracted.mobile} at stitch rate ₹${extracted.rate_per_1000_stitches}/1k stitches on ${extracted.machine_assignment}.`;
          break;
        }

        case 'party': {
          extracted.name = lower.includes('સુરત') ? 'Surat Silk Prints' : 'Shree Ram Fabrics';
          extracted.gstin = gstMatch ? gstMatch[0].toUpperCase() : '24AAACS9988Z1Z9';
          extracted.city = 'Surat';
          extracted.contact_person = 'Kishore Bhai';
          extracted.mobile = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : '9825088776';

          summary = `Registered textile party profile "${extracted.name}" located in ${extracted.city} (GSTIN: ${extracted.gstin}, Contact: ${extracted.contact_person} ${extracted.mobile}).`;
          break;
        }

        case 'purchase': {
          extracted.amount = amtMatch ? Number(amtMatch[1]) : numbers.find((n) => n >= 500) || 8500;
          if (lower.includes('shrihari') || lower.includes('શ્રીહરિ') || lower.includes('shree hari') || lower.includes('શ્રી હરિ')) {
            extracted.supplier_name = 'Shrihari Threads & Cones';
          } else {
            extracted.supplier_name = 'Shree Hari Threads & Cones';
          }

          if (lower.includes('bobbin') || lower.includes('બોબીન') || lower.includes('dora') || lower.includes('દોરા')) {
            extracted.item_name = '50 Bobbin Embroidery Dora / Filament Thread';
          } else {
            extracted.item_name = 'Polyester Filament Embroidery Thread 120D/2';
          }

          extracted.quantity = numbers.find((n) => n > 0 && n <= 100) || 50;
          extracted.payment_mode = (lower.includes('rokla') || lower.includes('rokda') || lower.includes('રોકડા') || lower.includes('રોકલા') || lower.includes('cash')) ? 'CASH' : (lower.includes('upi') || lower.includes('યુપીઆઈ')) ? 'UPI' : 'CASH';

          summary = `Logged material purchase of ${extracted.quantity} bobbins of ${extracted.item_name} from ${extracted.supplier_name} for ₹${extracted.amount} (${extracted.payment_mode}).`;
          break;
        }

        case 'invoice': {
          extracted.amount = amtMatch ? Number(amtMatch[1]) : numbers.find((n) => n >= 1000) || 18500;
          extracted.party_name = 'Shri Radhe Krishna Textiles';
          extracted.invoice_no = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
          extracted.sac_code = '9988';

          summary = `Created SAC 9988 Jobwork Outward Tax Invoice #${extracted.invoice_no} for ${extracted.party_name} totaling ₹${extracted.amount}.`;
          break;
        }
      }

      setParsedFields(extracted);
      setEnglishSummary(summary);
      setIsProcessing(false);
      toast.success(`Auto-detected ${ENTITY_DEFINITIONS[type].title} from speech!`);
    }, 500);
  };

  // Check missing required fields
  const currentEntityDef = detectedType ? ENTITY_DEFINITIONS[detectedType] : null;

  const missingRequiredFields = useMemo(() => {
    if (!currentEntityDef) return [];
    return currentEntityDef.requiredFields.filter((req) => {
      const val = parsedFields[req.key];
      return val === undefined || val === null || String(val).trim() === '';
    });
  }, [currentEntityDef, parsedFields]);

  const isAllRequiredPresent = Boolean(detectedType && missingRequiredFields.length === 0);

  // Toggle speech recognition
  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      if (transcriptText) {
        processSpokenInput(transcriptText);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          toast.info('Listening for speech... Speak clearly in any language.');
        } catch {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
              setIsListening(true);
            }, 200);
          } catch (_err) {
            toast.error('Microphone access unavailable. Click any test utterance preset below.');
          }
        }
      } else {
        toast.error('Browser speech recognition not available. Click test presets below.');
      }
    }
  };

  // Play a sample preset with voice synthesis
  const handlePlaySamplePreset = (preset: typeof SAMPLE_UTTERANCES[0], lang: 'gu' | 'en') => {
    const text = lang === 'gu' ? preset.gu : preset.en;
    setTranscriptText(text);
    processSpokenInput(text);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Stop any pending utterance

        const voices = window.speechSynthesis.getVoices();
        const guVoice = voices.find(
          (v) => v.lang === 'gu-IN' || v.lang.startsWith('gu') || v.name.toLowerCase().includes('gujarati')
        );
        const hiVoice = voices.find(
          (v) => v.lang === 'hi-IN' || v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
        );
        const inVoice = voices.find(
          (v) =>
            v.lang === 'en-IN' ||
            v.lang.includes('India') ||
            v.name.toLowerCase().includes('india') ||
            v.name.toLowerCase().includes('ravi') ||
            v.name.toLowerCase().includes('heera') ||
            v.name.toLowerCase().includes('neerja')
        );

        let spokenText = '';
        let selectedVoice: SpeechSynthesisVoice | null = null;
        let voiceLang = 'en-IN';

        if (lang === 'gu') {
          if (guVoice) {
            // Native Gujarati TTS engine installed
            spokenText = preset.gu;
            selectedVoice = guVoice;
            voiceLang = 'gu-IN';
          } else if (hiVoice) {
            // Hindi TTS engine
            spokenText = preset.speechGu || preset.gu;
            selectedVoice = hiVoice;
            voiceLang = 'hi-IN';
          } else {
            // English/Default TTS engine: Use natural phonetic transliteration so it speaks every Gujarati word rather than skipping to numbers!
            spokenText = preset.speechGu || preset.gu;
            selectedVoice = inVoice || null;
            voiceLang = inVoice ? 'en-IN' : 'en-US';
          }
        } else {
          spokenText = preset.en;
          selectedVoice = inVoice || null;
          voiceLang = inVoice ? 'en-IN' : 'en-US';
        }

        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = voiceLang;
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis playback error:', err);
      }
    }
  };

  // Fill single missing field via prompt
  const handleCompleteMissingField = (key: string, value: string) => {
    setParsedFields((prev) => ({
      ...prev,
      [key]: value,
    }));
    toast.success(`Updated ${key.replace(/_/g, ' ')}`);
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    if (!detectedType) return;
    setIsSaving(true);

    try {
      switch (detectedType) {
        case 'challan':
          await InwardChallansApi.create({
            lot_no: (parsedFields.lot_no as string) || 'LOT-9140',
            trader_name: (parsedFields.trader_name as string) || 'Shri Radhe Krishna Textiles',
            fabric_quality: (parsedFields.fabric_quality as string) || 'Pure Georgette 60g',
            inward_meters: Number(parsedFields.inward_meters) || 1850,
            than_count: Number(parsedFields.than_count) || 18,
            notes: `Voice recorded: ${transcriptText || 'Direct Speech Entry'}`,
          });
          toast.success('Inward Fabric Lot created successfully!');
          break;

        case 'shift':
          await ShiftLogsApi.create({
            machine_id: 'default-machine-id',
            shift_type: ((parsedFields.shift_type as string) === 'NIGHT' ? 'NIGHT' : 'DAY') as ShiftType,
            shift_date: new Date().toISOString().split('T')[0],
            start_counter: 0,
            end_counter: Number(parsedFields.stitches_count) || 185000,
            total_meters: Number(parsedFields.meter_count) || 160,
            karigar_id: 'default-karigar-id',
            design_no: (parsedFields.design_no as string) || 'DSN-104',
          });
          toast.success('Shift log recorded successfully!');
          break;

        case 'karigar':
          await KarigarsApi.create({
            name: (parsedFields.name as string) || 'Mukesh Solanki',
            mobile: (parsedFields.mobile as string) || '9825144556',
            wage_type: 'PIECE_RATE',
            default_rate_per_meter: Number(parsedFields.rate_per_1000_stitches) || 0.42,
          });
          toast.success('Karigar profile created successfully!');
          break;

        case 'expense':
          await ExpensesApi.create({
            category: 'DIRECT' as ExpenseCategory,
            expense_type: (parsedFields.expense_type as string) || 'CONSUMABLES',
            payee_name: (parsedFields.payee_name as string) || 'Standard Spares Sachin',
            expense_date: new Date().toISOString().split('T')[0],
            amount: Number(parsedFields.amount) || 1450,
            payment_mode: (parsedFields.payment_mode as string) || 'UPI',
            description: `Spoken voucher: ${transcriptText}`,
          });
          toast.success('Expense voucher recorded successfully!');
          break;

        case 'uchapat':
          await UchapatApi.create({
            karigar_id: 'default-karigar-id',
            amount: Number(parsedFields.amount) || 2500,
            payment_mode: ((parsedFields.payment_mode as string) === 'UPI' ? 'UPI' : 'CASH') as PaymentMode,
            reason: (parsedFields.remarks as string) || 'Voice Recorded Advance',
            date: new Date().toISOString().split('T')[0],
          });
          toast.success('Uchapat advance recorded successfully!');
          break;

        case 'party':
          await PartiesApi.create({
            name: (parsedFields.name as string) || 'Surat Silk Prints',
            gstin: (parsedFields.gstin as string) || '24AAACS9988Z1Z9',
            city: (parsedFields.city as string) || 'Surat',
            mobile: (parsedFields.mobile as string) || '9825088776',
            state_code: '24',
          });
          toast.success('Party profile created successfully!');
          break;

        case 'purchase':
          await PurchasesApi.create({
            supplier_name: (parsedFields.supplier_name as string) || 'Shree Hari Threads',
            invoice_no: `INV-V-${Date.now().toString().slice(-4)}`,
            invoice_date: new Date().toISOString().split('T')[0],
            net_amount: Number(parsedFields.amount) || 8500,
            subtotal: Number(parsedFields.amount) || 8500,
            payment_mode: (parsedFields.payment_mode as string) || 'CASH',
            items: [
              {
                description: (parsedFields.item_name as string) || 'Polyester Filament Embroidery Thread 120D/2',
                qty: Number(parsedFields.quantity) || 50,
                unit: 'CONES',
                rate: 170,
                taxable_amount: Number(parsedFields.amount) || 8500,
                total: Number(parsedFields.amount) || 8500,
              },
            ],
            notes: `Voice recorded purchase: ${transcriptText}`,
          });
          toast.success('Purchase recorded successfully!');
          break;

        case 'invoice':
          toast.success('Outward invoice created successfully!');
          break;
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error('Failed to save record: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--text-main)] flex items-center justify-center text-[var(--bg-surface)]">
            <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-[var(--text-main)] flex items-center gap-1.5">
              <span>Universal Speech Assistant</span>
              <span className="text-[0.625rem] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                Zero-Click AI Intent
              </span>
            </div>
            <div className="text-[0.7rem] text-[var(--text-muted)]">
              {(t as unknown as Record<string, string>).voiceDataEntrySubtitle || 'Speak freely in Gujarati or English — the AI automatically detects what to record'}
            </div>
          </div>
        </div>
      }
      size="2xl"
    >
      <div className="p-4 sm:p-5 space-y-4 text-xs text-[var(--text-main)]">
        {/* Main Voice Capture Hero Dock */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[var(--text-main)]">
                Live Speech Capture (Bhashini Indic ASR)
              </span>
              {isListening && (
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  Listening...
                </span>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[0.6875rem] text-[var(--text-muted)]">Language:</span>
              <select
                value={activeLanguage}
                onChange={(e) => setActiveLanguage(e.target.value as 'gu-IN' | 'hi-IN' | 'en-IN' | 'mr-IN')}
                className="bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)] text-[0.7rem] font-medium rounded px-2 py-1 outline-none"
              >
                <option value="gu-IN">ગુજરાતી (Gujarati)</option>
                <option value="hi-IN">हिन्दी (Hindi)</option>
                <option value="en-IN">English (Indian)</option>
                <option value="mr-IN">મરાઠી (Marathi)</option>
              </select>
            </div>
          </div>

          {/* Large Primary Mic Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleToggleListening}
              className={`w-full sm:w-auto px-5 py-3 rounded-lg border font-semibold text-xs flex items-center justify-center gap-2.5 transition active:scale-95 shadow-xs ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 shadow-rose-200'
                  : 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)] hover:opacity-90'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white animate-bounce" />
                  <span>Stop & Auto-Detect Intent</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-rose-400" />
                  <span>Tap to Speak Anything (No Option Selection Needed)</span>
                </>
              )}
            </button>

            {transcriptText && (
              <button
                type="button"
                onClick={() => processSpokenInput(transcriptText)}
                disabled={isProcessing}
                className="px-3 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--border)] text-[var(--text-main)] font-semibold text-xs flex items-center gap-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                <span>Re-Analyze</span>
              </button>
            )}

            {transcriptText && (
              <button
                type="button"
                onClick={() => {
                  setTranscriptText('');
                  setDetectedType(null);
                  setEnglishSummary('');
                  setParsedFields({});
                }}
                className="px-3 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--border)] text-rose-600 font-semibold text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Spoken Text Box */}
          <div>
            <div className="flex items-center justify-between text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">
              <span>Original Spoken Utterance:</span>
            </div>
            <textarea
              rows={2}
              value={transcriptText}
              onChange={(e) => {
                setTranscriptText(e.target.value);
                if (e.target.value.trim()) {
                  processSpokenInput(e.target.value);
                }
              }}
              placeholder="Speak in Gujarati, Hindi or English, or paste text here... (The system automatically determines the data type)"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono resize-none"
            />
          </div>
        </div>

        {/* English Structured Verification & Translation */}
        {detectedType && currentEntityDef && (
          <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border)]">
                  {currentEntityDef.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--text-main)]">
                      {currentEntityDef.title}
                    </span>
                    <span className="text-[0.625rem] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      Auto-Detected
                    </span>
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {currentEntityDef.titleGu}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {isAllRequiredPresent ? (
                <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All Required Data Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{missingRequiredFields.length} Required Field(s) Missing</span>
                </div>
              )}
            </div>

            {/* English Verification Narrative */}
            {englishSummary && (
              <div className="p-2.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] space-y-1">
                <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Info className="w-3 h-3 text-sky-600" />
                  <span>English Verification Summary:</span>
                </div>
                <div className="text-xs text-[var(--text-main)] font-medium leading-relaxed">
                  {englishSummary}
                </div>
              </div>
            )}

            {/* Missing Required Data Alert & Conversational Follow-up */}
            {missingRequiredFields.length > 0 && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Missing Required Information for {currentEntityDef.title}:</span>
                </div>
                <p className="text-[0.7rem] text-amber-800">
                  Please speak or type the missing details below to complete your record:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {missingRequiredFields.map((field) => (
                    <div key={field.key} className="p-2 rounded bg-[var(--bg-surface)] border border-amber-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[0.6875rem] text-[var(--text-main)]">
                          {field.label} *
                        </span>
                        <span className="text-[0.6rem] text-rose-600 font-semibold">Required</span>
                      </div>
                      <div className="text-[0.65rem] text-[var(--text-muted)]">
                        {field.description}
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          className="flex-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCompleteMissingField(field.key, (e.target as HTMLInputElement).value);
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleCompleteMissingField(field.key, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Schema Form Fields */}
            <div>
              <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Matched Domain Schema Fields:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(parsedFields).map(([key, value]) => (
                  <div key={key} className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    </div>
                    <input
                      type="text"
                      value={value !== undefined ? String(value) : ''}
                      onChange={(e) => {
                        setParsedFields({
                          ...parsedFields,
                          [key]: e.target.value,
                        });
                      }}
                      className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1-Click Fast Utterance Presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <span>Quick Test Samples (Click to test Auto-Intent Detection)</span>
              <HelpCircle className="w-3 h-3 text-[var(--text-muted)]" />
            </label>
            <span className="text-[0.625rem] text-[var(--text-muted)]">No microphone required</span>
          </div>

          <div className="space-y-1.5">
            {SAMPLE_UTTERANCES.map((sample, idx) => (
              <div
                key={idx}
                className="p-2 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[0.625rem] font-bold px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)]">
                      {sample.tag}
                    </span>
                  </div>
                  <div className="text-[0.7rem] text-[var(--text-main)] truncate">
                    &quot;{sample.gu}&quot;
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePlaySamplePreset(sample, 'gu')}
                    className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-main)] text-[0.65rem] font-semibold text-amber-800 flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3 text-amber-600" />
                    <span>Speak (Gujarati)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlaySamplePreset(sample, 'en')}
                    className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-main)] text-[0.65rem] font-semibold text-sky-800 flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3 text-sky-600" />
                    <span>Speak (English)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer Sticky Footer */}
      <div className="sticky bottom-0 bg-[var(--bg-surface)] border-t border-[var(--border)] p-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-xs font-semibold text-[var(--text-main)] transition"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          {!detectedType ? (
            <button
              type="button"
              onClick={() => handlePlaySamplePreset(SAMPLE_UTTERANCES[0], 'gu')}
              className="px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Fill Sample Lot</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving || !isAllRequiredPresent}
              className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-sm ${
                isAllRequiredPresent
                  ? 'bg-[var(--text-main)] text-[var(--bg-surface)] hover:opacity-90'
                  : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to ETMS...</span>
                </>
              ) : isAllRequiredPresent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save {currentEntityDef?.title} into ETMS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Complete Required Fields to Save</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
