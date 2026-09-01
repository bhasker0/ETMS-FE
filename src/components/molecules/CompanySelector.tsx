'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { Building2, ChevronDown, Check, Plus, ShieldCheck } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { toast } from 'sonner';

export const CompanySelector: React.FC = () => {
  const { allAvailableCompanies, activeCompany, switchCompany } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGstin.trim()) return;
    toast.info('Company registration request sent to admin.');
    setShowAddDrawer(false);
    setNewName('');
    setNewGstin('');
    setNewPhone('');
    setNewAddress('');
  };

  const currentCompany = activeCompany || { id: '', name: 'No Company', gstin: '', totalMachines: 0 };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-main)] rounded-xl min-h-[44px] transition text-left shadow-xs"
      >
        <div className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col truncate max-w-[180px] sm:max-w-[240px]">
          <span className="text-2xs text-[var(--primary)] font-bold uppercase">સુરત એકમ / Company</span>
          <span className="text-xs sm:text-sm font-bold truncate text-[var(--text-main)]">{currentCompany.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-[var(--border)] rounded-2xl shadow-xl z-50 p-2 space-y-1">
          <div className="px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] flex justify-between items-center">
            <span>{t.linkedCompanies}</span>
            <span className="bg-[var(--bg-surface-elevated)] text-[var(--primary)] px-1.5 py-0.5 rounded-md text-2xs font-mono font-bold">
              {allAvailableCompanies.length}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {allAvailableCompanies.map((comp) => {
              const isSelected = comp.id === currentCompany.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    switchCompany(comp.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between transition min-h-[50px] ${
                    isSelected
                      ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)]'
                      : 'hover:bg-[var(--bg-canvas)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="font-bold text-xs sm:text-sm truncate text-[var(--text-main)]">{comp.name}</div>
                    <div className="text-2xs text-[var(--text-muted)] flex items-center gap-1 font-mono">
                      <span>GST: {comp.gstin}</span>
                      {comp.totalMachines && (
                        <>
                          <span>•</span>
                          <span>{comp.totalMachines} મશીનો</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowAddDrawer(true);
              }}
              className="w-full py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              + નવી કંપની ઉમેરો / Link New Company
            </button>
          </div>
        </div>
      )}

      {/* Add Company Right Slide-Over Drawer */}
      <Drawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        title="નવી કંપની લિંક કરો"
        subtitle="સુરત ટેક્સટાઇલ યુનિટ / Link Embroidery Factory"
        icon={<ShieldCheck className="w-5 h-5 text-[var(--primary)]" />}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setShowAddDrawer(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleAddSubmit}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {t.save}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-main)] font-bold block mb-1">
              કંપની / કારખાનાનું નામ (Company Name) *
            </label>
            <input
              type="text"
              required
              placeholder="દા.ત. શ્રી બાલાજી એમ્બ્રોઇડરી"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-main)] font-bold block mb-1">
              GSTIN નંબર (24 Gujarat Code) *
            </label>
            <input
              type="text"
              required
              placeholder="24AAAAA0000A1Z5"
              value={newGstin}
              onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--primary)] uppercase font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-main)] font-bold block mb-1">
              મોબાઈલ નંબર (Mobile Number)
            </label>
            <input
              type="tel"
              placeholder="+91 98250 XXXXX"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-main)] font-bold block mb-1">
              સરનામું (GIDC Area / Location)
            </label>
            <input
              type="text"
              placeholder="સચીન / પાંડેસરા / કતારગામ જીઆઇડીસી, સુરત"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
};
