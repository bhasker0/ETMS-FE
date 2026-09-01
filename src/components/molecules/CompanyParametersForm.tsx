'use client';

import React from 'react';
import { useConfig } from '@/lib/config-context';
import { useI18n } from '@/lib/i18n';
import { Sliders, ShieldAlert, CreditCard, Cpu, Building, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export const CompanyParametersForm: React.FC = () => {
  const { companyParameters, updateParameter } = useConfig();
  const { language } = useI18n();

  // Filter ONLY Company Parameters (strictly hide Super Admin / Support params)
  const visibleCompanyParams = companyParameters.filter((p) => !p.isSuperAdminOnly);
  const hiddenSuperAdminCount = companyParameters.filter((p) => p.isSuperAdminOnly).length;

  const categories = [
    { key: 'billing', label: 'BILLING & INVOICING PARAMETERS', icon: <CreditCard className="w-4 h-4 text-primary" /> },
    { key: 'production', label: 'PRODUCTION & MACHINE PARAMETERS', icon: <Cpu className="w-4 h-4 text-accent" /> },
    { key: 'integration', label: 'TALLY & GST INTEGRATION SPECS', icon: <Building className="w-4 h-4 text-primary" /> },
    { key: 'general', label: 'SYSTEM LOCALIZATION & GENERAL', icon: <MessageSquare className="w-4 h-4 text-accent" /> },
  ];

  const handleValueChange = (key: string, value: any) => {
    updateParameter(key, value);
    toast.success(`[SAVED] Parameter "${key}" updated`);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3.5 border border-border" style={{ borderRadius: 0 }}>
        <div>
          <h3 className="font-black text-foreground text-xs uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            {"/// FACTORY OPERATIONAL PARAMETERS"}
          </h3>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Real-time business logic variables controlling stitch rounding, tax precision, and wage fortnight rules
          </p>
        </div>
      </div>

      {/* Exclusion Notice Banner */}
      {hiddenSuperAdminCount > 0 && (
        <div className="bg-background border border-accent/40 p-3 flex items-start gap-2.5 text-xs text-foreground" style={{ borderRadius: 0 }}>
          <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="text-2xs leading-relaxed text-muted-foreground">
            <span className="font-bold text-accent uppercase">[PLATFORM ENCLAVE ACTIVE]:</span> {hiddenSuperAdminCount} multi-tenant root partition parameters are locked under Super Admin scope.
          </div>
        </div>
      )}

      {/* Parameters Grouped by Category */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const categoryParams = visibleCompanyParams.filter((p) => p.category === cat.key);
          if (categoryParams.length === 0) return null;

          return (
            <div key={cat.key} className="bg-background border border-border" style={{ borderRadius: 0 }}>
              <div className="bg-card px-3.5 py-2.5 border-b border-border flex items-center gap-2">
                {cat.icon}
                <h4 className="font-black text-foreground text-xs uppercase tracking-wider">
                  {cat.label}
                </h4>
              </div>

              <div className="p-3.5 space-y-3 divide-y divide-border/40">
                {categoryParams.map((param) => (
                  <div key={param.key} className="pt-3 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-7">
                      <div className="font-black text-foreground text-xs uppercase flex items-center gap-2">
                        <span>{language === 'gu' && param.labelGu ? param.labelGu : param.label}</span>
                      </div>
                      <p className="text-2xs text-muted-foreground font-mono mt-0.5">{param.description}</p>
                    </div>

                    <div className="md:col-span-5 flex items-center justify-end gap-2">
                      {typeof param.value === 'boolean' ? (
                        <button
                          type="button"
                          onClick={() => handleValueChange(param.key, !param.value)}
                          className={`px-2.5 py-1 text-2xs font-extrabold uppercase border transition cursor-pointer ${
                            param.value
                              ? 'bg-accent/15 text-accent border-accent'
                              : 'bg-card text-muted-foreground border-border'
                          }`}
                          style={{ borderRadius: 0 }}
                        >
                          {param.value ? '[ENABLED / YES]' : '[DISABLED / NO]'}
                        </button>
                      ) : typeof param.value === 'number' ? (
                        <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                          <input
                            type="number"
                            step="any"
                            value={param.value}
                            onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1 bg-card border border-border text-xs font-mono font-bold text-foreground focus:outline-none"
                            style={{ borderRadius: 0 }}
                          />
                          {param.unit && (
                            <span className="text-2xs font-bold text-muted-foreground whitespace-nowrap uppercase">
                              {param.unit}
                            </span>
                          )}
                        </div>
                      ) : param.key === 'invoice_terms_condition' ? (
                        <textarea
                          rows={2}
                          value={param.value as string}
                          onChange={(e) => handleValueChange(param.key, e.target.value)}
                          className="w-full px-2.5 py-1 bg-card border border-border text-xs font-mono text-foreground focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={param.value as string}
                          onChange={(e) => handleValueChange(param.key, e.target.value)}
                          className="w-full max-w-[240px] px-2.5 py-1 bg-card border border-border text-xs font-mono text-foreground focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

