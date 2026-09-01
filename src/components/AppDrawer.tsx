'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { KarigarsApi, KarigarApiItem, CreateKarigarDto, WageType } from '@/lib/api/karigars';
import { MachinesApi, MachineApiItem, CreateMachineDto } from '@/lib/api/machines';
import { UchapatApi, PaymentMode } from '@/lib/api/uchapat';
import { MunimApi } from '@/lib/api/munim';
import { WageHisabApi } from '@/lib/api/wage-hisab';
import { ShiftLogsApi, CreateShiftLogDto } from '@/lib/api/shift-logs';
import { InwardChallansApi, InwardChallanApiItem, CreateInwardChallanDto, InwardChallanDesignItem, ActivePendingLotItem, PendingDesignItem } from '@/lib/api/challans';
import { OutwardInvoicesApi } from '@/lib/api/invoices';
import { PartiesApi, PartyApiItem, CreatePartyDto } from '@/lib/api/parties';
import { formatNumber, formatINR } from '@/lib/utils';
import { PartyPicker } from '@/components/molecules/PartyPicker';
import { useI18n } from '@/lib/i18n';
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
  Plus,
  Briefcase,
  X,
  Trash2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. Karigar Drawer Form (Add / Edit)                                       */
/* -------------------------------------------------------------------------- */
const KarigarDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const editingItem = instance.payload?.karigar as KarigarApiItem | undefined;

  const [name, setName] = useState(editingItem?.name || '');
  const [mobile, setMobile] = useState(editingItem?.mobile || '');
  const [wageType, setWageType] = useState<WageType>(editingItem?.wage_type || 'PIECE_RATE');
  const [defaultRatePerMeter, setDefaultRatePerMeter] = useState(editingItem?.default_rate_per_meter || 0.18);
  const [defaultMonthlySalary, setDefaultMonthlySalary] = useState(editingItem?.default_monthly_salary || 18000);
  const [incentiveThresholdValue, setIncentiveThresholdValue] = useState(editingItem?.incentive_threshold_value || 100000);
  const [incentiveThresholdType, setIncentiveThresholdType] = useState<'STITCHES' | 'PIECES' | 'METERS'>(editingItem?.incentive_threshold_type || 'STITCHES');
  const [incentiveRate, setIncentiveRate] = useState(editingItem?.incentive_rate || 0.25);
  const [incentiveRateType, setIncentiveRateType] = useState<'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER'>(editingItem?.incentive_rate_type || 'PER_1K_STITCHES');
  const [isActive, setIsActive] = useState(editingItem?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const [mobileError, setMobileError] = useState('');

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    if (digits.length === 0) {
      setMobileError('');
    } else if (digits.length < 10) {
      setMobileError('Must be 10 digits');
    } else if (!/^[6-9]\d{9}$/.test(digits)) {
      setMobileError('Must start with 6, 7, 8, or 9');
    } else {
      setMobileError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateKarigarDto = {
        name,
        mobile,
        wage_type: wageType,
        default_rate_per_meter: wageType === 'PIECE_RATE' ? Number(defaultRatePerMeter) : undefined,
        default_monthly_salary: wageType === 'FIXED_MONTHLY' || wageType === 'FIXED_PLUS_INCENTIVE' ? Number(defaultMonthlySalary) : undefined,
        incentive_threshold_value: wageType === 'FIXED_PLUS_INCENTIVE' ? Number(incentiveThresholdValue) : undefined,
        incentive_threshold_type: wageType === 'FIXED_PLUS_INCENTIVE' ? incentiveThresholdType : undefined,
        incentive_rate: wageType === 'FIXED_PLUS_INCENTIVE' ? Number(incentiveRate) : undefined,
        incentive_rate_type: wageType === 'FIXED_PLUS_INCENTIVE' ? incentiveRateType : undefined,
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
      title={editingItem ? t.karigar_drawerEditTitle : t.karigar_drawerAddTitle}
      subtitle={editingItem ? t.karigar_drawerEditSubtitle : t.karigar_drawerAddSubtitle}
      icon={<Users className="w-5 h-5 text-slate-700" />}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`karigar-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting || !!mobileError}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
          >
            {submitting ? t.saving : editingItem ? t.karigar_btnSaveChanges : t.karigar_btnCreate}
          </button>
        </div>
      }
    >
      <form id={`karigar-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.karigar_labelFullName} *</label>
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
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-700 font-medium">{t.karigar_labelMobile} *</label>
            {mobileError && <span className="text-2xs text-rose-600 font-medium">{mobileError}</span>}
            {!mobileError && mobile.length === 10 && (
              <span className="text-2xs text-emerald-600 font-medium">✓ Valid Mobile</span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-medium">
              +91
            </span>
            <input
              type="tel"
              required
              placeholder="98250 12345"
              value={mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              className={`w-full bg-white border ${
                mobileError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-slate-900'
              } rounded-lg pl-11 pr-3 py-2 text-sm font-mono text-slate-900 focus:outline-none`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.karigar_labelWageStructure} *</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setWageType('PIECE_RATE')}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition text-center ${
                wageType === 'PIECE_RATE'
                  ? 'border-[#0099B8] bg-[#0099B8] text-white shadow-xs'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>{t.karigar_typePieceRate}</div>
            </button>
            <button
              type="button"
              onClick={() => setWageType('FIXED_MONTHLY')}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition text-center ${
                wageType === 'FIXED_MONTHLY'
                  ? 'border-[#0099B8] bg-[#0099B8] text-white shadow-xs'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>{t.karigar_typeFixedMonthly}</div>
            </button>
            <button
              type="button"
              onClick={() => setWageType('FIXED_PLUS_INCENTIVE')}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition text-center ${
                wageType === 'FIXED_PLUS_INCENTIVE'
                  ? 'border-[#0099B8] bg-[#0099B8] text-white shadow-xs'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>{t.karigar_typeFixedIncentive}</div>
            </button>
          </div>
        </div>

        {wageType === 'PIECE_RATE' && (
          <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="text-xs text-slate-700 font-medium">{t.karigar_labelRatePerMeter} *</label>
            <input
              type="number"
              step="0.01"
              required
              value={defaultRatePerMeter}
              onChange={(e) => setDefaultRatePerMeter(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
            <p className="text-2xs text-slate-500">₹{defaultRatePerMeter} / {t.karigar_perMeter}</p>
          </div>
        )}

        {wageType === 'FIXED_MONTHLY' && (
          <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="text-xs text-slate-700 font-medium">{t.karigar_labelMonthlySalary} *</label>
            <input
              type="number"
              required
              value={defaultMonthlySalary}
              onChange={(e) => setDefaultMonthlySalary(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
            />
            <p className="text-2xs text-slate-500">15-day fortnight base: ₹{Math.round(defaultMonthlySalary / 2)}</p>
          </div>
        )}

        {wageType === 'FIXED_PLUS_INCENTIVE' && (
          <div className="space-y-3 bg-cyan-50/50 p-4 rounded-xl border border-cyan-200">
            <div className="space-y-1">
              <label className="text-xs text-slate-800 font-semibold">{t.karigar_labelMonthlySalary} *</label>
              <input
                type="number"
                required
                value={defaultMonthlySalary}
                onChange={(e) => setDefaultMonthlySalary(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
              />
              <span className="text-2xs text-slate-500">Base: ₹{Math.round(defaultMonthlySalary / 2)} / fortnight</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cyan-200/60">
              <div className="space-y-1">
                <label className="text-xs text-slate-800 font-medium">{t.karigar_labelIncentiveThreshold}</label>
                <input
                  type="number"
                  required
                  value={incentiveThresholdValue}
                  onChange={(e) => setIncentiveThresholdValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-800 font-medium">{t.karigar_labelThresholdType}</label>
                <select
                  value={incentiveThresholdType}
                  onChange={(e) => setIncentiveThresholdType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="STITCHES">{t.karigar_unitStitches}</option>
                  <option value="PIECES">{t.karigar_unitPieces}</option>
                  <option value="METERS">{t.karigar_unitMeters}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-800 font-medium">{t.karigar_labelIncentiveBonusRate}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={incentiveRate}
                  onChange={(e) => setIncentiveRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-800 font-medium">{t.karigar_labelBonusPer}</label>
                <select
                  value={incentiveRateType}
                  onChange={(e) => setIncentiveRateType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="PER_1K_STITCHES">{t.karigar_per1kStitches}</option>
                  <option value="PER_PIECE">{t.karigar_perPiece}</option>
                  <option value="PER_METER">{t.karigar_perMeterUnit}</option>
                </select>
              </div>
            </div>
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
  const { t } = useI18n();
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
      title={editingMachine ? t.machine_drawerEditTitle : t.machine_drawerAddTitle}
      subtitle={t.machine_drawerSubtitle}
      icon={<Cpu className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
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
            {submitting ? t.saving : editingMachine ? t.machine_btnSave : t.machine_btnCreate}
          </button>
        </div>
      }
    >
      <form id={`machine-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelIdentifier}</label>
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
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelHeadCount}</label>
          <select
            value={headCount}
            onChange={(e) => setHeadCount(Number(e.target.value) as 24 | 32 | 44 | 66)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          >
            <option value={24}>{t.machine_opt24Heads}</option>
            <option value={32}>{t.machine_opt32Heads}</option>
            <option value={44}>{t.machine_opt44Heads}</option>
            <option value={66}>{t.machine_opt66Heads}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelRpm}</label>
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
          <label className="text-xs text-slate-700 font-medium">{t.machine_labelMakeModel}</label>
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
            {t.machine_labelOperationalToggle}
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
  const { t } = useI18n();
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
      title={t.uchapat_drawerTitle}
      subtitle={t.uchapat_drawerSubtitle}
      icon={<CreditCard className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
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
            {submitting ? t.uchapat_recording : t.uchapat_btnRecord}
          </button>
        </div>
      }
    >
      <form id={`uchapat-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelBeneficiary} *</label>
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
            <span>{t.karigar_thWageType}: <strong>{selectedKarigar.wage_type}</strong></span>
            <span>{t.karigar_thMobile}: <strong>{selectedKarigar.mobile}</strong></span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelAmount} *</label>
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
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelDisbursalDate} *</label>
          <input
            type="date"
            required
            value={advanceDate}
            onChange={(e) => setAdvanceDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelPaymentMode}</label>
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
                {mode === 'CASH' ? t.uchapat_modeCash : mode === 'UPI' ? t.uchapat_modeUpi : t.uchapat_modeBank}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelRemarks}</label>
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
  const { t } = useI18n();
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
      title={t.munim_drawerTitle}
      subtitle={t.munim_drawerSubtitle}
      icon={<Building2 className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
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
            {submitting ? t.saving : t.munim_btnSendRequest}
          </button>
        </div>
      }
    >
      <form id={`invite-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.munim_labelGstin}</label>
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
          <label className="text-xs text-slate-700 font-medium">{t.munim_labelMobile}</label>
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
  const { t } = useI18n();
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState(instance.payload?.karigarId || '');
  const [startDate, setStartDate] = useState(instance.payload?.startDate || '2026-09-01');
  const [endDate, setEndDate] = useState(instance.payload?.endDate || '2026-09-15');
  const [deductions, setDeductions] = useState<number>(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [attendancePreview, setAttendancePreview] = useState<{
    total_period_days: number;
    attended_days: number;
    absent_days: number;
    daily_base_salary: number;
    suggested_absent_deduction: number;
  } | null>(null);

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

  // Fetch attendance preview when karigar or dates change
  useEffect(() => {
    if (!selectedKarigarId || !startDate || !endDate) return;
    WageHisabApi.calculate({
      karigar_id: selectedKarigarId,
      startDate,
      endDate,
    })
      .then((res) => {
        if (res.attendance) {
          setAttendancePreview(res.attendance);
        } else {
          setAttendancePreview(null);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch hisab attendance preview:', err);
        setAttendancePreview(null);
      });
  }, [selectedKarigarId, startDate, endDate]);

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
      title={t.hisab_drawerTitle}
      subtitle={t.hisab_drawerSubtitle}
      icon={<Calculator className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleCalculate}
            disabled={calculating}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Calculator className="w-4 h-4" />
            <span>{calculating ? t.hisab_computing : t.hisab_btnCompute}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.uchapat_labelBeneficiary} *</label>
          <select
            value={selectedKarigarId}
            onChange={(e) => setSelectedKarigarId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
          >
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.wage_type === 'PIECE_RATE' ? t.karigar_typePieceRate : t.karigar_typeFixedMonthly})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.hisab_labelStartDate}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.hisab_labelEndDate}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-700 font-medium">{t.hisab_labelCustomDeductions}</label>
            {attendancePreview && attendancePreview.absent_days > 0 && attendancePreview.daily_base_salary > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <span>
                  Absent: {attendancePreview.absent_days} {attendancePreview.absent_days === 1 ? 'day' : 'days'} ({formatINR(attendancePreview.suggested_absent_deduction)} @ ₹{attendancePreview.daily_base_salary}/day)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDeductions(attendancePreview.suggested_absent_deduction);
                    setDeductionReason(`Absent: ${attendancePreview.absent_days} days (${startDate} to ${endDate})`);
                  }}
                  className="px-1.5 py-0.5 text-3xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition cursor-pointer"
                  title="Auto-fill absent deduction"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
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
            <label className="text-xs text-slate-700 font-medium">{t.hisab_labelDeductionReason}</label>
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
  const { t } = useI18n();
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [karigars, setKarigars] = useState<KarigarApiItem[]>([]);
  const [activeLots, setActiveLots] = useState<ActivePendingLotItem[]>([]);

  const [machineId, setMachineId] = useState('');
  const [shiftType, setShiftType] = useState<'DAY' | 'NIGHT'>('DAY');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardChallanId, setInwardChallanId] = useState('');
  const [designNo, setDesignNo] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<PendingDesignItem | null>(null);

  const [startCounter, setStartCounter] = useState<number>(100000);
  const [endCounter, setEndCounter] = useState<number>(484000);
  const [totalMeters, setTotalMeters] = useState<number>(450);
  const [karigarId, setKarigarId] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0);
  const [downtimeReason, setDowntimeReason] = useState('None');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      MachinesApi.getAll(),
      KarigarsApi.getAll(),
      InwardChallansApi.getActivePendingLots(),
    ])
      .then(([mList, kList, lotList]) => {
        setMachines(mList);
        setKarigars(kList);
        setActiveLots(lotList);
        if (mList.length > 0) setMachineId(mList[0].id);
        if (kList.length > 0) setKarigarId(kList[0].id);
        if (lotList.length > 0) {
          const firstLot = lotList[0];
          setInwardChallanId(firstLot.id);
          if (firstLot.pending_designs && firstLot.pending_designs.length > 0) {
            const firstDesign = firstLot.pending_designs[0];
            setDesignNo(firstDesign.design_no);
            setSelectedDesign(firstDesign);
          }
        }
      })
      .catch((e) => console.warn('Failed to load masters in shift drawer:', e));
  }, []);

  const handleLotChange = (selectedLotId: string) => {
    setInwardChallanId(selectedLotId);
    if (!selectedLotId) {
      setSelectedDesign(null);
      setDesignNo('');
      return;
    }
    const foundLot = activeLots.find((l) => l.id === selectedLotId);
    if (foundLot && foundLot.pending_designs && foundLot.pending_designs.length > 0) {
      const firstDesign = foundLot.pending_designs[0];
      setDesignNo(firstDesign.design_no);
      setSelectedDesign(firstDesign);
    } else {
      setSelectedDesign(null);
      setDesignNo('');
    }
  };

  const handleDesignChange = (selectedDesignNo: string) => {
    setDesignNo(selectedDesignNo);
    const foundLot = activeLots.find((l) => l.id === inwardChallanId);
    if (foundLot && foundLot.pending_designs) {
      const d = foundLot.pending_designs.find((item) => item.design_no === selectedDesignNo);
      setSelectedDesign(d || null);
    }
  };

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

    if (inwardChallanId && !designNo) {
      toast.error('Please select an active cloth design for this inward lot');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateShiftLogDto = {
        machine_id: machineId,
        shift_type: shiftType,
        shift_date: shiftDate,
        inward_challan_id: inwardChallanId || undefined,
        design_no: designNo || 'GENERAL',
        start_counter: Number(startCounter),
        end_counter: Number(endCounter),
        total_meters: Number(totalMeters),
        karigar_id: karigarId,
        downtime_minutes: Number(downtimeMinutes),
        downtime_reason: downtimeMinutes > 0 ? downtimeReason : undefined,
      };

      const result = await ShiftLogsApi.create(payload);
      toast.success('Production shift logged successfully!');
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to log shift: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const currentLot = activeLots.find((l) => l.id === inwardChallanId);
  const pendingDesigns = currentLot?.pending_designs || [];

  const downtimeOptions = [
    { value: 'None', label: t.shift_dtNone || 'None' },
    { value: 'Thread Breakage', label: t.shift_dtThreadBreakage || 'Thread Breakage' },
    { value: 'Needle Replacement', label: t.shift_dtNeedleReplacement || 'Needle Replacement' },
    { value: 'Bobbin Refill', label: t.shift_dtBobbinRefill || 'Bobbin / Zari Refill' },
    { value: 'Power Outage', label: t.shift_dtPowerOutage || 'Power Outage / GIDC Load Shedding' },
    { value: 'Mechanical Jam', label: t.shift_dtMechanicalJam || 'Mechanical Jam / Oil Issue' },
  ];

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.shift_drawerSingleLotTitle || 'Log Production Shift'}
      subtitle={t.shift_drawerSingleLotSubtitle || 'Daily machine shift entry • Completed designs are automatically filtered'}
      icon={<Clock className="w-5 h-5 text-slate-700" />}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`shift-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            {submitting ? (t.shift_drawerRegistering || 'Registering...') : (t.shift_saveBtn || 'Save Shift Log')}
          </button>
        </div>
      }
    >
      <form id={`shift-form-${instance.id}`} onSubmit={handleCreateShift} className="space-y-4">
        {/* Machine & Shift Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-700 font-medium">{t.shift_selectMachine || 'Select Machine'} *</label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {t.dash_machinePrefix || 'Machine'} #{m.machine_no} ({m.head_count} {t.shift_headsUnit || 'Heads'} • {m.rpm || 850} RPM)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_shiftTypeLabel || 'Shift Type'} *</label>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setShiftType('DAY')}
                className={`flex-1 py-1 text-2xs font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer ${
                  shiftType === 'DAY' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>{t.shift_day || 'DAY'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftType('NIGHT')}
                className={`flex-1 py-1 text-2xs font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer ${
                  shiftType === 'NIGHT' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>{t.shift_night || 'NIGHT'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date & Karigar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_shiftDate || 'Shift Date'} *</label>
            <input
              type="date"
              required
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_operatingKarigar || 'Operating Karigar'} *</label>
            <select
              value={karigarId}
              onChange={(e) => setKarigarId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium"
            >
              {karigars.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.mobile || k.wage_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inward Lot & Design Section (Single Lot & Single Design Only) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              {t.shift_fabricLotsTitle || 'Fabric Lots & Cloth Allocation'}
            </span>
            <span className="text-2xs bg-cyan-100 text-cyan-800 font-semibold px-2 py-0.5 rounded-full">
              1 Lot • 1 Design per Shift
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.shift_drawerSelectActiveLot || 'Select Active Inward Lot'} *</label>
              <select
                value={inwardChallanId}
                onChange={(e) => handleLotChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium font-mono"
              >
                <option value="">{t.shift_optionalGeneralShift || '-- Optional General Shift (No Lot) --'}</option>
                {activeLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    Lot #{lot.lot_no} • {lot.trader_name} ({lot.fabric_quality} • {lot.pending_designs.length} pending designs)
                  </option>
                ))}
              </select>
              {activeLots.length === 0 && (
                <p className="text-2xs text-amber-600 font-medium mt-1">
                  {t.shift_drawerAllLotsCompleted || 'All registered inward lots are currently completed! Create a new inward lot or run a general shift.'}
                </p>
              )}
            </div>

            {inwardChallanId && pendingDesigns.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-cyan-950 font-bold">
                  {t.shift_drawerSelectActiveDesign || 'Select Active Design / Cloth'} *
                </label>
                <select
                  value={designNo}
                  onChange={(e) => handleDesignChange(e.target.value)}
                  className="w-full bg-white border border-cyan-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold"
                >
                  {pendingDesigns.map((d, idx) => {
                    const percentDone = d.allocated_meters > 0
                      ? Math.min(100, Math.round((d.produced_meters / d.allocated_meters) * 100))
                      : 0;
                    return (
                      <option key={idx} value={d.design_no}>
                        {d.design_no} • {formatNumber(d.remaining_meters)}m {t.shift_drawerRemainingOf || 'remaining of'} {formatNumber(d.allocated_meters)}m ({percentDone}% {t.shift_drawerDone || 'done'} • ₹{Number(d.commission_rate || 0).toFixed(2)} {t.shift_drawerComm || 'comm'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {inwardChallanId && selectedDesign && (
              <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-cyan-950 font-bold">
                  <span>{t.shift_drawerSelectedCloth || 'Selected Cloth:'} {selectedDesign.design_no}</span>
                  <span>{formatNumber(selectedDesign.remaining_meters)}m remaining</span>
                </div>
                <div className="w-full bg-cyan-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-600 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        selectedDesign.allocated_meters > 0
                          ? Math.min(100, Math.round((selectedDesign.produced_meters / selectedDesign.allocated_meters) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-2xs text-cyan-800">
                  <span>{t.shift_drawerProduced || 'Produced:'} {formatNumber(selectedDesign.produced_meters)}m</span>
                  <span>{t.shift_drawerAllocatedQuota || 'Allocated Quota:'} {formatNumber(selectedDesign.allocated_meters)}m</span>
                </div>
              </div>
            )}

            {!inwardChallanId && (
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.shift_designCode || 'Design Code'}</label>
                <input
                  type="text"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                  placeholder="e.g. DSG-SAMPLE-01"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Counter Telemetry */}
        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
            {t.shift_calculatedNetStitches || 'Counter Telemetry:'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.shift_startingCounter || 'Start Counter'} *</label>
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
              <label className="text-xs text-slate-700 font-medium">{t.shift_endingCounter || 'End Counter'} *</label>
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
              <label className="text-xs text-slate-700 font-medium">{t.shift_totalMetersOutput || 'Total Meters Output'} ({t.dash_metersUnit || 'm'}) *</label>
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
            <span className="text-slate-500">{t.shift_calculatedNetStitches || 'Calculated Net Stitches:'}</span>
            <span className="font-extrabold text-slate-900">{formatNumber(Math.max(0, endCounter - startCounter))} {t.dash_stitchesUnit || 'stitches'}</span>
          </div>

          {selectedDesign && selectedDesign.remaining_meters > 0 && totalMeters >= selectedDesign.remaining_meters && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-2xs text-emerald-800 font-semibold">
              ✓ {t.shift_drawerFulfillsQuota || 'Output fulfills the remaining quota. This design will be marked 100% completed and retired from new shifts!'}
            </div>
          )}
        </div>

        {/* Downtime Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.shift_downtimeMinutes || 'Downtime Minutes'}</label>
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
              <label className="text-xs text-slate-700 font-medium">{t.shift_downtimeReason || 'Downtime Reason'}</label>
              <select
                value={downtimeReason}
                onChange={(e) => setDowntimeReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                {downtimeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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
  const { closeDrawer, openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [traderName, setTraderName] = useState('');
  const [traderGstin, setTraderGstin] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [lotNo, setLotNo] = useState(`LOT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [thanCount, setThanCount] = useState<number>(10);
  const [inwardMeters, setInwardMeters] = useState<number>(1000);
  const [fabricQuality, setFabricQuality] = useState('Georgette 60g');
  const [designNo, setDesignNo] = useState('DSG-108');
  const [stitchCount, setStitchCount] = useState<number>(24000);
  const [karigarCommissionRate, setKarigarCommissionRate] = useState<number>(0.25);
  const [karigarCommissionType, setKarigarCommissionType] = useState<'PER_1K_STITCHES' | 'PER_PIECE' | 'PER_METER'>('PER_1K_STITCHES');
  const [jobworkPricePer1k, setJobworkPricePer1k] = useState<number>(0.60);
  const [isMultiDesign, setIsMultiDesign] = useState(false);
  const [designItems, setDesignItems] = useState<InwardChallanDesignItem[]>([
    {
      design_no: 'DSG-108-A',
      stitch_count: 24000,
      commission_type: 'PER_1K_STITCHES',
      commission_rate: 0.25,
      jobwork_price_per_1k: 0.60,
      meters: 500,
      than_count: 5,
    },
    {
      design_no: 'DSG-108-B',
      stitch_count: 32000,
      commission_type: 'PER_1K_STITCHES',
      commission_rate: 0.30,
      jobwork_price_per_1k: 0.75,
      meters: 500,
      than_count: 5,
    },
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    PartiesApi.getAll()
      .then((data) => {
        setParties(data);
        if (data.length > 0) {
          setSelectedPartyId(data[0].id);
          setTraderName(data[0].name);
          if (data[0].gstin) setTraderGstin(data[0].gstin);
        } else {
          setTraderName('Ambaji Fashion Surat');
          setTraderGstin('24BBCDE5678G1Z3');
        }
      })
      .catch(() => {
        setTraderName('Ambaji Fashion Surat');
        setTraderGstin('24BBCDE5678G1Z3');
      });
  }, []);

  const handlePartySelect = (partyId: string) => {
    setSelectedPartyId(partyId);
    const p = parties.find((item) => item.id === partyId);
    if (p) {
      setTraderName(p.name);
      if (p.gstin) setTraderGstin(p.gstin);
    }
  };

  const addDesignItem = () => {
    setDesignItems((prev) => [
      ...prev,
      {
        design_no: `DSG-${prev.length + 101}`,
        stitch_count: 24000,
        commission_type: 'PER_1K_STITCHES',
        commission_rate: 0.25,
        jobwork_price_per_1k: 0.60,
        meters: 200,
        than_count: 2,
      },
    ]);
  };

  const removeDesignItem = (idx: number) => {
    setDesignItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateDesignItem = (idx: number, field: keyof InwardChallanDesignItem, val: any) => {
    setDesignItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traderName.trim() || !lotNo.trim()) {
      toast.error('Trader Name and Lot Number are required');
      return;
    }
    setSubmitting(true);
    try {
      const calculatedMeters = isMultiDesign ? designItems.reduce((acc, item) => acc + Number(item.meters || 0), 0) : Number(inwardMeters);
      const calculatedThans = isMultiDesign ? designItems.reduce((acc, item) => acc + Number(item.than_count || 0), 0) : Number(thanCount);

      const payload: CreateInwardChallanDto = {
        challan_date: challanDate,
        trader_name: traderName,
        trader_gstin: traderGstin,
        lot_no: lotNo,
        than_count: calculatedThans,
        inward_meters: calculatedMeters,
        fabric_quality: fabricQuality,
        design_no: isMultiDesign && designItems.length > 0 ? designItems[0].design_no : designNo,
        stitch_count: Number(stitchCount),
        karigar_commission_rate: Number(karigarCommissionRate),
        karigar_commission_type: karigarCommissionType,
        jobwork_price_per_1k: Number(jobworkPricePer1k),
        items: isMultiDesign ? designItems : undefined,
        notes,
      };

      const result = await InwardChallansApi.create(payload);
      toast.success(`Inward Lot ${lotNo} registered with design specs successfully`);
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
      title={t.challan_drawerTitle}
      subtitle={t.challan_drawerSubtitle}
      icon={<Truck className="w-5 h-5 text-slate-700" />}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
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
            {submitting ? t.saving : t.challan_saveBtn}
          </button>
        </div>
      }
    >
      <form id={`challan-form-${instance.id}`} onSubmit={handleCreateChallan} className="space-y-4">
        <PartyPicker
          selectedPartyId={selectedPartyId}
          partyName={traderName}
          partyGstin={traderGstin}
          onSelect={(p) => {
            setSelectedPartyId(p.id || '');
            setTraderName(p.name);
            if (p.gstin) setTraderGstin(p.gstin);
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelInwardDate}</label>
            <input
              type="date"
              required
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelGstin}</label>
            <input
              type="text"
              placeholder="24BBCDE5678G1Z3"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelLotNo}</label>
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
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelQuality}</label>
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
            <label className="text-xs text-slate-700 font-medium">{t.challan_labelMultiDesignToggle}</label>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id={`multi-design-${instance.id}`}
                checked={isMultiDesign}
                onChange={(e) => setIsMultiDesign(e.target.checked)}
                className="w-4 h-4 text-[#0099B8] rounded border-slate-300"
              />
              <label htmlFor={`multi-design-${instance.id}`} className="text-xs font-medium text-slate-800 cursor-pointer">
                {t.challan_labelMultiDesignToggle}
              </label>
            </div>
          </div>
        </div>

        {!isMultiDesign ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-700 block">
              {t.challan_designSpecsTitle}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelDesignNo}</label>
                <input
                  type="text"
                  required
                  placeholder="DSG-108"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelStitches}</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={stitchCount}
                  onChange={(e) => setStitchCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelJobworkPrice}</label>
                <input
                  type="number"
                  step="0.01"
                  value={jobworkPricePer1k}
                  onChange={(e) => setJobworkPricePer1k(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelKarigarCommission}</label>
                <input
                  type="number"
                  step="0.01"
                  value={karigarCommissionRate}
                  onChange={(e) => setKarigarCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelCommissionBasis}</label>
                <select
                  value={karigarCommissionType}
                  onChange={(e) => setKarigarCommissionType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="PER_1K_STITCHES">{t.challan_commPer1k}</option>
                  <option value="PER_PIECE">{t.challan_commPerPiece}</option>
                  <option value="PER_METER">{t.challan_commPerMeter}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelThanCount}</label>
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
                <label className="text-xs text-slate-700 font-medium">{t.challan_labelInwardMeters}</label>
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
          </div>
        ) : (
          <div className="p-4 bg-cyan-50/50 border border-cyan-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-cyan-900">
                {t.challan_multiDesignBreakdown}
              </span>
              <button
                type="button"
                onClick={addDesignItem}
                className="text-xs font-semibold text-[#0099B8] hover:text-[#0E7090] flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-cyan-200 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.challan_addDesignRow}</span>
              </button>
            </div>

            <div className="space-y-3">
              {designItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-white border border-cyan-200 rounded-lg space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-slate-700">{t.challan_designNumber}{idx + 1}</span>
                    {designItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDesignItem(idx)}
                        className="text-rose-500 hover:text-rose-700 text-2xs font-semibold"
                      >
                        {t.challan_remove}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelDesignNo}</label>
                      <input
                        type="text"
                        value={item.design_no}
                        onChange={(e) => updateDesignItem(idx, 'design_no', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelStitches}</label>
                      <input
                        type="number"
                        value={item.stitch_count}
                        onChange={(e) => updateDesignItem(idx, 'stitch_count', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_thThans}</label>
                      <input
                        type="number"
                        value={item.than_count}
                        onChange={(e) => updateDesignItem(idx, 'than_count', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_thMeters}</label>
                      <input
                        type="number"
                        value={item.meters}
                        onChange={(e) => updateDesignItem(idx, 'meters', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelKarigarCommission}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.commission_rate}
                        onChange={(e) => updateDesignItem(idx, 'commission_rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-emerald-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelCommissionBasis}</label>
                      <select
                        value={item.commission_type}
                        onChange={(e) => updateDesignItem(idx, 'commission_type', e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                      >
                        <option value="PER_1K_STITCHES">{t.challan_commPer1k}</option>
                        <option value="PER_PIECE">{t.challan_commPerPiece}</option>
                        <option value="PER_METER">{t.challan_commPerMeter}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-3xs text-slate-500">{t.challan_labelJobworkPrice}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.jobwork_price_per_1k}
                        onChange={(e) => updateDesignItem(idx, 'jobwork_price_per_1k', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-cyan-200 text-xs font-mono">
              <span className="text-slate-600 font-sans font-medium">{t.challan_lotTotals}</span>
              <span className="font-bold text-slate-900">
                {designItems.reduce((acc, i) => acc + Number(i.than_count || 0), 0)} Than • {designItems.reduce((acc, i) => acc + Number(i.meters || 0), 0)} Meters
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.challan_notes}</label>
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
  const { t } = useI18n();
  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [challans, setChallans] = useState<InwardChallanApiItem[]>([]);
  const [traderName, setTraderName] = useState('');
  const [traderGstin, setTraderGstin] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [billedMeters, setBilledMeters] = useState<number>(1200);
  const [ratePerMeter, setRatePerMeter] = useState<number>(18.5);
  const [taxRate] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    InwardChallansApi.getAll()
      .then((data) => {
        setChallans(data);
        if (data.length > 0) {
          setSelectedLotIds([data[0].id]);
          setBilledMeters(Number(data[0].inward_meters) || 1000);
        }
      })
      .catch((e) => console.warn('Failed to load challans in invoice drawer:', e));

    PartiesApi.getAll()
      .then((data) => {
        setParties(data);
        if (data.length > 0) {
          setSelectedPartyId(data[0].id);
          setTraderName(data[0].name);
          if (data[0].gstin) setTraderGstin(data[0].gstin);
        } else {
          setTraderName('Ambaji Fashion Surat');
          setTraderGstin('24BBCDE5678G1Z3');
        }
      })
      .catch(() => {
        setTraderName('Ambaji Fashion Surat');
        setTraderGstin('24BBCDE5678G1Z3');
      });
  }, []);

  const partyLots = challans.filter((c) => {
    if (!traderName.trim()) return true;
    return (
      c.trader_name.toLowerCase().includes(traderName.toLowerCase()) ||
      (traderGstin && c.trader_gstin && c.trader_gstin.toUpperCase() === traderGstin.toUpperCase())
    );
  });

  const handleToggleLot = (lotId: string) => {
    setSelectedLotIds((prev) => {
      const next = prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId];
      const sumMeters = challans
        .filter((c) => next.includes(c.id))
        .reduce((acc, c) => acc + Number(c.inward_meters || 0), 0);
      if (sumMeters > 0) setBilledMeters(sumMeters);
      return next;
    });
  };

  const handleSelectAllLots = () => {
    if (selectedLotIds.length === partyLots.length) {
      setSelectedLotIds([]);
    } else {
      const allIds = partyLots.map((c) => c.id);
      setSelectedLotIds(allIds);
      const sumMeters = partyLots.reduce((acc, c) => acc + Number(c.inward_meters || 0), 0);
      if (sumMeters > 0) setBilledMeters(sumMeters);
    }
  };

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
      const selectedLots = challans.filter((c) => selectedLotIds.includes(c.id));
      const lotItemsPayload = selectedLots.map((c) => ({
        inward_challan_id: c.id,
        lot_no: c.lot_no,
        meters: Number(c.inward_meters),
        thans: Number(c.than_count),
        fabric_quality: c.fabric_quality,
        design_no: c.design_no,
        rate: Number(ratePerMeter),
      }));

      const result = await OutwardInvoicesApi.create({
        trader_name: traderName,
        trader_gstin: traderGstin,
        invoice_date: invoiceDate,
        inward_challan_id: selectedLotIds.length > 0 ? selectedLotIds[0] : undefined,
        lot_items: lotItemsPayload.length > 0 ? lotItemsPayload : undefined,
        total_stitches: Math.round(Number(billedMeters) * 1000),
        machine_heads: 32,
        rate_per_1000: Number(ratePerMeter),
        inward_meters: Number(billedMeters),
        outward_meters: Number(billedMeters),
      });

      toast.success(`SAC 9988 Invoice generated for ${selectedLots.length || 1} lots!`);
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
      title={t.invoice_drawerTitle}
      subtitle={t.invoice_drawerSubtitle}
      icon={<FileText className="w-5 h-5 text-slate-700" />}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
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
            {submitting ? t.saving : t.invoice_btnGenerate}
          </button>
        </div>
      }
    >
      <form id={`invoice-form-${instance.id}`} onSubmit={handleCreateInvoice} className="space-y-4">
        <PartyPicker
          selectedPartyId={selectedPartyId}
          partyName={traderName}
          partyGstin={traderGstin}
          label={t.invoice_labelTrader}
          onSelect={(p) => {
            setSelectedPartyId(p.id || '');
            setTraderName(p.name);
            if (p.gstin) setTraderGstin(p.gstin);
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.invoice_labelGstin}</label>
            <input
              type="text"
              placeholder="24BBCDE5678G1Z3"
              value={traderGstin}
              onChange={(e) => setTraderGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.invoice_labelDate}</label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        {/* Multi-Lot Inward Consolidation Section */}
        <div className="p-4 bg-cyan-50/50 border border-cyan-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-2xs font-bold uppercase tracking-wider text-cyan-900 block">
                {t.invoice_multiLotTitle}
              </span>
              <span className="text-3xs text-slate-500">
                {t.invoice_availableLots}: {partyLots.length} • {traderName || 'Party'}
              </span>
            </div>
            {partyLots.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllLots}
                className="text-xs font-semibold text-[#0099B8] hover:text-[#0E7090] bg-white px-2.5 py-1 rounded-md border border-cyan-200 shadow-2xs"
              >
                {selectedLotIds.length === partyLots.length ? t.invoice_deselectAllLots : t.invoice_selectAllLots}
              </button>
            )}
          </div>

          {partyLots.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {partyLots.map((c) => {
                const isSelected = selectedLotIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'bg-white border-[#0099B8] shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleLot(c.id)}
                      className="w-4 h-4 mt-0.5 text-[#0099B8] rounded border-slate-300"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">Lot #{c.lot_no}</span>
                        <span className="font-mono font-bold text-emerald-700">{c.inward_meters} m</span>
                      </div>
                      <div className="text-2xs text-slate-600 flex items-center gap-2 pt-0.5">
                        <span>{c.fabric_quality}</span>
                        {c.design_no && <span className="font-mono text-cyan-800 font-semibold">• {c.design_no}</span>}
                        <span>• {c.than_count} Thans</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
              {t.invoice_noActiveLots}
            </div>
          )}

          {selectedLotIds.length > 0 && (
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-cyan-200 text-xs font-mono">
              <span className="text-slate-600 font-sans font-medium">
                {t.invoice_consolidatedLots} {selectedLotIds.length}:
              </span>
              <span className="font-bold text-[#0099B8] text-sm">
                {billedMeters} Meters Total
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
            {t.invoice_calcBreakdownTitle}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-medium">{t.invoice_billedQuantityMeters}</label>
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
              <label className="text-xs text-slate-700 font-medium">{t.invoice_stitchRatePerMeter}</label>
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
              <span>{t.invoice_taxableValue}</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(taxableAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>{t.invoice_gstSplit}</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(gstAmount)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>{t.invoice_netPayable}</span>
              <span className="font-mono text-emerald-700 text-sm">{formatINR(netAmount)}</span>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
};

/* -------------------------------------------------------------------------- */
/* 9. Party / Trader Drawer Form (Add / Edit)                                 */
/* -------------------------------------------------------------------------- */
const PartyDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const editingItem = instance.payload?.party as PartyApiItem | undefined;

  const [name, setName] = useState(editingItem?.name || '');
  const [gstin, setGstin] = useState(editingItem?.gstin || '');
  const [mobile, setMobile] = useState(editingItem?.mobile || '');
  const [email, setEmail] = useState(editingItem?.email || '');
  const [address, setAddress] = useState(editingItem?.address || '');
  const [city, setCity] = useState(editingItem?.city || 'Surat');
  const [creditPeriodDays, setCreditPeriodDays] = useState(editingItem?.credit_period_days || 15);
  const [openingBalance, setOpeningBalance] = useState(editingItem?.opening_balance || 0);
  const [isActive, setIsActive] = useState(editingItem?.is_active ?? true);
  const [transactionSummary, setTransactionSummary] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem?.id) {
      PartiesApi.getById(editingItem.id)
        .then((res) => {
          if (res && res.transaction_summary) {
            setTransactionSummary(res.transaction_summary);
          }
        })
        .catch(() => {});
    }
  }, [editingItem?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Party / Trader name is required');
      return;
    }
    if (gstin && gstin.trim().length !== 15) {
      toast.error('GSTIN must be exactly 15 characters');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreatePartyDto = {
        name: name.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        mobile: mobile.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || 'Surat',
        state_code: '24',
        credit_period_days: Number(creditPeriodDays),
        opening_balance: Number(openingBalance),
        is_active: isActive,
      };

      let result: PartyApiItem;
      if (editingItem) {
        result = await PartiesApi.update(editingItem.id, payload);
        toast.success(`Party ${name} updated successfully`);
      } else {
        result = await PartiesApi.create(payload);
        toast.success(`Party ${name} registered successfully`);
      }

      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to save party: ' + (err.message || 'Error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={editingItem ? t.party_drawerEditTitle : t.party_drawerAddTitle}
      subtitle={t.party_drawerSubtitle}
      icon={<Briefcase className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`party-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white font-semibold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
          >
            {submitting ? t.saving : editingItem ? t.party_btnUpdate : t.party_btnRegister}
          </button>
        </div>
      }
    >
      <form id={`party-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        {transactionSummary && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">
              {t.party_activitySummary}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-2xs text-slate-500">{t.party_summaryInwardLots}</div>
                <div className="text-sm font-bold text-slate-900">{transactionSummary.total_challans}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-2xs text-slate-500">{t.party_summaryInvoices}</div>
                <div className="text-sm font-bold text-slate-900">{transactionSummary.total_invoices}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-2xs text-slate-500">{t.party_summaryBilledTotal}</div>
                <div className="text-xs font-bold font-mono text-emerald-700">{formatINR(transactionSummary.total_billed_amount)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.party_labelFirmName}</label>
          <input
            type="text"
            required
            placeholder="e.g., Shree Ram Tex Fab"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelGstin}</label>
            <input
              type="text"
              maxLength={15}
              placeholder="24ABCDE1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelPhone}</label>
            <input
              type="tel"
              placeholder="9825198251"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelEmail}</label>
            <input
              type="email"
              placeholder="trader@textile.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelCity}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.party_labelAddress}</label>
          <textarea
            rows={2}
            placeholder="Plot / Mill / Ring Road Market Shop No..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelCreditTerms}</label>
            <input
              type="number"
              min={0}
              value={creditPeriodDays}
              onChange={(e) => setCreditPeriodDays(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">{t.party_labelOpeningBalance}</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id={`party-active-${instance.id}`}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded text-[#0099B8] focus:ring-[#0099B8]"
          />
          <label htmlFor={`party-active-${instance.id}`} className="text-xs text-slate-700 font-medium">
            {t.party_labelActiveToggle}
          </label>
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

          case 'ADD_PARTY':
          case 'EDIT_PARTY':
            return <PartyDrawerForm key={instance.id} instance={instance} level={index} />;

          default:
            return null;
        }
      })}
    </>
  );
};
