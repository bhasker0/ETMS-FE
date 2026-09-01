import React, { useState, useEffect, useRef } from 'react';
import { PartiesApi, PartyApiItem } from '@/lib/api/parties';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { useI18n } from '@/lib/i18n';
import { Plus, Building2, Check, X, ChevronDown } from 'lucide-react';

interface PartyPickerProps {
  selectedPartyId?: string;
  partyName: string;
  partyGstin?: string;
  onSelect: (party: { id?: string; name: string; gstin?: string; mobile?: string }) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export const PartyPicker: React.FC<PartyPickerProps> = ({
  selectedPartyId,
  partyName,
  partyGstin,
  onSelect,
  label,
  required = true,
  placeholder,
}) => {
  const { openDrawer } = useAppDrawer();
  const { t } = useI18n();
  const displayLabel = label || t.party_pickerLabel;
  const displayPlaceholder = placeholder || t.party_pickerPlaceholder;
  const [parties, setParties] = useState<PartyApiItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(partyName || '');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchParties = async () => {
    try {
      const list = await PartiesApi.getAll();
      setParties(list);
    } catch (e) {
      console.warn('Failed to fetch parties for picker:', e);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    setQuery(partyName || '');
  }, [partyName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredParties = parties.filter((p) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.gstin && p.gstin.toLowerCase().includes(q)) ||
      (p.mobile && p.mobile.includes(q)) ||
      (p.city && p.city.toLowerCase().includes(q))
    );
  });

  const handleSelectParty = (p: PartyApiItem) => {
    onSelect({
      id: p.id,
      name: p.name,
      gstin: p.gstin,
      mobile: p.mobile,
    });
    setQuery(p.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect({ id: undefined, name: '', gstin: '', mobile: '' });
    setQuery('');
  };

  const handleOpenAddParty = () => {
    setIsOpen(false);
    openDrawer('ADD_PARTY', {}, async (newParty?: any) => {
      await fetchParties();
      if (newParty && newParty.name) {
        onSelect({
          id: newParty.id,
          name: newParty.name,
          gstin: newParty.gstin,
          mobile: newParty.mobile,
        });
        setQuery(newParty.name);
      }
    });
  };

  return (
    <div ref={wrapperRef} className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-700 font-medium">
          {displayLabel} {required && '*'}
        </label>
        <button
          type="button"
          onClick={handleOpenAddParty}
          className="text-2xs text-[var(--primary)] hover:text-[#9494ff] font-semibold flex items-center gap-0.5 transition hover:underline"
        >
          <Plus className="w-3 h-3" />
          <span>{t.party_addNew}</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Building2 className="w-4 h-4" />
        </div>

        <input
          type="text"
          required={required}
          value={query}
          placeholder={displayPlaceholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect({ id: undefined, name: e.target.value, gstin: partyGstin });
            setIsOpen(true);
          }}
          className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-16 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] font-medium"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {partyGstin && (
        <div className="flex items-center gap-1.5 text-2xs text-slate-500 pt-0.5 font-mono">
          <span>GSTIN:</span>
          <span className="font-semibold text-slate-700">{partyGstin}</span>
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 bg-slate-50 flex items-center justify-between border-b border-slate-100">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-500">
              {t.party_pickerRegisteredParties} ({filteredParties.length})
            </span>
            <button
              type="button"
              onClick={handleOpenAddParty}
              className="text-2xs font-semibold text-[var(--primary)] hover:text-[#9494ff] flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>{t.party_pickerCreateMaster}</span>
            </button>
          </div>

          {filteredParties.map((p) => {
            const isSelected = selectedPartyId === p.id || partyName === p.name;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectParty(p)}
                className={`w-full text-left p-2.5 flex items-center justify-between transition hover:bg-[var(--bg-surface-elevated)] ${isSelected ? 'bg-[var(--bg-surface-elevated)]' : ''}`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-900 font-medium flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {p.city && (
                      <span className="text-3xs px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {p.city}
                      </span>
                    )}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono flex items-center gap-2">
                    {p.gstin && <span>GST: {p.gstin}</span>}
                    {p.mobile && <span>Ph: {p.mobile}</span>}
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[var(--primary)]" />}
              </button>
            );
          })}

          {filteredParties.length === 0 && (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-slate-500">{t.party_pickerNoMatch} &quot;{query}&quot;</p>
              <button
                type="button"
                onClick={handleOpenAddParty}
                className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[#9494ff] text-white text-xs font-semibold rounded-lg shadow-xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.party_pickerAddToMaster}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
