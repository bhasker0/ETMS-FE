'use client';

import React from 'react';
import { useConfig } from '@/lib/config-context';
import { useI18n } from '@/lib/i18n';
import { Sliders, ShieldAlert, Check, Save, RotateCcw, Building, CreditCard, Cpu, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export const CompanyParametersForm: React.FC = () => {
  const { companyParameters, updateParameter } = useConfig();
  const { t, language } = useI18n();

  // Filter ONLY Company Parameters (strictly hide Super Admin / Support params)
  const visibleCompanyParams = companyParameters.filter((p) => !p.isSuperAdminOnly);
  const hiddenSuperAdminCount = companyParameters.filter((p) => p.isSuperAdminOnly).length;

  const categories = [
    { key: 'billing', label: t.config_catBillingParams, icon: <CreditCard className="w-4 h-4 text-[#0099B8]" /> },
    { key: 'production', label: t.config_catProductionParams, icon: <Cpu className="w-4 h-4 text-emerald-600" /> },
    { key: 'integration', label: t.config_catIntegrationParams, icon: <Building className="w-4 h-4 text-purple-600" /> },
    { key: 'general', label: t.config_catGeneralParams, icon: <MessageSquare className="w-4 h-4 text-amber-600" /> },
  ];

  const handleValueChange = (key: string, value: any) => {
    updateParameter(key, value);
    toast.success(t.config_paramUpdated);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#0099B8]" />
            {t.config_operationalParamsTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.config_operationalParamsDesc}
          </p>
        </div>
      </div>

      {/* Exclusion Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">{t.config_superAdminNoticeTitle}:</span>
          <br />
          {hiddenSuperAdminCount} {t.config_superAdminNoticeDesc}
        </div>
      </div>

      {/* Parameters Grouped by Category */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const categoryParams = visibleCompanyParams.filter((p) => p.category === cat.key);
          if (categoryParams.length === 0) return null;

          return (
            <div key={cat.key} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                {cat.icon}
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  {cat.label}
                </h4>
              </div>

              <div className="p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
                {categoryParams.map((param) => (
                  <div key={param.key} className="pt-4 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-7">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>{language === 'gu' && param.labelGu ? param.labelGu : param.label}</span>
                      </div>
                      <p className="text-2xs text-slate-500 mt-0.5">{param.description}</p>
                    </div>

                    <div className="md:col-span-5 flex items-center justify-end gap-2">
                      {typeof param.value === 'boolean' ? (
                        <button
                          type="button"
                          onClick={() => handleValueChange(param.key, !param.value)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            param.value ? 'bg-[#0099B8]' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              param.value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      ) : typeof param.value === 'number' ? (
                        <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                          <input
                            type="number"
                            step="any"
                            value={param.value}
                            onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#0099B8] outline-none"
                          />
                          {param.unit && (
                            <span className="text-2xs font-semibold text-slate-500 whitespace-nowrap">
                              {param.unit}
                            </span>
                          )}
                        </div>
                      ) : param.key === 'invoice_terms_condition' ? (
                        <textarea
                          rows={2}
                          value={param.value as string}
                          onChange={(e) => handleValueChange(param.key, e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0099B8] outline-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={param.value as string}
                          onChange={(e) => handleValueChange(param.key, e.target.value)}
                          className="w-full max-w-[240px] px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0099B8] outline-none"
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
