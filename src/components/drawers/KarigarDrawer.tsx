'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { KarigarsApi, KarigarApiItem, CreateKarigarDto, WageType } from '@/lib/api/karigars';
import { UchapatApi } from '@/lib/api/uchapat';
import { ShiftLogsApi } from '@/lib/api/shift-logs';
import { useI18n } from '@/lib/i18n';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';
import { Users, Wallet, Calculator, Plus } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. Karigar Drawer Form (Add / Edit)                                       */
/* -------------------------------------------------------------------------- */
export const KarigarDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
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
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
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
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
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
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
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
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
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
          <div className="space-y-3 bg-[var(--bg-surface-elevated)]/50 p-4 rounded-xl border border-[var(--border)]">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]/60">
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
/* 1b. Karigar Financial Ledger Drawer Form (Upad & Salary History)           */
/* -------------------------------------------------------------------------- */
export const KarigarLedgerDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer, openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const karigar = instance.payload?.karigar as KarigarApiItem;
  const karigarId = instance.payload?.karigarId || karigar?.id;

  const [uchapats, setUchapats] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLedger = async () => {
    if (!karigarId) return;
    setLoading(true);
    try {
      const [uData, sData] = await Promise.all([
        UchapatApi.getAll().then((all) => all.filter((u) => u.karigar_id === karigarId)),
        ShiftLogsApi.getAll({ karigar_id: karigarId }).catch(() => []),
      ]);
      setUchapats(uData);
      setShifts(sData);
    } catch (err) {
      console.warn('Failed to load karigar ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [karigarId]);

  if (!karigar) return null;

  const totalUpad = uchapats.reduce((acc, u) => acc + Number(u.amount || 0), 0);
  const totalMeters = shifts.reduce((acc, s) => acc + Number(s.total_meters || 0), 0);
  const estimatedPieceEarnings = Math.round(totalMeters * Number(karigar.default_rate_per_meter || 1.2));
  const netDue = estimatedPieceEarnings - totalUpad;

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={karigar.name}
      subtitle={`${karigar.mobile} • ${karigar.wage_type?.replace(/_/g, ' ')}`}
      icon={<Users className="w-5 h-5 text-slate-700" />}
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => openDrawer('ADD_UCHAPAT', { karigarId: karigar.id, karigar }, loadLedger)}
            className="w-1/3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Issue Upad</span>
          </button>
          <button
            type="button"
            onClick={() => openDrawer('COMPUTE_HISAB', { karigarId: karigar.id, karigar }, loadLedger)}
            className="w-1/3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Settle Wage</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading ledger transactions...</div>
        ) : (
          <>
            {/* Bento Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <div className="text-3xs text-amber-700 dark:text-amber-400 font-semibold uppercase">Total Upad (Advances)</div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono mt-0.5">{formatINR(totalUpad)}</div>
            <div className="text-3xs text-[var(--text-muted)] mt-0.5">{uchapats.length} vouchers</div>
          </div>
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg">
            <div className="text-3xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Est. Wages Earned</div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">{formatINR(estimatedPieceEarnings)}</div>
            <div className="text-3xs text-[var(--text-muted)] mt-0.5">{totalMeters} meters finished</div>
          </div>
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="text-3xs text-[var(--text-muted)] font-semibold uppercase">Estimated Balance Due</div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${netDue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {formatINR(netDue)}
            </div>
            <div className="text-3xs text-[var(--text-muted)] mt-0.5">Net payable</div>
          </div>
        </div>

        {/* Upad Advance Vouchers Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-3 bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center justify-between">
            <span>Uchapat / Advance Vouchers ({uchapats.length})</span>
            <button
              type="button"
              onClick={() => openDrawer('ADD_UCHAPAT', { karigarId: karigar.id, karigar }, loadLedger)}
              className="text-3xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Voucher</span>
            </button>
          </div>
          {uchapats.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="text-[var(--text-muted)] border-b border-[var(--border)] text-3xs uppercase">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Reason / Ref</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {uchapats.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3 font-mono text-[var(--text-muted)]">{u.date}</td>
                    <td className="p-3 font-medium text-[var(--text-main)]">{u.reason || 'Cash advance'}</td>
                    <td className="p-3 text-3xs text-[var(--text-muted)] uppercase">{u.payment_mode || 'CASH'}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700 dark:text-amber-400">{formatINR(u.amount)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-3xs font-semibold uppercase ${u.is_settled ? 'badge-pastel-green' : 'badge-pastel-yellow'}`}>
                        {u.is_settled ? 'Settled' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              No uchapat cash advance vouchers issued to this karigar yet.
            </div>
          )}
        </div>

        {/* Shift Logs Summary */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-3 bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center justify-between">
            <span>Recent Shift Production Logs ({shifts.length})</span>
            <button
              type="button"
              onClick={() => openDrawer('COMPUTE_HISAB', { karigarId: karigar.id, karigar }, loadLedger)}
              className="text-3xs font-semibold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Compute Fortnight Hisab</span>
            </button>
          </div>
              {shifts.length > 0 ? (
                <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border)] text-xs">
                  {shifts.slice(0, 10).map((s) => (
                    <div key={s.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-semibold text-[var(--text-main)]">{s.shift_date}</span>
                        <span className="text-3xs text-[var(--text-muted)] ml-2">• Machine #{s.machine?.machine_no || 'Emb-1'} • {s.shift_type}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.total_meters} m</span>
                        <span className="text-3xs text-[var(--text-muted)] ml-2">({Number(s.total_stitches).toLocaleString()} st.)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  No shift logs recorded for this operator yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};
