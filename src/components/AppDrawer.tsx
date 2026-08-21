'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { KarigarsApi, KarigarApiItem, CreateKarigarDto } from '@/lib/api/karigars';
import { MachinesApi, MachineApiItem, CreateMachineDto } from '@/lib/api/machines';
import { UchapatApi, PaymentMode } from '@/lib/api/uchapat';
import { MunimApi } from '@/lib/api/munim';
import { WageHisabApi } from '@/lib/api/wage-hisab';
import { ShiftLogsApi, CreateShiftLogDto } from '@/lib/api/shift-logs';
import { InwardChallansApi, InwardChallanApiItem, CreateInwardChallanDto } from '@/lib/api/challans';
import { OutwardInvoicesApi } from '@/lib/api/invoices';
import { formatNumber, formatINR } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Users,
  Cpu,
  CreditCard,
  Building2,
  Calculator,
  Clock,
  Truck,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. Karigar Drawer Form (Add / Edit)                                       */
/* -------------------------------------------------------------------------- */
const KarigarDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const editingItem = instance.payload?.karigar as KarigarApiItem | undefined;

  const [name, setName] = useState(editingItem?.name || '');
  const [mobile, setMobile] = useState(editingItem?.mobile || '');
  const [wageType, setWageType] = useState<'PIECE_RATE' | 'FIXED_MONTHLY'>(editingItem?.wage_type || 'PIECE_RATE');
  const [defaultRatePerMeter, setDefaultRatePerMeter] = useState(editingItem?.default_rate_per_meter || 0.18);
  const [defaultMonthlySalary, setDefaultMonthlySalary] = useState(editingItem?.default_monthly_salary || 18000);
  const [isActive, setIsActive] = useState(editingItem?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateKarigarDto = {
        name,
        mobile,
        wage_type: wageType,
        default_rate_per_meter: wageType === 'PIECE_RATE' ? Number(defaultRatePerMeter) : undefined,
        default_monthly_salary: wageType === 'FIXED_MONTHLY' ? Number(defaultMonthlySalary) : undefined,
        is_active: isActive,
      };

      let result;
      if (editingItem) {
        result = await KarigarsApi.update(editingItem.id, payload);
        toast.success(`Karigar ${name} updated successfully`);
      } else {
        result = await KarigarsApi.create(payload);
        toast.success(`Karigar ${name} registered successfully`);
      }

      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to save karigar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={editingItem ? 'Edit Karigar / Operator (કારીગર સુધારો)' : 'Add New Karigar / Operator (નવો કારીગર ઉમેરો)'}
      subtitle={editingItem ? 'કારીગર વિગતો અને વેતન દરો અપડેટ કરો' : 'કારીગર મૂળભૂત માહિતી અને પગાર/મજૂરી દરો'}
      icon={<Users className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`karigar-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Karigar'}
          </button>
        </div>
      }
    >
      <form id={`karigar-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Full Name (કારીગરનું નામ) *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ramesh Patel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Mobile Number (મોબાઇલ નંબર) *</label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            placeholder="10-digit mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Wage Model (મજૂરી પ્રકાર) *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setWageType('PIECE_RATE')}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                wageType === 'PIECE_RATE'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Piece Rate (ટાંકા/મીટર દીઠ)
            </button>
            <button
              type="button"
              onClick={() => setWageType('FIXED_MONTHLY')}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                wageType === 'FIXED_MONTHLY'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Fixed Monthly (માસિક પગાર)
            </button>
          </div>
        </div>

        {wageType === 'PIECE_RATE' ? (
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Default Rate Per Meter (₹ / મીટર) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={defaultRatePerMeter}
              onChange={(e) => setDefaultRatePerMeter(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Monthly Salary (માસિક ફિક્સ પગાર ₹) *</label>
            <input
              type="number"
              required
              value={defaultMonthlySalary}
              onChange={(e) => setDefaultMonthlySalary(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id={`active-karigar-${instance.id}`}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-slate-900 border-slate-300 rounded"
          />
          <label htmlFor={`active-karigar-${instance.id}`} className="text-xs text-slate-700 font-medium cursor-pointer">
            Active Employee (ચાલુ કારીગર)
          </label>
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Machine Drawer Form (Add / Edit)                                       */
/* -------------------------------------------------------------------------- */
const MachineDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const editingMachine = instance.payload?.machine as MachineApiItem | undefined;

  const [machineNo, setMachineNo] = useState(editingMachine?.machine_no || '');
  const [headCount, setHeadCount] = useState<24 | 32 | 44 | 66>(editingMachine?.head_count || 32);
  const [rpm, setRpm] = useState(editingMachine?.rpm || 850);
  const [makeModel, setMakeModel] = useState(editingMachine?.make_model || 'Surat High-Speed Tajima Type');
  const [isActive, setIsActive] = useState(editingMachine?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateMachineDto = {
        machine_no: machineNo,
        head_count: Number(headCount) as 24 | 32 | 44 | 66,
        rpm: Number(rpm),
        make_model: makeModel,
        is_active: isActive,
      };

      let result;
      if (editingMachine) {
        result = await MachinesApi.update(editingMachine.id, payload);
        toast.success(`Machine #${machineNo} updated`);
      } else {
        result = await MachinesApi.create(payload);
        toast.success(`Machine #${machineNo} added to fleet`);
      }

      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to save machine: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={editingMachine ? 'Edit Embroidery Machine' : 'Configure New Embroidery Machine'}
      subtitle="મશીન નંબર, હેડ ક્ષમતા અને સ્પીડ કન્ફિગરેશન"
      icon={<Cpu className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`machine-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? 'Saving...' : editingMachine ? 'Save Changes' : 'Add Machine'}
          </button>
        </div>
      }
    >
      <form id={`machine-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Machine Identifier / No (મશીન નંબર) *</label>
          <input
            type="text"
            required
            placeholder="e.g. M-01 or 12"
            value={machineNo}
            onChange={(e) => setMachineNo(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Head Count (હેડ ક્ષમતા) *</label>
          <select
            value={headCount}
            onChange={(e) => setHeadCount(Number(e.target.value) as 24 | 32 | 44 | 66)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          >
            <option value={24}>24 Heads (નાનું મશીન)</option>
            <option value={32}>32 Heads (સ્ટાન્ડર્ડ સુરત સાઈઝ)</option>
            <option value={44}>44 Heads (મોટું મલ્ટી-હેડ)</option>
            <option value={66}>66 Heads (જમ્બો હાઈ-સ્પીડ)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Rated RPM (ઝડપ / ગતિ) *</label>
          <input
            type="number"
            required
            min="400"
            max="1200"
            value={rpm}
            onChange={(e) => setRpm(parseInt(e.target.value, 10) || 850)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Manufacturer / Model Make</label>
          <input
            type="text"
            value={makeModel}
            onChange={(e) => setMakeModel(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id={`active-machine-${instance.id}`}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-slate-900 border-slate-300 rounded"
          />
          <label htmlFor={`active-machine-${instance.id}`} className="text-xs text-slate-700 font-medium cursor-pointer">
            Machine is operational (ચાલુ સ્થિતિમાં)
          </label>
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Uchapat Drawer Form (Record Cash/UPI Advance)                           */
/* -------------------------------------------------------------------------- */
const UchapatDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState(instance.payload?.karigarId || '');
  const [amount, setAmount] = useState<number>(2000);
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Household / Ration Advance');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    KarigarsApi.getAll()
      .then((data) => {
        setKarigars(data);
        if (!selectedKarigarId && data.length > 0) {
          setSelectedKarigarId(data[0].id);
        }
      })
      .catch((e) => console.warn('Failed to load karigars in uchapat drawer:', e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKarigarId || amount <= 0) {
      toast.error('Please select karigar and specify valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const result = await UchapatApi.create({
        karigar_id: selectedKarigarId,
        amount: Number(amount),
        date: advanceDate,
        reason,
        payment_mode: paymentMode,
      });

      toast.success(`Advance of ₹${amount} recorded`);
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to log advance: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedKarigar = karigars.find((k) => k.id === selectedKarigarId);

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Log Cash / UPI Advance (ઉપાડ આપો)"
      subtitle="કારીગરને રોકડ અથવા UPI દ્વારા આપેલ એડવાન્સ નોંધ"
      icon={<CreditCard className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`uchapat-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? 'Recording...' : 'Record Advance'}
          </button>
        </div>
      }
    >
      <form id={`uchapat-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Select Beneficiary Karigar (કારીગર) *</label>
          <select
            value={selectedKarigarId}
            onChange={(e) => setSelectedKarigarId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          >
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.mobile})
              </option>
            ))}
          </select>
        </div>

        {selectedKarigar && (
          <div className="p-3 bg-slate-100 rounded-lg text-2xs text-slate-600 flex justify-between">
            <span>Model: <strong>{selectedKarigar.wage_type}</strong></span>
            <span>Mobile: <strong>{selectedKarigar.mobile}</strong></span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Advance Amount (ઉપાડ રકમ ₹) *</label>
          <input
            type="number"
            min="100"
            step="100"
            required
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Date of Disbursal (તારીખ) *</label>
          <input
            type="date"
            required
            value={advanceDate}
            onChange={(e) => setAdvanceDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Payment Mode (ચુકવણી પદ્ધતિ)</label>
          <div className="grid grid-cols-3 gap-2">
            {(['CASH', 'UPI', 'BANK_TRANSFER'] as PaymentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`py-2 rounded-lg border text-xs font-semibold transition ${
                  paymentMode === mode
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {mode === 'CASH' ? 'Cash (રોકડ)' : mode === 'UPI' ? 'UPI / GPay' : 'Bank'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Remarks / Reason (કારણ)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Invite Company Drawer Form (Munim Dashboard)                            */
/* -------------------------------------------------------------------------- */
const InviteCompanyDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [inviteGstin, setInviteGstin] = useState('');
  const [inviteMobile, setInviteMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteGstin || !inviteMobile) {
      toast.error('GSTIN and Mobile number are required');
      return;
    }
    setSubmitting(true);
    try {
      const result = await MunimApi.munimInviteCompany({
        gstin: inviteGstin.toUpperCase(),
        mobile: inviteMobile,
      });
      toast.success('Company access request sent');
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to send request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Request Company Access (ટેનન્ટ જોડાણ)"
      subtitle="અન્ય એમ્બ્રોઇડરી એકમનું જીએસટી નંબર અને ઓનર મોબાઇલ દાખલ કરો"
      icon={<Building2 className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`invite-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      }
    >
      <form id={`invite-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Embroidery Firm GSTIN *</label>
          <input
            type="text"
            required
            pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
            placeholder="24ABCDE1234F1Z5"
            value={inviteGstin}
            onChange={(e) => setInviteGstin(e.target.value.toUpperCase())}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 uppercase"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Registered Owner Mobile *</label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            placeholder="10-digit mobile"
            value={inviteMobile}
            onChange={(e) => setInviteMobile(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
          />
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. Hisab Drawer Form (Compute Fortnight Settlement)                        */
/* -------------------------------------------------------------------------- */
const HisabDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState(instance.payload?.karigarId || '');
  const [startDate, setStartDate] = useState(instance.payload?.startDate || '2026-08-01');
  const [endDate, setEndDate] = useState(instance.payload?.endDate || '2026-08-15');
  const [deductions, setDeductions] = useState<number>(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    KarigarsApi.getAll()
      .then((data) => {
        setKarigars(data);
        if (!selectedKarigarId && data.length > 0) {
          setSelectedKarigarId(data[0].id);
        }
      })
      .catch((e) => console.warn('Failed to load karigars in hisab drawer:', e));
  }, []);

  const handleCalculate = async () => {
    if (!selectedKarigarId) {
      toast.error('Please select a karigar');
      return;
    }
    setCalculating(true);
    try {
      const result = await WageHisabApi.calculate({
        karigar_id: selectedKarigarId,
        startDate,
        endDate,
        deductions: deductions > 0 ? deductions : undefined,
        deduction_reason: deductions > 0 ? deductionReason : undefined,
      });

      toast.success('Hisab computed successfully');
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to compute hisab: ' + err.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Compute Fortnight Hisab (૧૫ દિવસનો હિસાબ)"
      subtitle="કારીગર પગાર અને ઉપાડ ગણતરી"
      icon={<Calculator className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCalculate}
            disabled={calculating}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Calculator className="w-4 h-4" />
            <span>{calculating ? 'Calculating...' : 'Compute Hisab'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Select Karigar *</label>
          <select
            value={selectedKarigarId}
            onChange={(e) => setSelectedKarigarId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          >
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.wage_type === 'PIECE_RATE' ? 'Piece Rate' : 'Fixed Monthly'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Custom Deductions (દંડ / કાપ ₹)</label>
          <input
            type="number"
            min="0"
            value={deductions}
            onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
          />
        </div>

        {deductions > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Deduction Reason</label>
            <input
              type="text"
              placeholder="e.g. Broken Needle Penalty, Cloth Damage"
              value={deductionReason}
              onChange={(e) => setDeductionReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>
        )}
      </div>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. Shift Drawer Form (Log Production Shift)                                */
/* -------------------------------------------------------------------------- */
const ShiftDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);

  const [machineId, setMachineId] = useState('');
  const [shiftType, setShiftType] = useState<'DAY' | 'NIGHT'>('DAY');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardChallanId, setInwardChallanId] = useState('');
  const [designNo, setDesignNo] = useState('DSG-108-ZARI');
  const [startCounter, setStartCounter] = useState<number>(100000);
  const [endCounter, setEndCounter] = useState<number>(484000);
  const [totalMeters, setTotalMeters] = useState<number>(450);
  const [karigarId, setKarigarId] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0);
  const [downtimeReason, setDowntimeReason] = useState('None');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([MachinesApi.getAll(), KarigarsApi.getAll(), InwardChallansApi.getAll()])
      .then(([mList, kList, cList]) => {
        setMachines(mList);
        setKarigars(kList);
        setChallans(cList);
        if (mList.length > 0) setMachineId(mList[0].id);
        if (kList.length > 0) setKarigarId(kList[0].id);
      })
      .catch((e) => console.warn('Failed to load masters in shift drawer:', e));
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !karigarId) {
      toast.error('Machine and Karigar are required');
      return;
    }
    if (endCounter <= startCounter) {
      toast.error('End counter must be greater than start counter');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateShiftLogDto = {
        machine_id: machineId,
        shift_type: shiftType,
        shift_date: shiftDate,
        inward_challan_id: inwardChallanId || undefined,
        design_no: designNo,
        start_counter: Number(startCounter),
        end_counter: Number(endCounter),
        total_meters: Number(totalMeters),
        karigar_id: karigarId,
        downtime_minutes: Number(downtimeMinutes),
        downtime_reason: downtimeMinutes > 0 ? downtimeReason : undefined,
      };

      const result = await ShiftLogsApi.create(payload);
      toast.success('Shift log registered');
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to log shift: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Log Production Shift (કાઉન્ટર નોંધ)"
      subtitle="દૈનિક શિફ્ટ પ્રોડક્શન અને ડાઉનટાઇમ એન્ટ્રી"
      icon={<Clock className="w-5 h-5 text-slate-700" />}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`shift-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? 'Registering...' : 'Save Shift Log'}
          </button>
        </div>
      }
    >
      <form id={`shift-form-${instance.id}`} onSubmit={handleCreateShift} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-700 font-medium">Select Machine (મશીન) *</label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  Machine #{m.machine_no} ({m.head_count} Heads • {m.rpm || 850} RPM)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Shift Type *</label>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setShiftType('DAY')}
                className={`flex-1 py-1 text-2xs font-bold rounded flex items-center justify-center gap-1 transition ${
                  shiftType === 'DAY' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>DAY</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftType('NIGHT')}
                className={`flex-1 py-1 text-2xs font-bold rounded flex items-center justify-center gap-1 transition ${
                  shiftType === 'NIGHT' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>NIGHT</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Shift Date *</label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Assigned Karigar (કારીગર) *</label>
            <select
              value={karigarId}
              onChange={(e) => setKarigarId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
            >
              {karigars.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.mobile})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Linked Fabric Inward Lot</label>
            <select
              value={inwardChallanId}
              onChange={(e) => setInwardChallanId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
            >
              <option value="">-- Optional General Shift --</option>
              {challans.map((c) => (
                <option key={c.id} value={c.id}>
                  Lot #{c.lot_no} • {c.trader_name} ({c.fabric_quality})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Embroidery Design Code</label>
            <input
              type="text"
              value={designNo}
              onChange={(e) => setDesignNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
            Stitch Counter Telemetry (ટાંકા મીટર કાઉન્ટર)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Start Counter *</label>
              <input
                type="number"
                required
                min="0"
                value={startCounter}
                onChange={(e) => setStartCounter(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">End Counter *</label>
              <input
                type="number"
                required
                min="0"
                value={endCounter}
                onChange={(e) => setEndCounter(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Total Meters Output (m) *</label>
              <input
                type="number"
                required
                min="1"
                value={totalMeters}
                onChange={(e) => setTotalMeters(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-2xs pt-1 border-t border-slate-200 font-mono">
            <span className="text-slate-500">Calculated Net Stitches:</span>
            <span className="font-extrabold text-slate-900">{formatNumber(Math.max(0, endCounter - startCounter))} stitches</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Downtime Minutes (બંધ સમય)</label>
            <input
              type="number"
              min="0"
              value={downtimeMinutes}
              onChange={(e) => setDowntimeMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-rose-600 font-bold"
            />
          </div>

          {downtimeMinutes > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Downtime Reason (કારણ)</label>
              <select
                value={downtimeReason}
                onChange={(e) => setDowntimeReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="Thread Breakage (દોરા તૂટવા)">Thread Breakage (દોરા તૂટવા)</option>
                <option value="Needle Replacement (સોય બદલવી)">Needle Replacement (સોય બદલવી)</option>
                <option value="Bobbin / Zari Refill (બોબીન ભરાવવું)">Bobbin / Zari Refill (બોબીન ભરાવવું)</option>
                <option value="Power Outage / GIDC Load Shedding (લાઇટ જવી)">Power Outage (લાઇટ જવી)</option>
                <option value="Mechanical Jam / Oil Issue (મિકેનિકલ ખામી)">Mechanical Jam (મિકેનિકલ ખામી)</option>
              </select>
            </div>
          )}
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 7. Challan Drawer Form (Add Inward Lot)                                    */
/* -------------------------------------------------------------------------- */
const ChallanDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [traderName, setTraderName] = useState('Ambaji Fashion Surat');
  const [traderGstin, setTraderGstin] = useState('24BBCDE5678G1Z3');
  const [lotNo, setLotNo] = useState(`LOT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [thanCount, setThanCount] = useState<number>(24);
  const [inwardMeters, setInwardMeters] = useState<number>(1200);
  const [fabricQuality, setFabricQuality] = useState('Georgette 60g / Heavy Foil');
  const [designNo, setDesignNo] = useState('DSG-108-ZARI');
  const [notes, setNotes] = useState('Delivered via Sachin GIDC tempo transport');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim() || !lotNo.trim()) {
      toast.error('Trader Name and Lot Number are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateInwardChallanDto = {
        trader_name: traderName,
        trader_gstin: traderGstin,
        lot_no: lotNo,
        than_count: Number(thanCount),
        inward_meters: Number(inwardMeters),
        fabric_quality: fabricQuality,
        design_no: designNo,
        notes,
      };

      const result = await InwardChallansApi.create(payload);
      toast.success(`Inward Lot ${lotNo} registered successfully`);
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to create challan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Register Inward Fabric Lot (આવક ચલણ)"
      subtitle="સુરત વેપારી પાસેથી મળેલ કાચું કાપડ ચલણ એન્ટ્રી"
      icon={<Truck className="w-5 h-5 text-slate-700" />}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`challan-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? 'Registering...' : 'Save Inward Lot'}
          </button>
        </div>
      }
    >
      <form id={`challan-form-${instance.id}`} onSubmit={handleCreateChallan} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Trader Firm Name (વેપારીનું નામ) *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ambaji Fashion Surat"
            value={traderName}
            onChange={(e) => setTraderName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Trader GSTIN</label>
            <input
              type="text"
              placeholder="24BBCDE5678G1Z3"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Lot Number / Batch ID *</label>
            <input
              type="text"
              required
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Than Count (તાકા) *</label>
            <input
              type="number"
              required
              min="1"
              value={thanCount}
              onChange={(e) => setThanCount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Inward Meters Length (m) *</label>
            <input
              type="number"
              required
              min="1"
              value={inwardMeters}
              onChange={(e) => setInwardMeters(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Fabric Quality Specification *</label>
            <input
              type="text"
              required
              placeholder="e.g. Georgette 60g / Heavy Foil"
              value={fabricQuality}
              onChange={(e) => setFabricQuality(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Design / Pattern Code</label>
            <input
              type="text"
              placeholder="DSG-108-ZARI"
              value={designNo}
              onChange={(e) => setDesignNo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Transport / Delivery Notes</label>
          <textarea
            rows={2}
            placeholder="e.g. Delivered via Sachin GIDC tempo transport"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
          />
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 8. Invoice Drawer Form (Create SAC 9988 Bill)                              */
/* -------------------------------------------------------------------------- */
const InvoiceDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [traderName, setTraderName] = useState('Ambaji Fashion Surat');
  const [traderGstin, setTraderGstin] = useState('24BBCDE5678G1Z3');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardChallanId, setInwardChallanId] = useState('');
  const [billedMeters, setBilledMeters] = useState<number>(1200);
  const [ratePerMeter, setRatePerMeter] = useState<number>(18.5);
  const [taxRate] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    InwardChallansApi.getAll()
      .then((data) => {
        setChallans(data);
        if (data.length > 0) setInwardChallanId(data[0].id);
      })
      .catch((e) => console.warn('Failed to load challans in invoice drawer:', e));
  }, []);

  const taxableAmount = Math.round(Number(billedMeters) * Number(ratePerMeter));
  const gstAmount = Math.round(taxableAmount * (taxRate / 100));
  const netAmount = taxableAmount + gstAmount;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim()) {
      toast.error('Trader name is required');
      return;
    }
    setSubmitting(true);
    try {
      const result = await OutwardInvoicesApi.create({
        trader_name: traderName,
        trader_gstin: traderGstin,
        invoice_date: invoiceDate,
        inward_challan_id: inwardChallanId || undefined,
        total_stitches: Math.round(Number(billedMeters) * 1000),
        machine_heads: 32,
        rate_per_1000: Number(ratePerMeter),
        inward_meters: Number(billedMeters),
        outward_meters: Number(billedMeters),
      });

      toast.success('SAC 9988 Invoice generated successfully!');
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to create invoice: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title="Create SAC 9988 Outward Bill (ઇનવોઇસ બનાવો)"
      subtitle="સુરત એમ્બ્રોઇડરી જ્હોબવર્ક 5% GST ટેક્સ બિલ"
      icon={<FileText className="w-5 h-5 text-slate-700" />}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`invoice-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      }
    >
      <form id={`invoice-form-${instance.id}`} onSubmit={handleCreateInvoice} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Billed Trader / Party Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ambaji Fashion Surat"
            value={traderName}
            onChange={(e) => setTraderName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Trader GSTIN</label>
            <input
              type="text"
              placeholder="24BBCDE5678G1Z3"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Invoice Issue Date *</label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Link Inward Fabric Lot (Challan)</label>
          <select
            value={inwardChallanId}
            onChange={(e) => setInwardChallanId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
          >
            <option value="">-- Direct SAC 9988 Billing --</option>
            {challans.map((c) => (
              <option key={c.id} value={c.id}>
                Lot #{c.lot_no} • {c.trader_name} ({c.inward_meters}m {c.fabric_quality})
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
            SAC 9988 Jobwork Calculation Breakdown
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Billed Quantity (Meters) *</label>
              <input
                type="number"
                required
                min="1"
                value={billedMeters}
                onChange={(e) => setBilledMeters(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">Stitch Rate (₹ / Meter) *</label>
              <input
                type="number"
                required
                step="0.1"
                min="0.1"
                value={ratePerMeter}
                onChange={(e) => setRatePerMeter(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Taxable Value (SAC 9988):</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(taxableAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>GST (CGST 2.5% + SGST 2.5%):</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(gstAmount)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>NET PAYABLE INVOICE TOTAL:</span>
              <span className="font-mono text-emerald-700 text-sm">{formatINR(netAmount)}</span>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* Master AppDrawer Renderer Component                                        */
/* -------------------------------------------------------------------------- */
export const AppDrawer: React.FC = () => {
  const { drawerStack } = useAppDrawer();

  if (drawerStack.length === 0) return null;

  return (
    <>
      {drawerStack.map((instance, index) => {
        switch (instance.type) {
          case 'ADD_KARIGAR':
          case 'EDIT_KARIGAR':
            return <KarigarDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'ADD_MACHINE':
          case 'EDIT_MACHINE':
            return <MachineDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'ADD_UCHAPAT':
            return <UchapatDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'INVITE_COMPANY':
            return <InviteCompanyDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'COMPUTE_HISAB':
            return <HisabDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'LOG_SHIFT':
            return <ShiftDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'ADD_CHALLAN':
            return <ChallanDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'CREATE_INVOICE':
            return <InvoiceDrawerForm key={instance.id} instance={instance} level={index} />;

          default:
            return null;
        }
      })}
    </>
  );
};
