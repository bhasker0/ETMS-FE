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
        className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] hover:bg-[#E0F2FE] border border-[#E2E8F0] text-[#1E293B] rounded-xl min-h-[44px] transition text-left shadow-xs"
      >
        <div className="w-7 h-7 rounded-lg bg-[#0099B8] text-white flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col truncate max-w-[180px] sm:max-w-[240px]">
          <span className="text-2xs text-[#0099B8] font-bold uppercase">સુરત એકમ / Company</span>
          <span className="text-xs sm:text-sm font-bold truncate text-[#1E293B]">{currentCompany.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 p-2 space-y-1">
          <div className="px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0] flex justify-between items-center">
            <span>{t.linkedCompanies}</span>
            <span className="bg-[#E0F2FE] text-[#0284C7] px-1.5 py-0.5 rounded-md text-2xs font-mono font-bold">
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
                      ? 'bg-[#0099B8]/10 border border-[#0099B8]/30 text-[#0099B8]'
                      : 'hover:bg-[#F8FAFC] text-[#1E293B]'
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="font-bold text-xs sm:text-sm truncate text-[#1E293B]">{comp.name}</div>
                    <div className="text-2xs text-[#64748B] flex items-center gap-1 font-mono">
                      <span>GST: {comp.gstin}</span>
                      {comp.totalMachines && (
                        <>
                          <span>•</span>
                          <span>{comp.totalMachines} મશીનો</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[#0099B8] shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowAddDrawer(true);
              }}
              className="w-full py-2 bg-[#E0F2FE] hover:bg-[#0099B8] text-[#0284C7] hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
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
        icon={<ShieldCheck className="w-5 h-5 text-[#0099B8]" />}
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
              className="px-4 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {t.save}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#1E293B] font-bold block mb-1">
              કંપની / કારખાનાનું નામ (Company Name) *
            </label>
            <input
              type="text"
              required
              placeholder="દા.ત. શ્રી બાલાજી એમ્બ્રોઇડરી"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#1E293B] text-sm focus:outline-none focus:border-[#0099B8]"
            />
          </div>

          <div>
            <label className="text-xs text-[#1E293B] font-bold block mb-1">
              GSTIN નંબર (24 Gujarat Code) *
            </label>
            <input
              type="text"
              required
              placeholder="24AAAAA0000A1Z5"
              value={newGstin}
              onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#1E293B] text-sm focus:outline-none focus:border-[#0099B8] uppercase font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-[#1E293B] font-bold block mb-1">
              મોબાઈલ નંબર (Mobile Number)
            </label>
            <input
              type="tel"
              placeholder="+91 98250 XXXXX"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#1E293B] text-sm focus:outline-none focus:border-[#0099B8]"
            />
          </div>

          <div>
            <label className="text-xs text-[#1E293B] font-bold block mb-1">
              સરનામું (GIDC Area / Location)
            </label>
            <input
              type="text"
              placeholder="સચીન / પાંડેસરા / કતારગામ જીઆઇડીસી, સુરત"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#1E293B] text-sm focus:outline-none focus:border-[#0099B8]"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
};
