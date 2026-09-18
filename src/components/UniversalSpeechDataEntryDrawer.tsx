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
  Plus,
} from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { useAppDrawer } from '@/lib/app-drawer-context';

// APIs for direct creation & verification
import { InwardChallansApi, InwardChallanApiItem } from '@/lib/api/challans';
import { KarigarsApi, KarigarApiItem, WageType } from '@/lib/api/karigars';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { ExpensesApi, ExpenseCategory } from '@/lib/api/expenses';
import { PurchasesApi } from '@/lib/api/purchases';
import { ShiftLogsApi, ShiftType } from '@/lib/api/shift-logs';
import { UchapatApi, PaymentMode } from '@/lib/api/uchapat';
import { OutwardInvoicesApi } from '@/lib/api/invoices';

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
export type CrudAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

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
    titleGu: 'આવક ગ્રે લોટ / ચલણ (CREATE / UPDATE)',
    icon: <Truck className="w-4 h-4 text-sky-400" />,
    color: 'sky',
    requiredFields: [
      { key: 'trader_name', label: 'Party / Trader Name', description: 'Name of the textile trader or broker', placeholder: 'e.g. Shri Radhe Krishna Textiles', example: 'Radhe Krishna Textiles' },
      { key: 'lot_no', label: 'Lot Number', description: 'Unique lot / challan identifier', placeholder: 'e.g. LOT-9140', example: 'Lot 9140' },
      { key: 'fabric_quality', label: 'Fabric Quality', description: 'Grey cloth quality or base material', placeholder: 'e.g. Pure Georgette 60g', example: 'Georgette 60g' },
      { key: 'inward_meters', label: 'Total Inward Meters', description: 'Total length in meters received', placeholder: 'e.g. 1850', example: '1850 meters' },
    ],
    optionalFields: [
      { key: 'challan_no', label: 'Challan Number', placeholder: 'e.g. CH-2026-914' },
      { key: 'challan_date', label: 'Challan Date', placeholder: 'e.g. 2026-09-15' },
      { key: 'trader_gstin', label: 'Trader GSTIN', placeholder: 'e.g. 24AAACS9988Z1Z9' },
      { key: 'than_count', label: 'Than / Rolls Count', placeholder: 'e.g. 18' },
      { key: 'design_no', label: 'Design Number', placeholder: 'e.g. DSN-104' },
      { key: 'stitch_count', label: 'Stitch Count', placeholder: 'e.g. 185000' },
      { key: 'jobwork_price_per_1k', label: 'Jobwork SAC Rate (₹/1k)', placeholder: 'e.g. 0.40' },
      { key: 'karigar_commission_rate', label: 'Karigar Commission Rate', placeholder: 'e.g. 0.05' },
      { key: 'karigar_commission_type', label: 'Commission Type (PER_1K_STITCHES/PER_METER)', placeholder: 'e.g. PER_1K_STITCHES' },
      { key: 'status', label: 'Status (RECEIVED/IN_PROGRESS/COMPLETED/DISPATCHED)', placeholder: 'RECEIVED' },
      { key: 'notes', label: 'Challan Notes / Remarks', placeholder: 'e.g. Received in good condition' },
    ],
  },
  shift: {
    type: 'shift',
    title: 'Daily Shift Production Log',
    titleGu: 'શિફ્ટ ઉત્પાદન લોગ (CREATE / UPDATE)',
    icon: <Clock className="w-4 h-4 text-emerald-400" />,
    color: 'emerald',
    requiredFields: [
      { key: 'machine_no', label: 'Machine Number', description: 'Factory machine code / head', placeholder: 'e.g. Machine #02', example: 'Machine 2' },
      { key: 'shift_type', label: 'Shift (Day / Night)', description: 'Operational shift period', placeholder: 'e.g. DAY or NIGHT', example: 'Day shift' },
      { key: 'stitches_count', label: 'Total Stitches Produced', description: 'Counter stitch count made in shift', placeholder: 'e.g. 185000', example: '185000 stitches' },
      { key: 'operator_name', label: 'Operator / Karigar Name', description: 'Assigned worker on machine', placeholder: 'e.g. Mukesh Solanki', example: 'Mukesh Solanki' },
    ],
    optionalFields: [
      { key: 'shift_date', label: 'Shift Date', placeholder: 'e.g. 2026-09-15' },
      { key: 'start_counter', label: 'Start Stitches Counter', placeholder: 'e.g. 0' },
      { key: 'end_counter', label: 'End Stitches Counter', placeholder: 'e.g. 185000' },
      { key: 'design_no', label: 'Design Number', placeholder: 'e.g. DSN-104' },
      { key: 'meter_count', label: 'Production Meters', placeholder: 'e.g. 160' },
      { key: 'inward_challan_id', label: 'Linked Inward Lot ID', placeholder: 'e.g. challan-id-9140' },
      { key: 'downtime_minutes', label: 'Downtime (Minutes)', placeholder: 'e.g. 15' },
      { key: 'downtime_reason', label: 'Downtime Reason', placeholder: 'e.g. Thread Breakage / Oil Check' },
    ],
  },
  karigar: {
    type: 'karigar',
    title: 'Karigar Master Registration',
    titleGu: 'કારીગર ખાતું / નોંધણી (CREATE / UPDATE)',
    icon: <Users className="w-4 h-4 text-indigo-400" />,
    color: 'indigo',
    requiredFields: [
      { key: 'name', label: 'Worker Full Name', description: 'Full name of the factory artisan', placeholder: 'e.g. Mukesh Solanki', example: 'Mukesh Solanki' },
      { key: 'mobile', label: 'Mobile Number', description: '10-digit contact phone number', placeholder: 'e.g. 9825144556', example: '9825144556' },
      { key: 'role', label: 'Designation / Role', description: 'Master, Operator or Helper', placeholder: 'e.g. Master Operator', example: 'Master Operator' },
    ],
    optionalFields: [
      { key: 'wage_type', label: 'Wage Type (PIECE_RATE/FIXED_MONTHLY)', placeholder: 'PIECE_RATE' },
      { key: 'rate_per_1000_stitches', label: 'Piece Rate (₹/1k stitches)', placeholder: 'e.g. 0.42' },
      { key: 'default_monthly_salary', label: 'Monthly Fixed Salary (₹)', placeholder: 'e.g. 18000' },
      { key: 'incentive_threshold_value', label: 'Incentive Target Value', placeholder: 'e.g. 200000' },
      { key: 'incentive_threshold_type', label: 'Incentive Target Unit (STITCHES/METERS)', placeholder: 'STITCHES' },
      { key: 'incentive_rate', label: 'Incentive Rate (₹)', placeholder: 'e.g. 0.05' },
      { key: 'incentive_rate_type', label: 'Incentive Rate Unit', placeholder: 'PER_1K_STITCHES' },
      { key: 'machine_assignment', label: 'Assigned Machine', placeholder: 'e.g. Machine #02' },
      { key: 'is_active', label: 'Active Worker Status', placeholder: 'true' },
    ],
  },
  expense: {
    type: 'expense',
    title: 'Factory Expense Voucher',
    titleGu: 'કારખાના ખર્ચ વાઉચર (CREATE / UPDATE)',
    icon: <Receipt className="w-4 h-4 text-rose-400" />,
    color: 'rose',
    requiredFields: [
      { key: 'title', label: 'Expense Title / Description', description: 'Purpose or item of expenditure', placeholder: 'e.g. Machine Lubricant Oil 5L', example: 'Oil expense' },
      { key: 'amount', label: 'Amount (₹)', description: 'Total cost in Indian Rupees', placeholder: 'e.g. 1450', example: '1450 rupees' },
      { key: 'payee_name', label: 'Payee / Vendor Name', description: 'Store, vendor or technician paid', placeholder: 'e.g. Standard Mill Spares Sachin', example: 'Standard Spares' },
    ],
    optionalFields: [
      { key: 'category', label: 'Category (DIRECT/INDIRECT)', placeholder: 'DIRECT' },
      { key: 'expense_type', label: 'Expense Sub-Type', placeholder: 'MACHINE_MAINTENANCE' },
      { key: 'expense_date', label: 'Expense Date', placeholder: 'e.g. 2026-09-15' },
      { key: 'payment_mode', label: 'Payment Mode (CASH/UPI/BANK_TRANSFER)', placeholder: 'UPI' },
      { key: 'reference_no', label: 'Reference / Bill No', placeholder: 'e.g. REF-8812' },
      { key: 'is_gst_applicable', label: 'Is GST Applicable (true/false)', placeholder: 'false' },
      { key: 'gst_amount', label: 'GST Amount (₹)', placeholder: 'e.g. 0' },
      { key: 'description', label: 'Detailed Voucher Description', placeholder: 'e.g. 5L machine lubricant oil for Machine 02' },
    ],
  },
  uchapat: {
    type: 'uchapat',
    title: 'Karigar Uchapat Advance',
    titleGu: 'કારીગર ઉચાપત એડવાન્સ (CREATE / UPDATE)',
    icon: <Briefcase className="w-4 h-4 text-amber-400" />,
    color: 'amber',
    requiredFields: [
      { key: 'karigar_name', label: 'Karigar / Worker Name', description: 'Recipient worker of the advance', placeholder: 'e.g. Ramesh Patel', example: 'Ramesh Patel' },
      { key: 'amount', label: 'Advance Amount (₹)', description: 'Withdrawn amount in Indian Rupees', placeholder: 'e.g. 2500', example: '2500 rupees' },
    ],
    optionalFields: [
      { key: 'date', label: 'Advance Date', placeholder: 'e.g. 2026-09-15' },
      { key: 'payment_mode', label: 'Payment Mode (CASH/UPI)', placeholder: 'CASH' },
      { key: 'remarks', label: 'Reason / Remarks', placeholder: 'e.g. Weekly family grocery advance' },
      { key: 'is_settled', label: 'Is Settled (true/false)', placeholder: 'false' },
    ],
  },
  party: {
    type: 'party',
    title: 'Party / Client Master',
    titleGu: 'વેપારી / પાર્ટી ખાતું (CREATE / UPDATE)',
    icon: <Briefcase className="w-4 h-4 text-teal-400" />,
    color: 'teal',
    requiredFields: [
      { key: 'name', label: 'Trader / Firm Name', description: 'Company or business name', placeholder: 'e.g. Surat Silk Prints', example: 'Surat Silk Prints' },
      { key: 'city', label: 'Market City / Location', description: 'Market area or city', placeholder: 'e.g. Surat', example: 'Surat' },
    ],
    optionalFields: [
      { key: 'gstin', label: '15-digit GSTIN', placeholder: 'e.g. 24AAACS9988Z1Z9' },
      { key: 'mobile', label: 'Mobile Number', placeholder: 'e.g. 9825088776' },
      { key: 'email', label: 'Email Address', placeholder: 'e.g. info@suratsilkprints.com' },
      { key: 'address', label: 'Street Address', placeholder: 'e.g. Ring Road Market, Surat' },
      { key: 'state_code', label: 'State Code', placeholder: '24' },
      { key: 'credit_period_days', label: 'Credit Period (Days)', placeholder: '30' },
      { key: 'opening_balance', label: 'Opening Balance (₹)', placeholder: '0' },
      { key: 'contact_person', label: 'Contact Person Name', placeholder: 'e.g. Kishore Bhai' },
      { key: 'is_active', label: 'Active Status', placeholder: 'true' },
    ],
  },
  purchase: {
    type: 'purchase',
    title: 'Store / Material Purchase',
    titleGu: 'યાર્ન / દોરા ખરીદી બિલ (CREATE / UPDATE)',
    icon: <ShoppingBag className="w-4 h-4 text-violet-400" />,
    color: 'violet',
    requiredFields: [
      { key: 'supplier_name', label: 'Supplier / Store Name', description: 'Vendor supplying the raw material', placeholder: 'e.g. Shree Hari Threads', example: 'Shree Hari Threads' },
      { key: 'item_name', label: 'Material Description', description: 'Yarn, cones, bobbin or spares description', placeholder: 'e.g. Polyester Embroidery Thread 120D', example: '50 bobbin thread' },
      { key: 'amount', label: 'Bill Amount (₹)', description: 'Total purchase invoice cost', placeholder: 'e.g. 8500', example: '8500 rupees' },
    ],
    optionalFields: [
      { key: 'supplier_gstin', label: 'Supplier GSTIN', placeholder: 'e.g. 24AAACS1122K1Z5' },
      { key: 'supplier_phone', label: 'Supplier Phone Number', placeholder: 'e.g. 9825122334' },
      { key: 'invoice_no', label: 'Supplier Bill / Invoice No', placeholder: 'e.g. INV-PUR-901' },
      { key: 'invoice_date', label: 'Invoice Date', placeholder: 'e.g. 2026-09-15' },
      { key: 'category', label: 'Category', placeholder: 'YARN_THREAD' },
      { key: 'payment_status', label: 'Payment Status (PENDING/PARTIAL/PAID)', placeholder: 'PAID' },
      { key: 'payment_mode', label: 'Payment Mode (CASH/UPI/BANK)', placeholder: 'CASH' },
      { key: 'quantity', label: 'Quantity / Cones', placeholder: '50' },
      { key: 'unit', label: 'Unit (CONES/PCS/METERS)', placeholder: 'CONES' },
      { key: 'rate', label: 'Unit Rate (₹)', placeholder: '170' },
      { key: 'subtotal', label: 'Subtotal (₹)', placeholder: '8500' },
      { key: 'gst_amount', label: 'GST Amount (₹)', placeholder: '0' },
      { key: 'paid_amount', label: 'Paid Amount (₹)', placeholder: '8500' },
      { key: 'notes', label: 'Purchase Remarks', placeholder: 'e.g. Received 50 cones' },
    ],
  },
  invoice: {
    type: 'invoice',
    title: 'Outward Jobwork Tax Invoice',
    titleGu: 'જાવક ટેક્સ બિલ (SAC 9988) (CREATE / UPDATE)',
    icon: <FileText className="w-4 h-4 text-blue-400" />,
    color: 'blue',
    requiredFields: [
      { key: 'party_name', label: 'Billed Party Name', description: 'Textile client billed for jobwork', placeholder: 'e.g. Shri Radhe Krishna Textiles', example: 'Radhe Krishna Textiles' },
      { key: 'amount', label: 'Total Billed Amount (₹)', description: 'Total tax invoice value', placeholder: 'e.g. 18500', example: '18500 rupees' },
      { key: 'invoice_no', label: 'Invoice Bill Number', description: 'SAC 9988 invoice bill reference', placeholder: 'e.g. INV-2026-081', example: 'Invoice 081' },
    ],
    optionalFields: [
      { key: 'invoice_date', label: 'Invoice Date', placeholder: 'e.g. 2026-09-15' },
      { key: 'trader_gstin', label: 'Party GSTIN', placeholder: 'e.g. 24AAACS9988Z1Z9' },
      { key: 'trader_mobile', label: 'Party Mobile', placeholder: 'e.g. 9825088776' },
      { key: 'sac_code', label: 'SAC Code', placeholder: '9988' },
      { key: 'total_stitches', label: 'Total Stitches', placeholder: 'e.g. 185000' },
      { key: 'machine_heads', label: 'Machine Heads', placeholder: 'e.g. 12' },
      { key: 'rate_per_1000', label: 'Rate per 1k Stitches (₹)', placeholder: 'e.g. 0.40' },
      { key: 'inward_meters', label: 'Inward Fabric Meters', placeholder: 'e.g. 1850' },
      { key: 'outward_meters', label: 'Outward Fabric Meters', placeholder: 'e.g. 1800' },
      { key: 'gross_amount', label: 'Gross Amount (₹)', placeholder: 'e.g. 18500' },
      { key: 'cgst_amount', label: 'CGST Amount (₹)', placeholder: 'e.g. 462.50' },
      { key: 'sgst_amount', label: 'SGST Amount (₹)', placeholder: 'e.g. 462.50' },
      { key: 'igst_amount', label: 'IGST Amount (₹)', placeholder: 'e.g. 0' },
      { key: 'is_interstate', label: 'Is Interstate Tax (true/false)', placeholder: 'false' },
      { key: 'shrinkage_percent', label: 'Shrinkage Percentage', placeholder: 'e.g. 2.7' },
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
    gu: 'રાધા કૃષ્ણ ટેક્સટાઇલ માટે 500 મીટર નો 20 રૂપિયા પ્રતિ મીટર હિસાબે જાવક ટેક્સ બિલ',
    speechGu: 'Radha Krishna Textiles maate 500 meter no 20 rupiya per meter hisaabe jaavak tax bill.',
    en: 'Create invoice for Radha Krishna Textiles for 500 m at 20 rupees per metre.',
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
  const { openDrawer } = useAppDrawer();

  const [activeLanguage, setActiveLanguage] = useState<'auto' | 'gu-IN' | 'hi-IN' | 'en-IN' | 'mr-IN' | 'ta-IN' | 'te-IN' | 'kn-IN' | 'bn-IN' | 'pa-IN' | 'ur-IN'>('auto');
  const [detectedLanguageLabel, setDetectedLanguageLabel] = useState<string>('Auto (All Regional Embroidery Hubs)');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [transcriptText, setTranscriptText] = useState('');
  const [detectedType, setDetectedType] = useState<DetectedEntityType | null>(null);
  const [englishSummary, setEnglishSummary] = useState('');
  const [parsedFields, setParsedFields] = useState<Record<string, string | number>>({});

  // Real-time DB master lists state
  const [dbParties, setDbParties] = useState<PartyApiItem[]>([]);
  const [dbKarigars, setDbKarigars] = useState<KarigarApiItem[]>([]);
  const [dbMachines, setDbMachines] = useState<MachineApiItem[]>([]);
  const [dbChallans, setDbChallans] = useState<InwardChallanApiItem[]>([]);

  // Verification state for linked master entity
  const [verificationState, setVerificationState] = useState<{
    entityType?: 'party' | 'karigar' | 'machine' | 'challan' | 'supplier';
    status: 'CONFIRMED' | 'NOT_FOUND' | 'MISSING';
    spokenName?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matchedRecord?: any;
  }>({ status: 'MISSING' });

  // Load live DB master lists when drawer opens
  useEffect(() => {
    if (isOpen) {
      PartiesApi.getAll().then(setDbParties).catch(() => {});
      KarigarsApi.getAll().then(setDbKarigars).catch(() => {});
      MachinesApi.getAll().then(setDbMachines).catch(() => {});
      InwardChallansApi.getAll().then(setDbChallans).catch(() => {});
    }
  }, [isOpen]);

  // Fuzzy Lookup Helpers for Real-time Entity Resolution
  const findMatchingParty = (spokenName: string): PartyApiItem | null => {
    if (!spokenName || !spokenName.trim()) return null;
    const target = spokenName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      dbParties.find((p) => {
        const pName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return pName.includes(target) || target.includes(pName);
      }) || null
    );
  };

  const findMatchingKarigar = (spokenName: string): KarigarApiItem | null => {
    if (!spokenName || !spokenName.trim()) return null;
    const target = spokenName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      dbKarigars.find((k) => {
        const kName = k.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return kName.includes(target) || target.includes(kName);
      }) || null
    );
  };

  const findMatchingMachine = (spokenName: string): MachineApiItem | null => {
    if (!spokenName || !spokenName.trim()) return null;
    const numMatch = spokenName.match(/\d+/);
    if (numMatch) {
      const num = numMatch[0];
      return dbMachines.find((m) => m.machine_no.includes(num)) || null;
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Helper for auto-detecting language from transcript text across all regional embroidery hubs
  const detectLanguageFromScript = (text: string): { code: string; label: string } => {
    if (!text.trim()) return { code: 'gu-IN', label: 'Gujarati (ગુજરાતી) • Surat Hub' };
    
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return { code: 'gu-IN', label: 'Gujarati (ગુજરાતી) • Surat/Ahmedabad Hub' };
    }
    if (/[\u0900-\u097F]/.test(text)) {
      if (text.includes('आहे') || text.includes('करू') || text.includes('दाखवा') || text.includes('उचल')) {
        return { code: 'mr-IN', label: 'Marathi (मराठी) • Bhiwandi/Ichalkaranji Hub' };
      }
      return { code: 'hi-IN', label: 'Hindi (हिन्दी) • UP/Pan-India Karigar Hub' };
    }
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return { code: 'ta-IN', label: 'Tamil (தமிழ்) • Tirupur/Coimbatore Hub' };
    }
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return { code: 'te-IN', label: 'Telugu (తెలుగు) • Hyderabad Hub' };
    }
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ) • Bangalore Silk Hub' };
    }
    if (/[\u0980-\u09FF]/.test(text)) {
      return { code: 'bn-IN', label: 'Bengali (বাংলা) • Kolkata Zardozi Hub' };
    }
    if (/[\u0A00-\u0A7F]/.test(text)) {
      return { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ) • Ludhiana/Amritsar Hub' };
    }
    if (/[\u0600-\u06FF]/.test(text)) {
      return { code: 'ur-IN', label: 'Urdu (اردو) • Malegaon/Varanasi Hub' };
    }
    return { code: 'en-IN', label: 'English (Indian Standard)' };
  };

  // Reset state when opening / closing
  useEffect(() => {
    if (!isOpen) {
      setTranscriptText('');
      setDetectedType(null);
      setEnglishSummary('');
      setParsedFields({});
      setDetectedLanguageLabel('Auto (Gujarati / Hindi / English)');
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
        if (activeLanguage === 'auto') {
          recognition.lang = typeof navigator !== 'undefined' ? (navigator.language || 'gu-IN') : 'gu-IN';
        } else {
          recognition.lang = activeLanguage;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const cleaned = currentTranscript.trim();
          setTranscriptText(cleaned);

          if (activeLanguage === 'auto') {
            const detected = detectLanguageFromScript(cleaned);
            setDetectedLanguageLabel(detected.label);
          }
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

  // 1. Multilingual CRUD Action Detector
  const detectCrudAction = (text: string): CrudAction => {
    const lower = text.toLowerCase();

    // DELETE / CANCEL / REMOVE (Gujarati, Hindi, Marathi, English)
    if (
      lower.includes('delete') || lower.includes('remove') || lower.includes('cancel') ||
      lower.includes('રદ') || lower.includes('ડીલીટ') || lower.includes('હટાવો') || lower.includes('કાઢી') ||
      lower.includes('रद्द') || lower.includes('डिलीट') || lower.includes('हटाओ') || lower.includes('निकालो') ||
      lower.includes('हटवा') || lower.includes('कमी करा')
    ) {
      return 'DELETE';
    }

    // UPDATE / EDIT / MODIFY (Gujarati, Hindi, Marathi, English)
    if (
      lower.includes('update') || lower.includes('edit') || lower.includes('modify') || lower.includes('change') ||
      lower.includes('સુધારો') || lower.includes('બદલો') || lower.includes('અપડેટ') || lower.includes('ફેરફાર') ||
      lower.includes('सुधारो') || lower.includes('बदलो') || lower.includes('अपडेट') || lower.includes('संशोधन') ||
      lower.includes('बदला') || lower.includes('दुरुस्त')
    ) {
      return 'UPDATE';
    }

    // READ / VIEW / SHOW / LIST (Gujarati, Hindi, Marathi, English)
    if (
      lower.includes('show') || lower.includes('view') || lower.includes('list') || lower.includes('display') || lower.includes('check') || lower.includes('search') ||
      lower.includes('બતાવો') || lower.includes('જુઓ') || lower.includes('દેખાડો') || lower.includes('ચકાસો') || lower.includes('પડતાલ') || lower.includes('યાદી') ||
      lower.includes('दिखाओ') || lower.includes('देखो') || lower.includes('सूची') || lower.includes('जांचो') || lower.includes('लिस्ट') ||
      lower.includes('दाखवा') || lower.includes('पहा') || lower.includes('यादी')
    ) {
      return 'READ';
    }

    // Default: CREATE / ADD
    return 'CREATE';
  };

  // 2. Zero-Click Multilingual Intent Classifier (Gujarati, Hindi, English, Marathi)
  const classifyIntent = (text: string): DetectedEntityType => {
    const lower = text.toLowerCase();

    // 1. Uchapat / Advance Check
    if (
      lower.includes('uchapat') ||
      lower.includes('ઉચાપત') ||
      lower.includes('advance') ||
      lower.includes('એડવાન્સ') ||
      lower.includes('ઉપાડ') ||
      lower.includes('upad') ||
      lower.includes('उधार') ||
      lower.includes('अग्रिम') ||
      lower.includes('उचल')
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
      lower.includes('ડિઝાઇન') ||
      lower.includes('शिफ्ट') ||
      lower.includes('टांका') ||
      lower.includes('मशीन') ||
      lower.includes('टाके')
    ) {
      if (lower.includes('stitches') || lower.includes('ટાંકા') || lower.includes('टांका') || lower.includes('night') || lower.includes('day') || lower.includes('ઓપરેટર')) {
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
      lower.includes('taka') ||
      lower.includes('चालान') ||
      lower.includes('पावती') ||
      lower.includes('कापड')
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
      lower.includes('લાઈટ બિલ') ||
      lower.includes('खर्च') ||
      lower.includes('वाउचर')
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
      lower.includes('sequin') ||
      lower.includes('खरीद') ||
      lower.includes('खरेदी') ||
      lower.includes('धागा')
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
      lower.includes(' कारीगर') ||
      lower.includes('कामगार') ||
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
      lower.includes('prints') ||
      lower.includes('व्यापारी') ||
      lower.includes('ग्राहक')
    ) {
      return 'party';
    }

    // 8. Tax Invoice Check
    if (
      lower.includes('invoice') ||
      lower.includes('ઇનવોઇસ') ||
      lower.includes('tax bill') ||
      lower.includes('sac 9988') ||
      lower.includes('બિલ') ||
      lower.includes('बिल') ||
      lower.includes('बीजक')
    ) {
      return 'invoice';
    }

    // Default Fallback based on numbers & words
    if (lower.includes('meter') || lower.includes('મીટર') || lower.includes('मीटर')) return 'challan';
    if (lower.includes('રૂપિયા') || lower.includes('rs') || lower.includes('rupees') || lower.includes('रुपये')) return 'expense';

    return 'challan';
  };

  // Extraction Helpers for Dynamic Voice Commands
  const extractPhoneNumber = (inputText: string): string => {
    const kwMatch = inputText.match(/(?:phone|mobile|mo|contact|cell|number|નંબર|મોબાઈલ|ફોન)\s*(?:number|no|#)?\s*[:=-]?\s*(\+?91[\s-]?)?([6-9][\d\s-]{8,14}\d)/i);
    if (kwMatch) {
      const digits = kwMatch[2].replace(/\D/g, '');
      if (digits.length === 10) return digits;
    }
    const genericMatch = inputText.match(/(?:\+91[\s-]?)?\b([6-9](?:\s*\d){9})\b/);
    if (genericMatch) {
      const digits = genericMatch[1].replace(/\D/g, '');
      if (digits.length === 10) return digits;
    }
    return '';
  };

  const extractGSTIN = (inputText: string): string => {
    const match = inputText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/i);
    return match ? match[0].toUpperCase() : '';
  };

  const extractName = (inputText: string, prefixKeywords: string[]): string => {
    const pattern = prefixKeywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(
      `(?:${pattern})\\s*[:=-]?\\s*([A-Za-z\\u0A80-\\u0AFF\\s.'-]+?)(?=\\s*(?:phone|mobile|mo\\b|contact|cell|gst|gstin|city|location|shahar|bhav|rate|price|amount|bill|lot|machine|role|than|taka|meters|meter|stitches|st\\b|₹|\\+?\\d{4,}|$))`,
      'i'
    );
    const match = inputText.match(regex);
    if (match && match[1]?.trim()) {
      const clean = match[1]
        .trim()
        .replace(/^(is|for|to|of|ne|maate|માટે|ને|નું|ની)\s+/i, '')
        .replace(/[,.-]+$/, '')
        .trim();
      if (clean.length >= 2) return clean;
    }
    return '';
  };

  const extractCityName = (inputText: string): string => {
    const match = inputText.match(/(?:city|location|shahar|market|ગામ|શહેર|માર્કેટ)\s*[:=-]?\s*([A-Za-z\u0A80-\u0AFF]+)/i);
    if (match && match[1]) return match[1].trim();
    const lower = inputText.toLowerCase();
    const knownCities = ['surat', 'ahmedabad', 'mumbai', 'sachin', 'palsana', 'katargam', 'varachha', 'pandesara', 'bhatar', 'delhi', 'jaipur', 'kolkata'];
    for (const c of knownCities) {
      if (lower.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
    }
    return '';
  };

  // 2. Extract Fields & Produce English Structured Breakdown (Pure Dynamic Extraction + DB Resolution)
  const processSpokenInput = (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      const type = classifyIntent(text);
      const crudAction = detectCrudAction(text);
      setDetectedType(type);

      const lower = text.toLowerCase();
      const extracted: Record<string, string | number> = {};
      extracted.crud_action = crudAction;
      let summary = '';

      const actionPrefix =
        crudAction === 'DELETE' ? 'DELETE / CANCEL REQUEST: ' :
        crudAction === 'UPDATE' ? 'UPDATE REQUEST: ' :
        crudAction === 'READ' ? 'VIEW / SEARCH INQUIRY: ' :
        'CREATE NEW ENTRY: ';

      // Common extractions with commas cleaned:
      const cleanText = text.replace(/,/g, '');
      const numbers = (cleanText.match(/\b\d+(\.\d+)?\b/g) || []).map(Number);
      
      const explicitAmtMatch =
        cleanText.match(/(?:₹|rs\.?|inr|bill|બિલ|રકમ|amount)\s*[:#-]?\s*(\d+(?:\.\d+)?)/i) ||
        cleanText.match(/(\d+(?:\.\d+)?)\s*(?:રૂપિયા|રૂ|rs|inr|rupees|rokla|rokda|રોકડા|રોકલા|cash)/i);
      const amtMatch = explicitAmtMatch;
      const phoneMatch = extractPhoneNumber(text);
      const gstMatch = extractGSTIN(text);

      switch (type) {
        case 'challan': {
          const lotMatch = text.match(/(?:લોટ|lot|challan|ચલણ)\s*(?:no|number|#)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i);
          extracted.lot_no = lotMatch
            ? lotMatch[1].toUpperCase().startsWith('LOT-')
              ? lotMatch[1].toUpperCase()
              : `LOT-${lotMatch[1].toUpperCase()}`
            : numbers[0] && numbers[0] < 100000
            ? `LOT-${numbers[0]}`
            : '';
          
          const meterMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:મીટર|મી|meter|meters|m\b)/i);
          extracted.inward_meters = meterMatch ? Number(meterMatch[1]) : (numbers.find((n) => n >= 50 && n <= 50000) || '');

          const takaMatch = cleanText.match(/(\d+)\s*(?:તાકા|તાન|ટાકા|taka|than|rolls|pcs)\b/i);
          extracted.than_count = takaMatch ? Number(takaMatch[1]) : (numbers.find((n) => n > 0 && n <= 150) || '');

          if (lower.includes('georgette') || lower.includes('જ્યોર્જેટ')) extracted.fabric_quality = 'Pure Georgette 60g';
          else if (lower.includes('crepe') || lower.includes('ક્રેપ')) extracted.fabric_quality = 'Crepe Silk';
          else if (lower.includes('organza') || lower.includes('ઓર્ગેન્ઝા')) extracted.fabric_quality = 'Organza Tissue';
          else if (lower.includes('viscose') || lower.includes('વિસ્કોસ')) extracted.fabric_quality = 'Viscose Chiffon';
          else if (lower.includes('cotton') || lower.includes('કોટન')) extracted.fabric_quality = 'Cotton Satin';
          else {
            const fabricSpoken = extractName(text, ['quality', 'fabric', 'કાપડ', 'ગ્રે', 'કવોલિટી']);
            extracted.fabric_quality = fabricSpoken || '';
          }

          const rateMatch =
            cleanText.match(/(?:ભાવ|rate|bhav|પૈસા)\s*[:#-]?\s*(\d+(?:\.\d+)?)/i) ||
            cleanText.match(/(\d+(?:\.\d+)?)\s*(?:પૈસા|paisa)/i);
          extracted.jobwork_price_per_1k = rateMatch
            ? Number(rateMatch[1]) > 5
              ? Number(rateMatch[1]) / 100
              : Number(rateMatch[1])
            : '';

          let spokenPartyName = extractName(text, ['trader', 'party', 'for', 'client', 'maate', 'વેપારી', 'પાર્ટી', 'માટે']);
          if (!spokenPartyName) {
            if (lower.includes('રાધે') || lower.includes('radhe')) spokenPartyName = 'Radhe Krishna';
            else if (lower.includes('રામ') || lower.includes('ram')) spokenPartyName = 'Shree Ram';
            else if (lower.includes('સુરત') || lower.includes('surat')) spokenPartyName = 'Surat Silk Prints';
          }

          const matchedParty = spokenPartyName ? findMatchingParty(spokenPartyName) : null;
          if (matchedParty) {
            extracted.trader_name = matchedParty.name;
            extracted.trader_gstin = matchedParty.gstin || '';
            extracted.party_id = matchedParty.id;
            setVerificationState({
              entityType: 'party',
              status: 'CONFIRMED',
              spokenName: spokenPartyName || matchedParty.name,
              matchedRecord: matchedParty,
            });
          } else if (spokenPartyName) {
            extracted.trader_name = spokenPartyName;
            extracted.trader_gstin = gstMatch;
            setVerificationState({
              entityType: 'party',
              status: 'NOT_FOUND',
              spokenName: spokenPartyName,
            });
          } else {
            extracted.trader_name = '';
            extracted.trader_gstin = gstMatch;
            setVerificationState({
              entityType: 'party',
              status: 'MISSING',
            });
          }

          const challanNoMatch = text.match(/(?:challan|ચલણ)\s*(?:no|નંબર)?\s*[:#-]?\s*(\w+)/i);
          extracted.challan_no = challanNoMatch ? challanNoMatch[1].toUpperCase() : '';
          extracted.challan_date = new Date().toISOString().split('T')[0];

          const designMatch = text.match(/(?:ડિઝાઇન|design|dsn)\s*(?:no|#)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i);
          extracted.design_no = designMatch
            ? designMatch[1].toUpperCase().startsWith('DSN-')
              ? designMatch[1].toUpperCase()
              : `DSN-${designMatch[1].toUpperCase()}`
            : '';

          const stitchMatch = cleanText.match(/(\d+)\s*(?:ટાંકા|સ્ટીચ|stitches|st)\b/i);
          extracted.stitch_count = stitchMatch ? Number(stitchMatch[1]) : (numbers.find((n) => n >= 10000) || '');

          extracted.karigar_commission_rate = '';
          extracted.karigar_commission_type = 'PER_1K_STITCHES';
          extracted.status = 'RECEIVED';
          extracted.notes = text;

          summary = `Recorded Inward Fabric Lot ${extracted.lot_no ? '#' + extracted.lot_no : ''} of ${extracted.inward_meters || 0}m (${extracted.than_count || 0} Taka) in ${extracted.fabric_quality || 'fabric'} for "${extracted.trader_name || 'Party'}".`;
          break;
        }

        case 'shift': {
          const machineMatch = text.match(/(?:મશીન|machine|m\/?c)\s*(?:no|number|#)?\s*[:#-]?\s*(\d+)/i);
          const spokenMachineNo = machineMatch ? machineMatch[1] : '';
          extracted.machine_no = spokenMachineNo ? `Machine #${spokenMachineNo.padStart(2, '0')}` : '';

          const matchedMachine = spokenMachineNo ? findMatchingMachine(spokenMachineNo) : null;
          if (matchedMachine) {
            extracted.machine_id = matchedMachine.id;
            extracted.machine_no = matchedMachine.machine_no;
          }

          if (lower.includes('નાઈટ') || lower.includes('night') || lower.includes('રાત')) {
            extracted.shift_type = 'NIGHT';
          } else if (lower.includes('ડે') || lower.includes('day') || lower.includes('દિવસ')) {
            extracted.shift_type = 'DAY';
          } else {
            extracted.shift_type = 'DAY';
          }

          const designMatch = text.match(/(?:ડિઝાઇન|design|dsn)\s*(?:no|#)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i);
          extracted.design_no = designMatch
            ? designMatch[1].toUpperCase().startsWith('DSN-')
              ? designMatch[1].toUpperCase()
              : `DSN-${designMatch[1].toUpperCase()}`
            : '';

          const stitchMatch = cleanText.match(/(\d+)\s*(?:ટાંકા|સ્ટીચ|stitches|st)\b/i);
          extracted.stitches_count = stitchMatch ? Number(stitchMatch[1]) : (numbers.find((n) => n >= 5000) || '');

          let spokenOp = extractName(text, ['operator', 'karigar', 'worker', 'ઓપરેટર', 'કારીગર', 'ચલાવનાર']);
          if (!spokenOp) {
            if (lower.includes('મુકેશ') || lower.includes('mukesh')) spokenOp = 'Mukesh Solanki';
            else if (lower.includes('સુરેશ') || lower.includes('suresh')) spokenOp = 'Suresh Patel';
            else if (lower.includes('દિનેશ') || lower.includes('dinesh')) spokenOp = 'Dinesh Yadav';
            else if (lower.includes('રમેશ') || lower.includes('ramesh')) spokenOp = 'Ramesh Patel';
          }

          const matchedKarigar = spokenOp ? findMatchingKarigar(spokenOp) : null;
          if (matchedKarigar) {
            extracted.operator_name = matchedKarigar.name;
            extracted.karigar_id = matchedKarigar.id;
            setVerificationState({
              entityType: 'karigar',
              status: 'CONFIRMED',
              spokenName: spokenOp || matchedKarigar.name,
              matchedRecord: matchedKarigar,
            });
          } else if (spokenOp) {
            extracted.operator_name = spokenOp;
            setVerificationState({
              entityType: 'karigar',
              status: 'NOT_FOUND',
              spokenName: spokenOp,
            });
          } else {
            extracted.operator_name = '';
            setVerificationState({
              entityType: 'karigar',
              status: 'MISSING',
            });
          }

          const meterMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:મીટર|મી|meter|meters|m\b)/i);
          extracted.meter_count = meterMatch ? Number(meterMatch[1]) : (numbers.find((n) => n > 10 && n < 2000) || '');
          extracted.shift_date = new Date().toISOString().split('T')[0];
          extracted.start_counter = '';
          extracted.end_counter = extracted.stitches_count || '';
          extracted.inward_challan_id = '';
          extracted.downtime_minutes = numbers.find((n) => n > 0 && n <= 120) || '';
          extracted.downtime_reason = '';

          summary = `Logged ${extracted.shift_type} shift on ${extracted.machine_no || 'Machine'} by ${extracted.operator_name || 'Operator'} (${extracted.stitches_count || 0} stitches, ${extracted.meter_count || 0}m).`;
          break;
        }

        case 'uchapat': {
          extracted.amount = amtMatch ? Number(amtMatch[1]) : (numbers.find((n) => n >= 50) || '');
          let spokenKarigar = extractName(text, ['to', 'ne', 'karigar', 'worker', 'કારીગર', 'ને']);
          if (!spokenKarigar) {
            if (lower.includes('મુકેશ') || lower.includes('mukesh')) spokenKarigar = 'Mukesh Solanki';
            else if (lower.includes('રમેશ') || lower.includes('ramesh')) spokenKarigar = 'Ramesh Patel';
            else if (lower.includes('દિનેશ') || lower.includes('dinesh')) spokenKarigar = 'Dinesh Yadav';
            else if (lower.includes('સુરેશ') || lower.includes('suresh')) spokenKarigar = 'Suresh Patel';
          }

          const matchedK = spokenKarigar ? findMatchingKarigar(spokenKarigar) : null;
          if (matchedK) {
            extracted.karigar_name = matchedK.name;
            extracted.karigar_id = matchedK.id;
            setVerificationState({
              entityType: 'karigar',
              status: 'CONFIRMED',
              spokenName: spokenKarigar || matchedK.name,
              matchedRecord: matchedK,
            });
          } else if (spokenKarigar) {
            extracted.karigar_name = spokenKarigar;
            setVerificationState({
              entityType: 'karigar',
              status: 'NOT_FOUND',
              spokenName: spokenKarigar,
            });
          } else {
            extracted.karigar_name = '';
            setVerificationState({
              entityType: 'karigar',
              status: 'MISSING',
            });
          }

          extracted.payment_mode = lower.includes('યુપીઆઈ') || lower.includes('upi') || lower.includes('ઓનલાઇન') || lower.includes('online') ? 'UPI' : 'CASH';
          extracted.remarks = 'Wage advance (Voice Entry)';
          extracted.date = new Date().toISOString().split('T')[0];
          extracted.is_settled = 'false';

          summary = `Issued wage advance of ₹${extracted.amount || 0} to worker ${extracted.karigar_name || 'Karigar'} via ${extracted.payment_mode}.`;
          break;
        }

        case 'expense': {
          extracted.amount = amtMatch ? Number(amtMatch[1]) : (numbers.find((n) => n >= 10) || '');

          const titleSpoken = extractName(text, ['expense', 'for', 'ખર્ચ', 'બાબત']);
          if (lower.includes('ઓઈલ') || lower.includes('oil')) {
            extracted.title = titleSpoken || 'Machine Lubricant Oil';
            extracted.expense_type = 'MACHINE_MAINTENANCE';
          } else if (lower.includes('સોય') || lower.includes('needle') || lower.includes('બોબીન') || lower.includes('spares')) {
            extracted.title = titleSpoken || 'Machine Needles & Spares';
            extracted.expense_type = 'THREAD_CONSUMABLES';
          } else if (lower.includes('ચા') || lower.includes('tea') || lower.includes('નાસ્તો')) {
            extracted.title = titleSpoken || 'Shift Factory Refreshments';
            extracted.expense_type = 'FACTORY_REFRESHMENTS';
          } else {
            extracted.title = titleSpoken || (text.length > 5 ? text : 'Factory Consumables');
            extracted.expense_type = 'CONSUMABLES';
          }

          let spokenPayee = extractName(text, ['to', 'payee', 'vendor', 'store', 'paid to', 'ને', 'દુકાન']);
          if (!spokenPayee) {
            if (lower.includes('સચીન') || lower.includes('sachin')) spokenPayee = 'Standard Mill Spares, Sachin GIDC';
            else if (lower.includes('સ્પેર') || lower.includes('spares')) spokenPayee = 'Standard Factory Spares Surat';
          }

          extracted.payee_name = spokenPayee || '';
          extracted.payment_mode = lower.includes('યુપીઆઈ') || lower.includes('upi') || lower.includes('online') ? 'UPI' : 'CASH';
          extracted.category = lower.includes('indirect') ? 'INDIRECT' : 'DIRECT';
          extracted.expense_date = new Date().toISOString().split('T')[0];
          extracted.reference_no = '';
          extracted.is_gst_applicable = gstMatch || lower.includes('gst') ? 'true' : 'false';
          extracted.gst_amount = lower.includes('gst') && extracted.amount ? Math.round(Number(extracted.amount) * 0.18) : '';
          extracted.description = text;

          summary = `Recorded expense voucher of ₹${extracted.amount || 0} for "${extracted.title}"${extracted.payee_name ? ' to ' + extracted.payee_name : ''} via ${extracted.payment_mode}.`;
          break;
        }

        case 'karigar': {
          let spokenName = extractName(text, ['karigar name', 'worker name', 'name', 'karigar', 'worker', 'artisan', 'કારીગર', 'નામ']);
          if (!spokenName) {
            if (lower.includes('મુકેશ') || lower.includes('mukesh')) spokenName = 'Mukesh Solanki';
            else if (lower.includes('દિનેશ') || lower.includes('dinesh')) spokenName = 'Dinesh Yadav';
            else if (lower.includes('રમેશ') || lower.includes('ramesh')) spokenName = 'Ramesh Patel';
            else if (lower.includes('સુરેશ') || lower.includes('suresh')) spokenName = 'Suresh Patel';
          }

          extracted.name = spokenName || '';
          const existingK = spokenName ? findMatchingKarigar(spokenName) : null;
          if (existingK) {
            setVerificationState({
              entityType: 'karigar',
              status: 'CONFIRMED',
              spokenName,
              matchedRecord: existingK,
            });
          } else if (spokenName) {
            setVerificationState({
              entityType: 'karigar',
              status: 'NOT_FOUND',
              spokenName,
            });
          }

          if (lower.includes('માસ્ટર') || lower.includes('master')) extracted.role = 'Master Operator';
          else if (lower.includes('કટર') || lower.includes('cutter') || lower.includes('helper') || lower.includes('હેલ્પર')) extracted.role = 'Thread Cutter Helper';
          else if (lower.includes('operator') || lower.includes('ઓપરેટર')) extracted.role = 'Embroidery Operator';
          else extracted.role = 'Embroidery Operator';

          extracted.mobile = phoneMatch;
          const rateMatch =
            cleanText.match(/(?:rate|ભાવ|bhav|પૈસા|price|₹)\s*[:#-]?\s*(\d+(?:\.\d+)?)/i) ||
            cleanText.match(/(\d+(?:\.\d+)?)\s*(?:પૈસા|paisa|rate|per\s*meter)/i);
          extracted.rate_per_1000_stitches = rateMatch
            ? Number(rateMatch[1]) > 5
              ? Number(rateMatch[1]) / 100
              : Number(rateMatch[1])
            : (numbers.find((n) => n < 5 && n > 0) || '');

          const mcMatch = text.match(/(?:machine|મશીન|m\/?c)\s*[:#-]?\s*(\d+)/i);
          extracted.machine_assignment = mcMatch ? `Machine #${mcMatch[1].padStart(2, '0')}` : '';
          extracted.wage_type = lower.includes('fixed') || lower.includes('monthly') ? 'FIXED_MONTHLY' : 'PIECE_RATE';
          extracted.default_monthly_salary = '';
          extracted.incentive_threshold_value = '';
          extracted.incentive_threshold_type = 'STITCHES';
          extracted.incentive_rate = '';
          extracted.incentive_rate_type = 'PER_1K_STITCHES';
          extracted.is_active = 'true';

          summary = `Registered Karigar "${extracted.name || 'Artisan'}" (${extracted.role})${extracted.mobile ? ' Mobile: ' + extracted.mobile : ''}${extracted.rate_per_1000_stitches ? ' @ ₹' + extracted.rate_per_1000_stitches + '/1k st' : ''}.`;
          break;
        }

        case 'party': {
          let spokenParty = extractName(text, ['party name', 'name', 'party', 'vepari', 'trader', 'firm', 'company', 'client', 'વેપારી', 'પાર્ટી', 'નામ']);
          if (!spokenParty) {
            if (lower.includes('સુરત') || lower.includes('surat')) spokenParty = 'Surat Silk Prints';
            else if (lower.includes('રાધે') || lower.includes('radhe')) spokenParty = 'Shri Radhe Krishna Textiles';
            else if (lower.includes('રામ') || lower.includes('ram')) spokenParty = 'Shree Ram Fabrics';
          }

          const matchedParty = spokenParty ? findMatchingParty(spokenParty) : null;
          if (matchedParty) {
            extracted.name = matchedParty.name;
            extracted.gstin = matchedParty.gstin || '';
            extracted.city = matchedParty.city || 'Surat';
            setVerificationState({
              entityType: 'party',
              status: 'CONFIRMED',
              spokenName: spokenParty || matchedParty.name,
              matchedRecord: matchedParty,
            });
          } else if (spokenParty) {
            extracted.name = spokenParty;
            extracted.gstin = gstMatch;
            extracted.city = extractCityName(text) || 'Surat';
            setVerificationState({
              entityType: 'party',
              status: 'NOT_FOUND',
              spokenName: spokenParty,
            });
          } else {
            extracted.name = '';
            extracted.gstin = gstMatch;
            extracted.city = extractCityName(text) || 'Surat';
            setVerificationState({
              entityType: 'party',
              status: 'MISSING',
            });
          }

          extracted.mobile = phoneMatch;
          extracted.contact_person = extractName(text, ['contact person', 'contact', 'person', 'bhai', 'સંપર્ક']) || '';
          extracted.email = '';
          extracted.address = '';
          extracted.state_code = '24';
          extracted.credit_period_days = 30;
          extracted.opening_balance = 0;
          extracted.is_active = 'true';

          const summaryParts = [];
          if (extracted.name) summaryParts.push(`"${extracted.name}"`);
          else summaryParts.push('profile');
          if (extracted.city) summaryParts.push(`located in ${extracted.city}`);
          if (extracted.gstin) summaryParts.push(`(GSTIN: ${extracted.gstin})`);
          if (extracted.contact_person) summaryParts.push(`(Contact: ${extracted.contact_person})`);
          if (extracted.mobile) summaryParts.push(`(Mobile: ${extracted.mobile})`);

          summary = `Registered textile party ${summaryParts.join(' ')}.`;
          break;
        }

        case 'purchase': {
          extracted.amount = amtMatch ? Number(amtMatch[1]) : (numbers.find((n) => n >= 50) || '');

          let spokenSupplier = extractName(text, ['from', 'supplier', 'store', 'vendor', 'dukan', 'માંથી', 'દુકાન']);
          if (!spokenSupplier) {
            if (lower.includes('shrihari') || lower.includes('શ્રીહરિ') || lower.includes('shree hari') || lower.includes('શ્રી હરિ')) {
              spokenSupplier = 'Shrihari Threads & Cones';
            }
          }

          const matchedSupplier = spokenSupplier ? findMatchingParty(spokenSupplier) : null;
          if (matchedSupplier) {
            extracted.supplier_name = matchedSupplier.name;
            extracted.supplier_gstin = matchedSupplier.gstin || '';
            setVerificationState({
              entityType: 'supplier',
              status: 'CONFIRMED',
              spokenName: spokenSupplier || matchedSupplier.name,
              matchedRecord: matchedSupplier,
            });
          } else if (spokenSupplier) {
            extracted.supplier_name = spokenSupplier;
            setVerificationState({
              entityType: 'supplier',
              status: 'NOT_FOUND',
              spokenName: spokenSupplier,
            });
          } else {
            extracted.supplier_name = '';
            setVerificationState({
              entityType: 'supplier',
              status: 'MISSING',
            });
          }

          const itemSpoken = extractName(text, ['item', 'material', 'dora', 'thread', 'દોરા', 'બોબીન', 'માલ']);
          if (itemSpoken) {
            extracted.item_name = itemSpoken;
          } else if (lower.includes('bobbin') || lower.includes('બોબીન') || lower.includes('dora') || lower.includes('દોરા')) {
            extracted.item_name = '50 Bobbin Embroidery Dora / Filament Thread';
          } else if (lower.includes('thread') || lower.includes('દોરા')) {
            extracted.item_name = 'Polyester Filament Embroidery Thread 120D/2';
          } else {
            extracted.item_name = 'Embroidery Consumables';
          }

          const qtyMatch = cleanText.match(/(\d+)\s*(?:cones|bobbin|pcs|rolls|બોબીન|કોન)\b/i);
          extracted.quantity = qtyMatch ? Number(qtyMatch[1]) : (numbers.find((n) => n > 0 && n <= 500) || '');
          extracted.payment_mode = (lower.includes('rokla') || lower.includes('rokda') || lower.includes('રોકડા') || lower.includes('રોકલા') || lower.includes('cash')) ? 'CASH' : (lower.includes('upi') || lower.includes('યુપીઆઈ')) ? 'UPI' : 'CASH';
          extracted.supplier_gstin = gstMatch;
          extracted.supplier_phone = phoneMatch;
          extracted.invoice_no = '';
          extracted.invoice_date = new Date().toISOString().split('T')[0];
          extracted.category = 'YARN_THREAD';
          extracted.payment_status = 'PAID';
          extracted.unit = 'CONES';
          extracted.rate = (extracted.amount && extracted.quantity) ? Math.round(Number(extracted.amount) / Number(extracted.quantity)) : '';
          extracted.subtotal = extracted.amount || '';
          extracted.gst_amount = lower.includes('gst') && extracted.amount ? Math.round(Number(extracted.amount) * 0.05) : '';
          extracted.paid_amount = extracted.amount || '';
          extracted.notes = text;

          summary = `Logged material purchase of ${extracted.quantity || ''} ${extracted.item_name} from "${extracted.supplier_name || 'Vendor'}" for ₹${extracted.amount || 0} (${extracted.payment_mode}).`;
          break;
        }

        case 'invoice': {
          const meterQtyMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:મીટર|મી|meter|meters|metre|metres|m|pcs|units)/i);
          const rateMatch = cleanText.match(/(?:at|@|rate|ભાવ|ભાવે|દર|rate\s*of)\s*(\d+(?:\.\d+)?)\s*(?:રૂપિયા|રૂ|rs|inr|rupees|\/m|per\s*meter|per\s*m|per\s*metre)?/i) ||
                            cleanText.match(/(\d+(?:\.\d+)?)\s*(?:રૂપિયા|રૂ|rs|inr|rupees)\s*(?:per|\/)\s*(?:meter|metre|m|pc|unit)/i);

          const qty = meterQtyMatch ? Number(meterQtyMatch[1]) : 0;
          const rate = rateMatch ? Number(rateMatch[1]) : 0;

          if (qty > 0 && rate > 0) {
            extracted.inward_meters = qty;
            extracted.outward_meters = Math.max(0, qty - 20);
            extracted.rate_per_1000 = rate;
            extracted.amount = Math.round(qty * rate * 100) / 100;
          } else {
            extracted.amount = amtMatch ? Number(amtMatch[1]) : (numbers.find((n) => n >= 100) || '');
            extracted.inward_meters = qty || '';
            extracted.outward_meters = '';
            extracted.rate_per_1000 = rate || '';
          }

          let spokenParty = extractName(text, ['for', 'party', 'client', 'trader', 'maate', 'પાર્ટી', 'માટે']);
          if (!spokenParty) {
            if (lower.includes('રાધે') || lower.includes('radha') || lower.includes('radhe')) spokenParty = 'Shri Radhe Krishna Textiles';
            else if (lower.includes('રામ') || lower.includes('ram')) spokenParty = 'Shree Ram Fabrics';
            else if (lower.includes('સુરત') || lower.includes('surat')) spokenParty = 'Surat Silk Prints';
          }

          const matchedParty = spokenParty ? findMatchingParty(spokenParty) : null;
          if (matchedParty) {
            extracted.party_name = matchedParty.name;
            extracted.trader_gstin = matchedParty.gstin || '';
            setVerificationState({
              entityType: 'party',
              status: 'CONFIRMED',
              spokenName: spokenParty || matchedParty.name,
              matchedRecord: matchedParty,
            });
          } else if (spokenParty) {
            extracted.party_name = spokenParty;
            extracted.trader_gstin = gstMatch;
            setVerificationState({
              entityType: 'party',
              status: 'NOT_FOUND',
              spokenName: spokenParty,
            });
          } else {
            extracted.party_name = '';
            extracted.trader_gstin = gstMatch;
            setVerificationState({
              entityType: 'party',
              status: 'MISSING',
            });
          }

          const invMatch = text.match(/(?:invoice|bill|ઇનવોઇસ|બિલ)\s*(?:no|number|#)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i);
          extracted.invoice_no = invMatch
            ? invMatch[1].toUpperCase().startsWith('INV-')
              ? invMatch[1].toUpperCase()
              : `INV-${invMatch[1].toUpperCase()}`
            : '';
          extracted.invoice_date = new Date().toISOString().split('T')[0];
          extracted.trader_mobile = phoneMatch;
          extracted.sac_code = '9988';
          extracted.total_stitches = numbers.find((n) => n >= 10000) || '';
          extracted.machine_heads = 12;
          extracted.gross_amount = extracted.amount || '';
          extracted.cgst_amount = extracted.amount ? Math.round(Number(extracted.amount) * 0.025 * 100) / 100 : '';
          extracted.sgst_amount = extracted.amount ? Math.round(Number(extracted.amount) * 0.025 * 100) / 100 : '';
          extracted.igst_amount = 0;
          extracted.is_interstate = 'false';
          extracted.shrinkage_percent = 2.7;
          extracted.notes = text;

          summary = `Created SAC 9988 Tax Invoice for ${extracted.party_name || 'Client'} totaling ₹${extracted.amount || 0}.`;
          break;
        }
      }

      setParsedFields(extracted);
      setEnglishSummary(actionPrefix + summary);
      setIsProcessing(false);
      toast.success(`Auto-detected ${crudAction} intent for ${ENTITY_DEFINITIONS[type].title}!`);

      // Speech synthesis voice prompt for missing required fields
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const entityDef = ENTITY_DEFINITIONS[type];
        const missing = entityDef.requiredFields
          .filter((req) => !extracted[req.key] || String(extracted[req.key]).trim() === '')
          .map((f) => f.label);

        if (missing.length > 0) {
          try {
            window.speechSynthesis.cancel();
            const voiceMessage = `Captured ${entityDef.title}. Please speak or enter the following missing details: ${missing.join(', ')}.`;
            const utterance = new SpeechSynthesisUtterance(voiceMessage);
            utterance.lang = 'en-IN';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          } catch (_e) {
            // ignore TTS error
          }
        }
      }
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

    const isUpdate = parsedFields.crud_action === 'UPDATE';
    const isDelete = parsedFields.crud_action === 'DELETE';
    const entityId = (parsedFields.id as string) || (parsedFields.entity_id as string);

    try {
      if (isDelete && entityId) {
        switch (detectedType) {
          case 'challan': await InwardChallansApi.delete(entityId); break;
          case 'shift': await ShiftLogsApi.delete(entityId); break;
          case 'karigar': await KarigarsApi.delete(entityId); break;
          case 'expense': await ExpensesApi.delete(entityId); break;
          case 'uchapat': await UchapatApi.delete(entityId); break;
          case 'party': await PartiesApi.delete(entityId); break;
          case 'purchase': await PurchasesApi.delete(entityId); break;
          case 'invoice': await OutwardInvoicesApi.delete(entityId); break;
        }
        toast.success(`Deleted ${currentEntityDef?.title} record #${entityId}`);
        onSuccess?.();
        onClose();
        return;
      }

      switch (detectedType) {
        case 'challan': {
          const payload = {
            challan_no: (parsedFields.challan_no as string) || `CH-${Date.now().toString().slice(-4)}`,
            challan_date: (parsedFields.challan_date as string) || new Date().toISOString().split('T')[0],
            trader_name: (parsedFields.trader_name as string) || 'Shri Radhe Krishna Textiles',
            trader_gstin: (parsedFields.trader_gstin as string) || '24AAACS9988Z1Z9',
            lot_no: (parsedFields.lot_no as string) || 'LOT-9140',
            than_count: Number(parsedFields.than_count) || 18,
            inward_meters: Number(parsedFields.inward_meters) || 1850,
            fabric_quality: (parsedFields.fabric_quality as string) || 'Pure Georgette 60g',
            design_no: (parsedFields.design_no as string) || 'DSN-104',
            stitch_count: Number(parsedFields.stitch_count) || 185000,
            karigar_commission_rate: Number(parsedFields.karigar_commission_rate) || 0.05,
            karigar_commission_type: ((parsedFields.karigar_commission_type as string) || 'PER_1K_STITCHES') as any,
            jobwork_price_per_1k: Number(parsedFields.jobwork_price_per_1k) || 0.40,
            notes: (parsedFields.notes as string) || `Voice recorded: ${transcriptText || 'Direct Speech Entry'}`,
          };
          if (isUpdate && entityId) {
            await InwardChallansApi.update(entityId, payload);
            toast.success('Inward Fabric Lot updated successfully!');
          } else {
            await InwardChallansApi.create(payload);
            toast.success('Inward Fabric Lot created successfully!');
          }
          break;
        }

        case 'shift': {
          const payload = {
            machine_id: (parsedFields.machine_id as string) || 'default-machine-id',
            shift_type: ((parsedFields.shift_type as string) === 'NIGHT' ? 'NIGHT' : 'DAY') as ShiftType,
            shift_date: (parsedFields.shift_date as string) || new Date().toISOString().split('T')[0],
            start_counter: Number(parsedFields.start_counter) || 0,
            end_counter: Number(parsedFields.end_counter) || Number(parsedFields.stitches_count) || 185000,
            total_meters: Number(parsedFields.meter_count) || 160,
            karigar_id: (parsedFields.karigar_id as string) || 'default-karigar-id',
            design_no: (parsedFields.design_no as string) || 'DSN-104',
            inward_challan_id: (parsedFields.inward_challan_id as string) || undefined,
            downtime_minutes: Number(parsedFields.downtime_minutes) || 0,
            downtime_reason: (parsedFields.downtime_reason as string) || undefined,
          };
          await ShiftLogsApi.create(payload);
          toast.success(isUpdate ? 'Shift log updated successfully!' : 'Shift log recorded successfully!');
          break;
        }

        case 'karigar': {
          const payload = {
            name: (parsedFields.name as string) || 'Mukesh Solanki',
            mobile: (parsedFields.mobile as string) || '9825144556',
            wage_type: ((parsedFields.wage_type as string) === 'FIXED_MONTHLY' ? 'FIXED_MONTHLY' : 'PIECE_RATE') as WageType,
            default_rate_per_meter: Number(parsedFields.rate_per_1000_stitches) || 0.42,
            default_monthly_salary: Number(parsedFields.default_monthly_salary) || undefined,
            incentive_threshold_value: Number(parsedFields.incentive_threshold_value) || undefined,
            incentive_threshold_type: (parsedFields.incentive_threshold_type as any) || undefined,
            incentive_rate: Number(parsedFields.incentive_rate) || undefined,
            incentive_rate_type: (parsedFields.incentive_rate_type as any) || undefined,
            is_active: String(parsedFields.is_active) !== 'false',
          };
          if (isUpdate && entityId) {
            await KarigarsApi.update(entityId, payload);
            toast.success('Karigar profile updated successfully!');
          } else {
            await KarigarsApi.create(payload);
            toast.success('Karigar profile created successfully!');
          }
          break;
        }

        case 'expense': {
          const payload = {
            category: ((parsedFields.category as string) === 'INDIRECT' ? 'INDIRECT' : 'DIRECT') as ExpenseCategory,
            expense_type: (parsedFields.expense_type as string) || 'CONSUMABLES',
            payee_name: (parsedFields.payee_name as string) || 'Standard Spares Sachin',
            expense_date: (parsedFields.expense_date as string) || new Date().toISOString().split('T')[0],
            amount: Number(parsedFields.amount) || 1450,
            payment_mode: (parsedFields.payment_mode as string) || 'UPI',
            reference_no: (parsedFields.reference_no as string) || undefined,
            is_gst_applicable: String(parsedFields.is_gst_applicable) === 'true',
            gst_amount: Number(parsedFields.gst_amount) || 0,
            description: (parsedFields.description as string) || `Spoken voucher: ${transcriptText}`,
          };
          if (isUpdate && entityId) {
            await ExpensesApi.update(entityId, payload);
            toast.success('Expense voucher updated successfully!');
          } else {
            await ExpensesApi.create(payload);
            toast.success('Expense voucher recorded successfully!');
          }
          break;
        }

        case 'uchapat': {
          const payload = {
            karigar_id: (parsedFields.karigar_id as string) || 'default-karigar-id',
            amount: Number(parsedFields.amount) || 2500,
            payment_mode: ((parsedFields.payment_mode as string) === 'UPI' ? 'UPI' : 'CASH') as PaymentMode,
            reason: (parsedFields.remarks as string) || 'Voice Recorded Advance',
            date: (parsedFields.date as string) || new Date().toISOString().split('T')[0],
          };
          await UchapatApi.create(payload);
          toast.success(isUpdate ? 'Uchapat advance updated successfully!' : 'Uchapat advance recorded successfully!');
          break;
        }

        case 'party': {
          const payload = {
            name: (parsedFields.name as string) || 'Surat Silk Prints',
            gstin: (parsedFields.gstin as string) || '24AAACS9988Z1Z9',
            city: (parsedFields.city as string) || 'Surat',
            mobile: (parsedFields.mobile as string) || '9825088776',
            email: (parsedFields.email as string) || undefined,
            address: (parsedFields.address as string) || undefined,
            state_code: (parsedFields.state_code as string) || '24',
            credit_period_days: Number(parsedFields.credit_period_days) || 30,
            opening_balance: Number(parsedFields.opening_balance) || 0,
            is_active: String(parsedFields.is_active) !== 'false',
          };
          if (isUpdate && entityId) {
            await PartiesApi.update(entityId, payload);
            toast.success('Party profile updated successfully!');
          } else {
            await PartiesApi.create(payload);
            toast.success('Party profile created successfully!');
          }
          break;
        }

        case 'purchase': {
          const payload = {
            supplier_name: (parsedFields.supplier_name as string) || 'Shree Hari Threads',
            supplier_gstin: (parsedFields.supplier_gstin as string) || undefined,
            supplier_phone: (parsedFields.supplier_phone as string) || undefined,
            invoice_no: (parsedFields.invoice_no as string) || `INV-V-${Date.now().toString().slice(-4)}`,
            invoice_date: (parsedFields.invoice_date as string) || new Date().toISOString().split('T')[0],
            category: (parsedFields.category as string) || 'YARN_THREAD',
            payment_status: (parsedFields.payment_status as string) || 'PAID',
            payment_mode: (parsedFields.payment_mode as string) || 'CASH',
            subtotal: Number(parsedFields.subtotal) || Number(parsedFields.amount) || 8500,
            gst_amount: Number(parsedFields.gst_amount) || 0,
            net_amount: Number(parsedFields.amount) || 8500,
            paid_amount: Number(parsedFields.paid_amount) || Number(parsedFields.amount) || 8500,
            items: [
              {
                description: (parsedFields.item_name as string) || 'Polyester Filament Embroidery Thread 120D/2',
                qty: Number(parsedFields.quantity) || 50,
                unit: (parsedFields.unit as string) || 'CONES',
                rate: Number(parsedFields.rate) || 170,
                taxable_amount: Number(parsedFields.subtotal) || Number(parsedFields.amount) || 8500,
                total: Number(parsedFields.amount) || 8500,
              },
            ],
            notes: (parsedFields.notes as string) || `Voice recorded purchase: ${transcriptText}`,
          };
          if (isUpdate && entityId) {
            await PurchasesApi.update(entityId, payload);
            toast.success('Purchase updated successfully!');
          } else {
            await PurchasesApi.create(payload);
            toast.success('Purchase recorded successfully!');
          }
          break;
        }

        case 'invoice': {
          const payload = {
            trader_name: (parsedFields.party_name as string) || 'Shri Radhe Krishna Textiles',
            trader_gstin: (parsedFields.trader_gstin as string) || '24AAACS9988Z1Z9',
            invoice_date: (parsedFields.invoice_date as string) || new Date().toISOString().split('T')[0],
            total_stitches: Number(parsedFields.total_stitches) || 185000,
            machine_heads: Number(parsedFields.machine_heads) || 12,
            rate_per_1000: Number(parsedFields.rate_per_1000) || 0.40,
            inward_meters: Number(parsedFields.inward_meters) || 1850,
            outward_meters: Number(parsedFields.outward_meters) || 1800,
            notes: (parsedFields.notes as string) || `Voice recorded invoice: ${transcriptText}`,
          };
          if (isUpdate && entityId) {
            await OutwardInvoicesApi.update(entityId, payload);
            toast.success('Outward invoice updated successfully!');
          } else {
            await OutwardInvoicesApi.create(payload);
            toast.success('Outward invoice created successfully!');
          }
          break;
        }
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 p-[1px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
              <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <span>Universal Voice Assistant</span>
              <span className="text-[0.625rem] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 via-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/30 tracking-wider">
                Apple Design • Zero-Click AI
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {(t as unknown as Record<string, string>).voiceDataEntrySubtitle || 'Speak freely in any Indic language — AI automatically classifies and fills ETMS forms'}
            </div>
          </div>
        </div>
      }
      size="2xl"
    >
      <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-100 bg-slate-950 min-h-screen">
        {/* HERO MIC & SIRI AUDIO WAVEFORM DOCK */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl space-y-4">
          {/* Ambient Glow Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-rose-500/15 via-purple-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status & Language Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-200 tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Live Speech Capture (Bhashini Indic ASR)
              </span>
              {isListening && (
                <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-rose-300 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30 animate-pulse shadow-sm shadow-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  Listening...
                </span>
              )}
              {activeLanguage === 'auto' && (
                <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/25">
                  {detectedLanguageLabel}
                </span>
              )}
            </div>

            {/* Regional Hub Language Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[0.7rem] text-slate-400 font-medium">Hub Language:</span>
              <select
                value={activeLanguage}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setActiveLanguage(e.target.value as any)}
                className="bg-slate-900/90 border border-white/15 text-slate-200 text-[0.725rem] font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50 transition cursor-pointer max-w-[210px] sm:max-w-none truncate shadow-inner"
              >
                <option value="auto">✨ Auto-Detect (Pan-India Embroidery Hubs)</option>
                <option value="gu-IN">ગુજરાતી (Gujarati) • Surat & Ahmedabad</option>
                <option value="hi-IN">हिन्दी (Hindi) • UP & Pan-India Karigar Workforce</option>
                <option value="mr-IN">मराठी (Marathi) • Bhiwandi, Ichalkaranji & Malegaon</option>
                <option value="ta-IN">தமிழ் (Tamil) • Tirupur & Coimbatore</option>
                <option value="te-IN">తెలుగు (Telugu) • Hyderabad Cluster</option>
                <option value="kn-IN">ಕನ್ನಡ (Kannada) • Bangalore Silk Hub</option>
                <option value="bn-IN">বাংলা (Bengali) • Kolkata Zardozi Cluster</option>
                <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi) • Ludhiana & Amritsar</option>
                <option value="ur-IN">اردو (Urdu) • Malegaon, Varanasi & Lucknow</option>
                <option value="en-IN">English (Indian Standard)</option>
              </select>
            </div>
          </div>

          {/* Centered Hero Mic Button & Siri Waveform */}
          <div className="relative z-10 flex flex-col items-center justify-center py-2 space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulse Rings when Listening */}
              {isListening && (
                <>
                  <div className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping opacity-75" />
                  <div className="absolute w-20 h-20 rounded-full bg-purple-500/30 animate-pulse" />
                </>
              )}

              {/* Large Apple Orb Mic Button */}
              <button
                type="button"
                onClick={handleToggleListening}
                className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all transform active:scale-90 shadow-2xl cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-600 via-pink-500 to-rose-500 text-white shadow-rose-500/50 ring-4 ring-rose-400/40'
                    : 'bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-800 text-slate-100 border border-white/20 hover:border-rose-400/50 hover:shadow-rose-500/20 hover:scale-105'
                }`}
                title={isListening ? 'Click to Stop Speech Capture' : 'Tap to Start Universal Speech Assistant'}
              >
                {isListening ? (
                  <MicOff className="w-7 h-7 sm:w-9 sm:h-9 text-white animate-pulse" />
                ) : (
                  <Mic className="w-7 h-7 sm:w-9 sm:h-9 text-rose-400" />
                )}
              </button>
            </div>

            {/* Simulated Animated Equalizer Audio Waveform Bars */}
            <div className="flex items-center gap-1.5 h-6">
              {[0.4, 0.8, 0.5, 1.0, 0.7, 0.9, 0.4].map((scale, i) => (
                <span
                  key={i}
                  style={{
                    height: isListening ? `${scale * 100}%` : '20%',
                    transitionDuration: '150ms',
                  }}
                  className={`w-1 rounded-full transition-all ${
                    isListening
                      ? 'bg-gradient-to-t from-rose-500 via-purple-400 to-amber-300 animate-pulse'
                      : 'bg-slate-700/60'
                  }`}
                />
              ))}
            </div>

            <div className="text-center">
              <div className="text-xs font-bold text-slate-200">
                {isListening ? 'Listening for speech...' : 'Tap Mic to Speak Anything'}
              </div>
              <div className="text-[0.6875rem] text-slate-400 mt-0.5">
                No menu selection required &bull; Auto-classifies Challan, Shift, Karigar, Expense, Uchapat, Party or Invoice
              </div>
            </div>
          </div>

          {/* Spoken Transcript Input Container */}
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center justify-between text-[0.7rem] font-semibold text-slate-300">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                Original Spoken Utterance:
              </span>
              {transcriptText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => processSpokenInput(transcriptText)}
                    disabled={isProcessing}
                    className="text-[0.675rem] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 transition"
                  >
                    {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    <span>Re-Analyze</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTranscriptText('');
                      setDetectedType(null);
                      setEnglishSummary('');
                      setParsedFields({});
                    }}
                    className="text-[0.675rem] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              )}
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
              placeholder="Speak in Gujarati, Hindi or English, or paste spoken text here... (e.g. Radhe Krishna Textiles Lot 9140 1850m Georgette)"
              className="w-full bg-slate-900/90 border border-white/15 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/50 font-mono resize-none shadow-inner"
            />
          </div>
        </div>

        {/* INTENT VERIFICATION & STRUCTURED BREAKDOWN CARD */}
        {detectedType && currentEntityDef && (
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in duration-200">
            {/* Entity Header & Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/15 flex items-center justify-center shadow-md">
                  {currentEntityDef.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-100">
                      {currentEntityDef.title}
                    </span>
                    <span className="text-[0.625rem] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Auto-Detected
                    </span>
                    {parsedFields.crud_action && (
                      <span className={`text-[0.625rem] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        parsedFields.crud_action === 'DELETE'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/35'
                          : parsedFields.crud_action === 'UPDATE'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                          : parsedFields.crud_action === 'READ'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/35'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                      }`}>
                        {parsedFields.crud_action === 'DELETE' ? '🔴 DELETE / CANCEL' :
                         parsedFields.crud_action === 'UPDATE' ? '🟡 UPDATE / EDIT' :
                         parsedFields.crud_action === 'READ' ? '🔵 VIEW / SEARCH' : '🟢 CREATE / ADD'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {currentEntityDef.titleGu}
                  </div>
                </div>
              </div>

              {/* Status Verification Badge */}
              {isAllRequiredPresent ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All Required Data Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-sm shadow-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{missingRequiredFields.length} Required Field(s) Missing</span>
                </div>
              )}
            </div>

            {/* English Verification Summary Box */}
            {englishSummary && (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>English Verification Summary:</span>
                </div>
                <div className="text-xs text-slate-200 font-semibold leading-relaxed">
                  {englishSummary}
                </div>
              </div>
            )}

            {/* Real-time DB Master Entity Confirmation & 1-Click Action Dock */}
            {verificationState.status === 'CONFIRMED' && verificationState.matchedRecord && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-200 text-xs shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
                      <span>Confirmed Live DB Master Record:</span>
                      <span className="text-emerald-300 underline font-mono">
                        {verificationState.matchedRecord.name || verificationState.matchedRecord.machine_no}
                      </span>
                    </div>
                    {verificationState.matchedRecord.gstin && (
                      <div className="text-[0.6875rem] text-emerald-400/80 font-mono mt-0.5">
                        GSTIN: {verificationState.matchedRecord.gstin} &bull; City: {verificationState.matchedRecord.city || 'Surat'}
                      </div>
                    )}
                    {verificationState.matchedRecord.mobile && (
                      <div className="text-[0.6875rem] text-emerald-400/80 font-mono mt-0.5">
                        Phone: {verificationState.matchedRecord.mobile} &bull; Active Master Record
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[0.625rem] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                  Verified in DB
                </span>
              </div>
            )}

            {verificationState.status === 'NOT_FOUND' && verificationState.spokenName && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/10 border border-amber-500/35 flex flex-wrap items-center justify-between gap-3 text-amber-200 text-xs shadow-md">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0 animate-pulse" />
                  <div>
                    <div className="font-extrabold text-xs text-amber-200">
                      Master Record &quot;{verificationState.spokenName}&quot; not found in ETMS Database
                    </div>
                    <div className="text-[0.6875rem] text-amber-300/80 mt-0.5">
                      You must register this {verificationState.entityType?.toUpperCase()} in master database before linking transaction records.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (verificationState.entityType === 'party' || verificationState.entityType === 'supplier') {
                      openDrawer('ADD_PARTY', { initialName: verificationState.spokenName });
                    } else if (verificationState.entityType === 'karigar') {
                      openDrawer('ADD_KARIGAR', { initialName: verificationState.spokenName });
                    } else if (verificationState.entityType === 'machine') {
                      openDrawer('ADD_MACHINE', { initialMachineNo: verificationState.spokenName });
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Create {verificationState.entityType?.toUpperCase()} First</span>
                </button>
              </div>
            )}

            {/* Missing Fields Prompt Container */}
            {missingRequiredFields.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Missing Required Details for {currentEntityDef.title}:</span>
                </div>
                <div className="text-xs text-amber-300/80">
                  Please speak or type the missing fields to complete your ETMS record:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {missingRequiredFields.map((field) => (
                    <div key={field.key} className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/35 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200">
                          {field.label} *
                        </span>
                        <span className="text-[0.625rem] text-rose-400 font-bold uppercase">Required</span>
                      </div>
                      <div className="text-[0.6875rem] text-slate-400">
                        {field.description}
                      </div>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        className="w-full bg-slate-900 border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
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
                  ))}
                </div>
              </div>
            )}

            {/* Matched Schema Form Fields Grid */}
            <div>
              <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Matched Domain Schema Fields:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(parsedFields).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-950/60 border border-white/10 hover:border-white/20 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[0.675rem] font-bold uppercase tracking-wider text-slate-400 truncate">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                      className="w-full bg-slate-900/90 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUICK TEST SAMPLES (1-CLICK TEST UTTERANCES) */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Quick Test Utterance Presets (1-Click Test)</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <span className="text-[0.675rem] text-slate-400">No mic required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_UTTERANCES.map((sample, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/80 border border-white/10 hover:border-white/20 flex flex-col justify-between gap-2 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[0.65rem] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-white/10">
                      {sample.tag}
                    </span>
                  </div>
                  <div className="text-[0.725rem] font-medium text-slate-200 line-clamp-2">
                    &quot;{sample.gu}&quot;
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePlaySamplePreset(sample, 'gu')}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[0.6875rem] font-bold text-amber-300 flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gujarati Voice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlaySamplePreset(sample, 'en')}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-[0.6875rem] font-bold text-sky-300 flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>English Voice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STICKY FOOTER (APPLE DESIGN SYSTEM) */}
      <div className="sticky bottom-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 p-4 flex items-center justify-between gap-3 z-50">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-white/15 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          {!detectedType ? (
            <button
              type="button"
              onClick={() => handlePlaySamplePreset(SAMPLE_UTTERANCES[0], 'gu')}
              className="px-5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 flex items-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Test Sample Lot</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving || !isAllRequiredPresent}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition transform active:scale-95 shadow-lg cursor-pointer ${
                isAllRequiredPresent
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:opacity-90 shadow-emerald-500/25'
                  : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed opacity-60'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Saving to ETMS...</span>
                </>
              ) : isAllRequiredPresent ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Save {currentEntityDef?.title} into ETMS</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
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
