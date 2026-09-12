'use client';

import React, { useState, useMemo } from 'react';
import { useConfig } from '@/lib/config-context';
import { useI18n } from '@/lib/i18n';
import { Sliders, ShieldAlert, CreditCard, Cpu, Building, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';

export const CompanyParametersForm: React.FC = () => {
  const { companyParameters, updateParameter } = useConfig();
  const { language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter ONLY Company Parameters (strictly hide Super Admin / Support params)
  const visibleCompanyParams = useMemo(() => {
    return companyParameters.filter((p) => !p.isSuperAdminOnly);
  }, [companyParameters]);

  const hiddenSuperAdminCount = useMemo(() => {
    return companyParameters.filter((p) => p.isSuperAdminOnly).length;
  }, [companyParameters]);

  const categories = [
    { key: 'billing', label: 'Billing & Invoicing Parameters', icon: <CreditCard className="w-4 h-4 text-primary" /> },
    { key: 'production', label: 'Production & Machine Parameters', icon: <Cpu className="w-4 h-4 text-primary" /> },
    { key: 'integration', label: 'Tally & GST Integration Specs', icon: <Building className="w-4 h-4 text-primary" /> },
    { key: 'general', label: 'System Localization & General', icon: <MessageSquare className="w-4 h-4 text-primary" /> },
  ];

  const handleValueChange = (key: string, value: unknown, label?: string) => {
    updateParameter(key, value);
    toast.success(`Updated ${label || key}`);
  };

  // Filter parameters based on search query and selected category
  const filteredParams = useMemo(() => {
    return visibleCompanyParams.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.key.toLowerCase().includes(query) ||
        p.label.toLowerCase().includes(query) ||
        (p.labelGu && p.labelGu.toLowerCase().includes(query)) ||
        p.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [visibleCompanyParams, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header Info & Live Search Filter */}
      <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Factory Operational Parameters
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live business logic parameters controlling stitch calculations, shrinkage tolerance, and wage cutoffs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {visibleCompanyParams.length} Active Rules
            </span>
          </div>
        </div>

        {/* Search & Category Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parameters by name, description, or key..."
              className="w-full pl-9 pr-3 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-2xs font-medium rounded-md transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-foreground border border-[var(--border)]'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                className={`px-2.5 py-1 text-2xs font-medium rounded-md transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.key
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-foreground border border-[var(--border)]'
                }`}
              >
                {c.key.charAt(0).toUpperCase() + c.key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exclusion Notice Banner */}
      {hiddenSuperAdminCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-foreground shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-2xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-amber-700 dark:text-amber-300">Platform Protected Enclave:</span>{' '}
            {hiddenSuperAdminCount} multi-tenant root partition parameters are locked under Super Admin governance.
          </div>
        </div>
      )}

      {/* Empty Search Result */}
      {filteredParams.length === 0 && (
        <div className="text-center py-8 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
          <Sliders className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-xs text-foreground font-medium">No matching parameters found</p>
          <p className="text-2xs text-muted-foreground mt-0.5">Try adjusting your search query or category filter.</p>
        </div>
      )}

      {/* Parameters Grouped by Category */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const categoryParams = filteredParams.filter((p) => p.category === cat.key);
          if (categoryParams.length === 0) return null;

          return (
            <div key={cat.key} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
              <div className="bg-[var(--bg-surface-elevated)]/60 px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <h4 className="font-semibold text-foreground text-xs">
                    {cat.label}
                  </h4>
                </div>
                <span className="text-3xs font-medium text-muted-foreground">
                  {categoryParams.length} {categoryParams.length === 1 ? 'rule' : 'rules'}
                </span>
              </div>

              <div className="p-4 space-y-3.5 divide-y divide-[var(--border)]/60">
                {categoryParams.map((param) => (
                  <div key={param.key} className="pt-3.5 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-7 space-y-0.5">
                      <div className="font-medium text-foreground text-xs flex items-center gap-2">
                        <span>{language === 'gu' && param.labelGu ? param.labelGu : param.label}</span>
                        <code className="text-3xs text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-[var(--border)]">
                          {param.key}
                        </code>
                      </div>
                      <p className="text-2xs text-muted-foreground leading-relaxed">{param.description}</p>
                    </div>

                    <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2">
                      {typeof param.value === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={param.value}
                            onClick={() => handleValueChange(param.key, !param.value, param.label)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary ${
                              param.value ? 'bg-primary' : 'bg-muted border border-[var(--border)]'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                param.value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-2xs font-medium ${param.value ? 'text-primary' : 'text-muted-foreground'}`}>
                            {param.value ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : typeof param.value === 'number' ? (
                        <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                          <input
                            type="number"
                            step="any"
                            value={param.value}
                            onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value) || 0, param.label)}
                            className="w-full px-2.5 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs font-mono font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                          />
                          {param.unit && (
                            <span className="text-2xs font-semibold px-2 py-1 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-muted-foreground whitespace-nowrap">
                              {param.unit}
                            </span>
                          )}
                        </div>
                      ) : param.key === 'invoice_terms_condition' ? (
                        <textarea
                          rows={2}
                          value={param.value as string}
                          onChange={(e) => handleValueChange(param.key, e.target.value, param.label)}
                          className="w-full px-2.5 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                        />
                      ) : (
                        <input
                          type="text"
                          value={param.value as string}
                          onChange={(e) => handleValueChange(param.key, e.target.value, param.label)}
                          className="w-full max-w-[240px] px-2.5 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
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

