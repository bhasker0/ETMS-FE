'use client';

import React, { useState } from 'react';
import { useConfig } from '@/lib/config-context';
import { useAuth } from '@/lib/auth-context';
import {
  Building2,
  Sliders,
  ShieldCheck,
  FolderGit2,
  UserCheck,
  FileText,
  Wrench,
  Truck,
  Calculator,
  Lock,
  CheckCircle2,
  Settings,
  Building,
} from 'lucide-react';
import { RolesPermissionMatrix } from '../molecules/RolesPermissionMatrix';
import { CompanyParametersForm } from '../molecules/CompanyParametersForm';
import { PermissionGroupManager } from '../molecules/PermissionGroupManager';
import { UserAccessManager } from '../molecules/UserAccessManager';
import { Drawer } from '@/components/ui/drawer';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

export const CompanyConfigDrawer: React.FC = () => {
  const { isConfigDrawerOpen, closeConfigDrawer, activeTab, setActiveTab, canManageModule } = useConfig();
  const { activeCompany } = useAuth();
  const { t } = useI18n();

  // Company Profile form state
  const [compName, setCompName] = useState(activeCompany?.name || 'Radhe Krishna Embroidery Works');
  const [compGstin, setCompGstin] = useState(activeCompany?.gstin || '24AABCR1234F1Z1');
  const [compAddress, setCompAddress] = useState('Plot No. 108, GIDC Industrial Estate, Bhatar Road, Surat - 395017');
  const [compPhone, setCompPhone] = useState('+91 98250 12345');
  const [compUpi, setCompUpi] = useState('9825012345@okaxis');

  if (!isConfigDrawerOpen) return null;

  // Configuration Menu Options with module permission mapping
  const menuItems = [
    {
      id: 'company_profile',
      moduleId: 'company_settings',
      label: '1. Factory Profile',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'company_settings',
      moduleId: 'company_settings',
      label: '2. Factory Parameters',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'role_management',
      moduleId: 'role_management',
      label: '3. RBAC Roles Matrix',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'permission_groups',
      moduleId: 'role_management',
      label: '4. Permission Groups',
      icon: <FolderGit2 className="w-4 h-4" />,
    },
    {
      id: 'user_access',
      moduleId: 'role_management',
      label: '5. Staff User Access',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'invoices_config',
      moduleId: 'invoices',
      label: '6. Invoices & GST',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'machines_config',
      moduleId: 'machines',
      label: '7. Embroidery Fleet',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'challans_config',
      moduleId: 'challans',
      label: '8. Fabric Challans',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: 'wage_config',
      moduleId: 'wage_hisab',
      label: '9. Wage & Uchapat',
      icon: <Calculator className="w-4 h-4" />,
    },
  ];

  // Filter menu items: A user can ONLY see a setting menu item if they have 'manage' action on that module!
  const visibleMenuItems = menuItems.filter((item) => canManageModule(item.moduleId));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Factory profile settings updated');
  };

  return (
    <Drawer
      isOpen={isConfigDrawerOpen}
      onClose={closeConfigDrawer}
      title="Factory Configuration & Parameters"
      subtitle={
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
          <Building className="w-3.5 h-3.5 text-[var(--text-main)]" />
          <span>{activeCompany?.name || compName}</span>
          <span>•</span>
          <span>GSTIN: {activeCompany?.gstin || compGstin}</span>
        </span>
      }
      icon={<Settings className="w-5 h-5 text-[var(--text-main)]" />}
      size="4xl"
      footer={
        <div className="flex items-center justify-between w-full font-sans">
          <button
            type="button"
            onClick={closeConfigDrawer}
            className="px-3.5 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-xs font-semibold rounded-md transition cursor-pointer shadow-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success('All parameter changes persisted');
              closeConfigDrawer();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-semibold rounded-md transition cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Close</span>
          </button>
        </div>
      }
    >
      {/* Drawer Body: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden -m-4 sm:-m-6 font-sans">
        {/* Left Menu Sidebar */}
        <div className="w-full md:w-64 lg:w-72 bg-[var(--bg-surface-elevated)]/30 border-r border-[var(--border)] p-3 space-y-1 shrink-0 overflow-y-auto max-h-48 md:max-h-none">
          <div className="px-2 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
            <span>Config Modules</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">({visibleMenuItems.length} Active)</span>
          </div>

          {visibleMenuItems.length > 0 ? (
            visibleMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full p-2 text-xs font-semibold flex items-center justify-between rounded-lg transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-surface)] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs ring-1 ring-emerald-500/20'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}>
                      {item.icon}
                    </div>
                    <div className="truncate text-xs">{item.label}</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg text-center text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <Lock className="w-5 h-5 text-rose-600 mx-auto" />
              <div className="font-semibold uppercase">Access Restricted</div>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                Your account lacks manage privileges on config modules.
              </p>
            </div>
          )}
        </div>

        {/* Right Main Configuration Section */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-card">
          {visibleMenuItems.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md p-6 bg-background border border-destructive text-center space-y-3" style={{ borderRadius: 0 }}>
                <div className="w-10 h-10 bg-background text-destructive border border-destructive flex items-center justify-center mx-auto" style={{ borderRadius: 0 }}>
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-black text-foreground text-sm uppercase">[MENU ACCESS LOCKED]</h3>
                <p className="text-2xs text-muted-foreground leading-relaxed">
                  Management controls require system administrator role assignment.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Company Profile Tab */}
              {activeTab === 'company_profile' && (
                <div className="space-y-4">
                  <div className="bg-background p-3.5 border border-border" style={{ borderRadius: 0 }}>
                    <h3 className="font-black text-foreground text-xs uppercase flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {"/// FACTORY REGISTRATION & LEGAL PROFILE"}
                    </h3>
                    <p className="text-2xs text-muted-foreground font-mono mt-0.5">
                      Business name, GSTIN, registered Surat industrial estate address, and UPI settlement ID
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="bg-background border border-border p-4 space-y-3" style={{ borderRadius: 0 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-2xs font-bold uppercase text-foreground">
                          [REGISTERED COMPANY NAME]
                        </label>
                        <input
                          type="text"
                          value={compName}
                          onChange={(e) => setCompName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-card border border-border text-xs text-foreground font-mono uppercase focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-2xs font-bold uppercase text-foreground">
                          [GSTIN IDENTIFIER]
                        </label>
                        <input
                          type="text"
                          value={compGstin}
                          onChange={(e) => setCompGstin(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-card border border-border text-xs font-mono font-bold text-accent uppercase focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-2xs font-bold uppercase text-foreground">
                          [CONTACT PHONE / HOTLINE]
                        </label>
                        <input
                          type="text"
                          value={compPhone}
                          onChange={(e) => setCompPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-card border border-border text-xs text-foreground font-mono focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-2xs font-bold uppercase text-foreground">
                          [DEFAULT SETTLEMENT UPI VPA]
                        </label>
                        <input
                          type="text"
                          value={compUpi}
                          onChange={(e) => setCompUpi(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-card border border-border text-xs font-mono text-foreground focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-2xs font-bold uppercase text-foreground">
                          [INDUSTRIAL UNIT ADDRESS]
                        </label>
                        <textarea
                          rows={2}
                          value={compAddress}
                          onChange={(e) => setCompAddress(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-card border border-border text-xs text-foreground font-mono uppercase focus:outline-none"
                          style={{ borderRadius: 0 }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase transition cursor-pointer"
                        style={{ borderRadius: 0 }}
                      >
                        [SAVE FACTORY PROFILE]
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. Company Parameters Tab */}
              {activeTab === 'company_settings' && <CompanyParametersForm />}

              {/* 3. Roles & Permissions Tab */}
              {activeTab === 'role_management' && <RolesPermissionMatrix />}

              {/* 4. Permission Groups Tab */}
              {activeTab === 'permission_groups' && <PermissionGroupManager />}

              {/* 5. User Access Control Tab */}
              {activeTab === 'user_access' && <UserAccessManager />}

              {/* 6. Module Specific Configuration Sub-sections */}
              {activeTab === 'invoices_config' && (
                <div className="space-y-3">
                  <div className="bg-background p-3.5 border border-border" style={{ borderRadius: 0 }}>
                    <h3 className="font-black text-foreground text-xs uppercase flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {"/// INVOICES & GST PARAMETERS"}
                    </h3>
                  </div>
                  <CompanyParametersForm />
                </div>
              )}

              {activeTab === 'machines_config' && (
                <div className="space-y-3">
                  <div className="bg-background p-3.5 border border-border" style={{ borderRadius: 0 }}>
                    <h3 className="font-black text-foreground text-xs uppercase flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      {"/// EMBROIDERY MACHINE PARAMETERS"}
                    </h3>
                  </div>
                  <CompanyParametersForm />
                </div>
              )}

              {activeTab === 'challans_config' && (
                <div className="space-y-3">
                  <div className="bg-background p-3.5 border border-border" style={{ borderRadius: 0 }}>
                    <h3 className="font-black text-foreground text-xs uppercase flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      {"/// JOB WORK CHALLAN PARAMETERS"}
                    </h3>
                  </div>
                  <CompanyParametersForm />
                </div>
              )}

              {activeTab === 'wage_config' && (
                <div className="space-y-3">
                  <div className="bg-background p-3.5 border border-border" style={{ borderRadius: 0 }}>
                    <h3 className="font-black text-foreground text-xs uppercase flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      {"/// WAGE & UCHAPAT SETTLEMENT PARAMETERS"}
                    </h3>
                  </div>
                  <CompanyParametersForm />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
};

