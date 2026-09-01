'use client';

import React, { useState } from 'react';
import { useConfig } from '@/lib/config-context';
import { useAuth } from '@/lib/auth-context';
import {
  X,
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
  HelpCircle,
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
  const { isConfigDrawerOpen, closeConfigDrawer, activeTab, setActiveTab, canManageModule, companyParameters, updateParameter } = useConfig();
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
      label: t.config_menuCompanyProfile,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'company_settings',
      moduleId: 'company_settings',
      label: t.config_menuCompanyParameters,
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'role_management',
      moduleId: 'role_management',
      label: t.config_menuRoleManagement,
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'permission_groups',
      moduleId: 'role_management',
      label: t.config_menuPermissionGroups,
      icon: <FolderGit2 className="w-4 h-4" />,
    },
    {
      id: 'user_access',
      moduleId: 'role_management',
      label: t.config_menuStaffAccess,
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'invoices_config',
      moduleId: 'invoices',
      label: t.config_menuInvoicesConfig,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'machines_config',
      moduleId: 'machines',
      label: t.config_menuMachinesConfig,
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'challans_config',
      moduleId: 'challans',
      label: t.config_menuChallansConfig,
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: 'wage_config',
      moduleId: 'wage_hisab',
      label: t.config_menuWageConfig,
      icon: <Calculator className="w-4 h-4" />,
    },
  ];

  // Filter menu items: A user can ONLY see a setting menu item if they have 'manage' action on that module!
  const visibleMenuItems = menuItems.filter((item) => canManageModule(item.moduleId));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t.config_profileUpdated);
  };

  return (
    <Drawer
      isOpen={isConfigDrawerOpen}
      onClose={closeConfigDrawer}
      title={t.config_title}
      subtitle={
        <span className="flex items-center gap-1.5 font-mono text-2xs text-slate-500">
          <Building className="w-3.5 h-3.5 text-[#0099B8]" />
          <span>{activeCompany?.name || compName}</span>
          <span>•</span>
          <span>GSTIN: {activeCompany?.gstin || compGstin}</span>
        </span>
      }
      icon={<Settings className="w-5 h-5 text-[#0099B8]" />}
      size="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={closeConfigDrawer}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success(t.config_allChangesSaved);
              closeConfigDrawer();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white text-xs font-bold rounded-lg transition shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.config_saveAndClose}</span>
          </button>
        </div>
      }
    >
      {/* Drawer Body: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden -m-5">
        {/* Left Menu Sidebar */}
          <div className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 p-3 space-y-1 shrink-0 overflow-y-auto max-h-48 md:max-h-none">
            <div className="px-3 py-1.5 text-3xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{t.config_menus}</span>
              <span className="text-[#0099B8] font-mono">({visibleMenuItems.length} {t.config_available})</span>
            </div>

            {visibleMenuItems.length > 0 ? (
              visibleMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full p-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition text-left ${
                      isActive
                        ? 'bg-[#0099B8]/10 text-[#0099B8] font-bold shadow-2xs border border-[#0099B8]/20'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#0099B8] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {item.icon}
                      </div>
                      <div className="truncate text-xs font-medium">{item.label}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-800 space-y-1">
                <Lock className="w-5 h-5 text-rose-600 mx-auto" />
                <div className="font-bold">{t.config_accessRestricted}</div>
                <p className="text-3xs text-rose-600">
                  {t.config_accessRestrictedDesc}
                </p>
              </div>
            )}
          </div>

          {/* Right Main Configuration Section */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#F8FAFC]">
            {visibleMenuItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="max-w-md p-6 bg-white border border-rose-200 rounded-2xl text-center space-y-3 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{t.config_menuHiddenTitle}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t.config_menuHiddenDesc}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Company Profile Tab */}
                {activeTab === 'company_profile' && (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#0099B8]" />
                        {t.config_legalInfoTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.config_legalInfoDesc}
                      </p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-2xs font-semibold text-slate-700 mb-1">
                            {t.config_regCompanyName}
                          </label>
                          <input
                            type="text"
                            value={compName}
                            onChange={(e) => setCompName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0099B8] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-2xs font-semibold text-slate-700 mb-1">
                            {t.config_gstinNumber}
                          </label>
                          <input
                            type="text"
                            value={compGstin}
                            onChange={(e) => setCompGstin(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#0099B8] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-2xs font-semibold text-slate-700 mb-1">
                            {t.config_contactPhone}
                          </label>
                          <input
                            type="text"
                            value={compPhone}
                            onChange={(e) => setCompPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#0099B8] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-2xs font-semibold text-slate-700 mb-1">
                            {t.config_upiVpa}
                          </label>
                          <input
                            type="text"
                            value={compUpi}
                            onChange={(e) => setCompUpi(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-[#0099B8] outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-2xs font-semibold text-slate-700 mb-1">
                            {t.config_factoryAddress}
                          </label>
                          <textarea
                            rows={2}
                            value={compAddress}
                            onChange={(e) => setCompAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#0099B8] outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white text-xs font-bold rounded-lg transition shadow-xs"
                        >
                          {t.config_saveProfileBtn}
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
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#0099B8]" />
                        {t.config_invoicesConfigTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.config_invoicesConfigDesc}
                      </p>
                    </div>
                    <CompanyParametersForm />
                  </div>
                )}

                {activeTab === 'machines_config' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-[#0099B8]" />
                        {t.config_machinesConfigTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.config_machinesConfigDesc}
                      </p>
                    </div>
                    <CompanyParametersForm />
                  </div>
                )}

                {activeTab === 'challans_config' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#0099B8]" />
                        {t.config_challansConfigTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.config_challansConfigDesc}
                      </p>
                    </div>
                    <CompanyParametersForm />
                  </div>
                )}

                {activeTab === 'wage_config' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-[#0099B8]" />
                        {t.config_wageConfigTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.config_wageConfigDesc}
                      </p>
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
