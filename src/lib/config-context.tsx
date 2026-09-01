'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export interface SystemModule {
  id: string;
  name: string;
  nameGu: string;
  description: string;
  category: 'core' | 'finance' | 'admin';
}

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    nameGu: 'ડેશબોર્ડ (ઓવરવ્યુ)',
    description: 'Analytics, KPI summaries, active shifts and revenue metrics',
    category: 'core',
  },
  {
    id: 'shift_logs',
    name: 'Shift Logs & Production',
    nameGu: 'શિફ્ટ લોગ્સ અને પ્રોડક્શન',
    description: 'Production counters, stitch entries, and operator shift notes',
    category: 'core',
  },
  {
    id: 'machines',
    name: 'Machines Master',
    nameGu: 'મશીન માસ્ટર',
    description: 'Machine head counts, RPM, maintenance status, and karigar assignment',
    category: 'core',
  },
  {
    id: 'challans',
    name: 'Inward Lots & Challans',
    nameGu: 'આવક લોટ્સ અને ચલણ',
    description: 'Trader gray cloth inward, shrinkage calculations, and lot status',
    category: 'core',
  },
  {
    id: 'uchapat',
    name: 'Karigar Uchapat (Advances)',
    nameGu: 'કારીગર ઉપાડ (એડવાન્સ)',
    description: 'Cash advances, vouchers, and karigar loan tracking',
    category: 'finance',
  },
  {
    id: 'invoices',
    name: 'Invoices (SAC 9988)',
    nameGu: 'ઇનવોઇસ અને બિલિંગ (SAC 9988)',
    description: 'Job work billing, GST 5% calculations, and WhatsApp invoice dispatch',
    category: 'finance',
  },
  {
    id: 'wage_hisab',
    name: 'Wage Hisab & Settlement',
    nameGu: 'મજૂરી હિસાબ અને સેટલમેન્ટ',
    description: 'Fortnightly karigar wage calculation, deductions, and payout slips',
    category: 'finance',
  },
  {
    id: 'munim_portal',
    name: 'Munim Portal & Exports',
    nameGu: 'મુનીમ પોર્ટલ અને એક્સપોર્ટ',
    description: 'External CA/Munim sync, Tally XML generation, and GSTR-1 reports',
    category: 'finance',
  },
  {
    id: 'company_settings',
    name: 'Company Parameters & Profile',
    nameGu: 'કંપની પેરામીટર્સ અને પ્રોફાઇલ',
    description: 'Company information, GSTIN, stitch rates, shrinkage alert %, shift hours',
    category: 'admin',
  },
  {
    id: 'role_management',
    name: 'User Access & Roles',
    nameGu: 'યુઝર એક્સેસ અને રોલ્સ',
    description: 'Custom roles, permission groups, and staff access control',
    category: 'admin',
  },
];

export const PERMISSION_ACTIONS: { action: PermissionAction; label: string; labelGu: string; color: string }[] = [
  { action: 'view', label: 'View', labelGu: 'જુઓ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { action: 'create', label: 'Create', labelGu: 'ઉમેરો', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { action: 'edit', label: 'Edit', labelGu: 'એડિટ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { action: 'delete', label: 'Delete', labelGu: 'ડિલીટ', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { action: 'manage', label: 'Manage', labelGu: 'મેનેજ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export type RolePermissionsMap = Record<string, PermissionAction[]>;

export interface CustomRole {
  id: string;
  name: string;
  nameGu: string;
  code: string;
  description: string;
  isSystem?: boolean;
  permissions: RolePermissionsMap;
}

export interface PermissionGroup {
  id: string;
  name: string;
  nameGu: string;
  description: string;
  associatedRoleIds: string[];
  modulePermissions: RolePermissionsMap;
}

export interface CompanyParameter {
  id: string;
  key: string;
  label: string;
  labelGu: string;
  value: string | number | boolean;
  unit?: string;
  description: string;
  category: 'billing' | 'production' | 'integration' | 'general';
  isSuperAdminOnly: boolean; // Excluded from company settings if true
}

export interface CompanyUserAccess {
  userId: string;
  userName: string;
  userPhone: string;
  designation: string;
  roleId: string;
  permissionGroupId?: string;
  customOverrides?: RolePermissionsMap;
  status: 'active' | 'suspended';
}

interface ConfigContextType {
  isConfigDrawerOpen: boolean;
  openConfigDrawer: () => void;
  closeConfigDrawer: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Roles
  roles: CustomRole[];
  addRole: (role: Omit<CustomRole, 'id'>) => void;
  updateRole: (id: string, updated: Partial<CustomRole>) => void;
  deleteRole: (id: string) => void;
  
  // Permission Groups
  permissionGroups: PermissionGroup[];
  addPermissionGroup: (group: Omit<PermissionGroup, 'id'>) => void;
  updatePermissionGroup: (id: string, updated: Partial<PermissionGroup>) => void;
  deletePermissionGroup: (id: string) => void;

  // Parameters
  companyParameters: CompanyParameter[];
  updateParameter: (key: string, value: any) => void;
  
  // Users Access
  userAccessList: CompanyUserAccess[];
  updateUserAccess: (userId: string, roleId: string, permissionGroupId?: string) => void;

  // Permission Checker
  hasModulePermission: (moduleId: string, action: PermissionAction) => boolean;
  canManageModule: (moduleId: string) => boolean;
}

const INITIAL_ROLES: CustomRole[] = [
  {
    id: 'role-owner',
    name: 'Company Owner / Admin',
    nameGu: 'કંપની માલિક / એડમિન',
    code: 'COMPANY_ADMIN',
    description: 'Full administrative access to all modules, financial data, and settings',
    isSystem: true,
    permissions: SYSTEM_MODULES.reduce((acc, m) => {
      acc[m.id] = ['view', 'create', 'edit', 'delete', 'manage'];
      return acc;
    }, {} as RolePermissionsMap),
  },
  {
    id: 'role-supervisor',
    name: 'Shift Supervisor',
    nameGu: 'શિફ્ટ સુપરવાઇઝર',
    code: 'SUPERVISOR',
    description: 'Manages shift logs, machines, karigars, and inward lots. Cannot delete financial records',
    isSystem: true,
    permissions: {
      dashboard: ['view'],
      shift_logs: ['view', 'create', 'edit', 'manage'],
      machines: ['view', 'create', 'edit', 'manage'],
      challans: ['view', 'create', 'edit'],
      uchapat: ['view', 'create'],
      invoices: ['view'],
      wage_hisab: ['view'],
      munim_portal: [],
      company_settings: ['view'],
      role_management: [],
    },
  },
  {
    id: 'role-munim',
    name: 'Munim / Accountant',
    nameGu: 'મુનીમ / એકાઉન્ટન્ટ',
    code: 'MUNIM',
    description: 'Manages invoices, wage calculations, uchapat settlements, and CA Tally exports',
    isSystem: true,
    permissions: {
      dashboard: ['view'],
      shift_logs: ['view'],
      machines: ['view'],
      challans: ['view', 'edit'],
      uchapat: ['view', 'create', 'edit', 'delete', 'manage'],
      invoices: ['view', 'create', 'edit', 'delete', 'manage'],
      wage_hisab: ['view', 'create', 'edit', 'delete', 'manage'],
      munim_portal: ['view', 'create', 'edit', 'manage'],
      company_settings: ['view', 'edit', 'manage'],
      role_management: ['view'],
    },
  },
  {
    id: 'role-operator',
    name: 'Karigar / Operator',
    nameGu: 'કારીગર / ઓપરેટર',
    code: 'KARIGAR_OPERATOR',
    description: 'Can log shift counters and view assigned machine status',
    isSystem: true,
    permissions: {
      dashboard: ['view'],
      shift_logs: ['view', 'create'],
      machines: ['view'],
      challans: ['view'],
      uchapat: ['view'],
      invoices: [],
      wage_hisab: [],
      munim_portal: [],
      company_settings: [],
      role_management: [],
    },
  },
];

const INITIAL_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'pg-floor-ops',
    name: 'Shop Floor Operations Group',
    nameGu: 'શોપ ફ્લોર ઓપરેશન્સ ગ્રુપ',
    description: 'Group for floor managers overseeing machines, shift logs, and gray fabric receiving',
    associatedRoleIds: ['role-supervisor', 'role-operator'],
    modulePermissions: {
      shift_logs: ['view', 'create', 'edit', 'manage'],
      machines: ['view', 'create', 'edit', 'manage'],
      challans: ['view', 'create', 'edit'],
    },
  },
  {
    id: 'pg-finance-tax',
    name: 'Accounts & Tax Compliance Group',
    nameGu: 'એકાઉન્ટ્સ અને ટેક્સ કોમ્પલાયન્સ ગ્રુપ',
    description: 'Group for Munims handling GST SAC 9988 invoices, wage hisab, and Tally export',
    associatedRoleIds: ['role-munim'],
    modulePermissions: {
      invoices: ['view', 'create', 'edit', 'delete', 'manage'],
      wage_hisab: ['view', 'create', 'edit', 'manage'],
      munim_portal: ['view', 'create', 'edit', 'manage'],
      uchapat: ['view', 'create', 'edit', 'manage'],
    },
  },
];

const INITIAL_COMPANY_PARAMETERS: CompanyParameter[] = [
  // --- VISIBLE COMPANY PARAMETERS ---
  {
    id: 'param-sac-code',
    key: 'default_sac_code',
    label: 'Default SAC Code for Job Work',
    labelGu: 'જોબવર્ક માટે ડિફોલ્ટ SAC કોડ',
    value: '9988',
    description: 'Services auxiliary to embroidery and textile job work (GST 5%)',
    category: 'billing',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-stitch-rate',
    key: 'default_rate_per_thousand',
    label: 'Default Rate per 1000 Stitches (₹)',
    labelGu: 'દર ૧૦૦૦ સ્ટીચ દીઠ ડિફોલ્ટ મજૂરી દર (₹)',
    value: 0.45,
    unit: '₹ / 1k Stitches',
    description: 'Default job work rate used during new inward challans and invoice drafting',
    category: 'billing',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-karigar-rate',
    key: 'default_karigar_rate',
    label: 'Karigar Operator Wage Rate per 1000 Stitches (₹)',
    labelGu: 'કારીગર ઓપરેટરનો ડિફોલ્ટ દર (₹)',
    value: 0.18,
    unit: '₹ / 1k Stitches',
    description: 'Base piece-rate wage calculation for machine operators',
    category: 'production',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-shrinkage-alert',
    key: 'shrinkage_alert_threshold',
    label: 'Fabric Shrinkage Alert Threshold (%)',
    labelGu: 'કાપડ શ્રિંકેજ એલર્ટ થ્રેશોલ્ડ (%)',
    value: 3.0,
    unit: '%',
    description: 'Flag alert whenever gray to finished fabric loss exceeds this percentage',
    category: 'production',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-shift-hours',
    key: 'shift_duration_hours',
    label: 'Standard Shift Duration',
    labelGu: 'સ્ટાન્ડર્ડ શિફ્ટ સમયગાળો',
    value: 12,
    unit: 'Hours',
    description: 'Default shift length (12 hours Day / 12 hours Night shift pattern)',
    category: 'production',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-gst-rate',
    key: 'default_gst_rate',
    label: 'GST Rate for Job Work (%)',
    labelGu: 'જીએસટી દર (%)',
    value: 5.0,
    unit: '%',
    description: 'Applied CGST (2.5%) + SGST (2.5%) for intrastate job work bills',
    category: 'billing',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-tally-auto-sync',
    key: 'tally_auto_sync_enabled',
    label: 'Tally ERP / Prime Auto-Sync',
    labelGu: 'ટેલી ઓટો-સિન્ક ઓન/ઓફ',
    value: true,
    description: 'Automatically stage approved invoices into Tally XML import queue',
    category: 'integration',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-whatsapp-dispatch',
    key: 'whatsapp_invoice_dispatch',
    label: 'Auto WhatsApp Invoice Dispatch',
    labelGu: 'વોટ્સએપ ઇનવોઇસ મોકલવું',
    value: true,
    description: 'Send PDF invoice copy automatically to trader mobile number upon creation',
    category: 'general',
    isSuperAdminOnly: false,
  },
  {
    id: 'param-terms-text',
    key: 'invoice_terms_condition',
    label: 'Standard Invoice Terms & Conditions',
    labelGu: 'ઇનવોઇસ શરતો અને નિયમો',
    value: 'જોબવર્ક માલની ડિલિવરી બાદ ૩ દિવસમાં હિસાબ ક્લિયર કરવો. વિવાદ માટે સુરત ન્યાયાલય અધિકારક્ષેત્ર રહેશે.',
    description: 'Printed at the bottom of SAC 9988 job work invoices',
    category: 'billing',
    isSuperAdminOnly: false,
  },

  // --- RESTRICTED SAAS SUPER ADMIN / SUPPORT PARAMETERS (HIDDEN FROM COMPANY DRAWER) ---
  {
    id: 'sys-tenant-isolation',
    key: 'saas_tenant_isolation_mode',
    label: 'Multi-Tenant Database Isolation Strategy',
    labelGu: 'મલ્ટી-ટેનન્ટ ડીબી આઇસોલેશન',
    value: 'SCHEMA_PER_TENANT',
    description: 'SaaS Platform core database partition engine mode',
    category: 'general',
    isSuperAdminOnly: true, // EXCLUDED!
  },
  {
    id: 'sys-master-api-key',
    key: 'saas_master_support_key',
    label: 'SaaS Platform Support Master Encryption Secret',
    labelGu: 'સાસ માસ્ટર સપોર્ટ કી',
    value: 'sec_live_9988_surat_emb_super_admin_secret_key',
    description: 'Platform emergency support bypass key',
    category: 'general',
    isSuperAdminOnly: true, // EXCLUDED!
  },
  {
    id: 'sys-rate-limit',
    key: 'saas_cluster_rate_limit',
    label: 'API Gateway Rate Limits',
    labelGu: 'એપીઆઈ રેટ લિમિટ',
    value: 5000,
    unit: 'req/min',
    description: 'Infrastructure level load balancing rate limits',
    category: 'integration',
    isSuperAdminOnly: true, // EXCLUDED!
  },
  {
    id: 'sys-license-tier',
    key: 'saas_subscription_license',
    label: 'SaaS Enterprise Subscription Token',
    labelGu: 'સાસ સબ્સ્ક્રિપ્શન લાયસન્સ',
    value: 'TIER_ENTERPRISE_SURAT_PRO',
    description: 'Billing plan authorization signature',
    category: 'general',
    isSuperAdminOnly: true, // EXCLUDED!
  },
];

const INITIAL_USER_ACCESS: CompanyUserAccess[] = [
  {
    userId: 'u-1',
    userName: 'Bhavesh Patel (Owner)',
    userPhone: '+91 98250 12345',
    designation: 'Managing Director / Owner',
    roleId: 'role-owner',
    permissionGroupId: undefined,
    status: 'active',
  },
  {
    userId: 'u-2',
    userName: 'Sanjay Mehta (Supervisor)',
    userPhone: '+91 98250 99001',
    designation: 'Floor Shift Supervisor',
    roleId: 'role-supervisor',
    permissionGroupId: 'pg-floor-ops',
    status: 'active',
  },
  {
    userId: 'u-3',
    userName: 'Kantibhai (Munim/CA)',
    userPhone: '+91 98250 99999',
    designation: 'Chief Accountant & Tax Consultant',
    roleId: 'role-munim',
    permissionGroupId: 'pg-finance-tax',
    status: 'active',
  },
  {
    userId: 'u-4',
    userName: 'Mahesh Patil (Karigar)',
    userPhone: '+91 98254 11223',
    designation: 'Head Machine Operator (Machine 1)',
    roleId: 'role-operator',
    status: 'active',
  },
];

const ConfigContext = createContext<ConfigContextType>({
  isConfigDrawerOpen: false,
  openConfigDrawer: () => {},
  closeConfigDrawer: () => {},
  activeTab: 'company_profile',
  setActiveTab: () => {},
  roles: [],
  addRole: () => {},
  updateRole: () => {},
  deleteRole: () => {},
  permissionGroups: [],
  addPermissionGroup: () => {},
  updatePermissionGroup: () => {},
  deletePermissionGroup: () => {},
  companyParameters: [],
  updateParameter: () => {},
  userAccessList: [],
  updateUserAccess: () => {},
  hasModulePermission: () => false,
  canManageModule: () => false,
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeCompany, user } = useAuth();
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('company_profile');

  const [roles, setRoles] = useState<CustomRole[]>(INITIAL_ROLES);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(INITIAL_PERMISSION_GROUPS);
  const [companyParameters, setCompanyParameters] = useState<CompanyParameter[]>(INITIAL_COMPANY_PARAMETERS);
  const [userAccessList, setUserAccessList] = useState<CompanyUserAccess[]>(INITIAL_USER_ACCESS);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedRoles = localStorage.getItem('etms_custom_roles');
      if (savedRoles) setRoles(JSON.parse(savedRoles));

      const savedGroups = localStorage.getItem('etms_permission_groups');
      if (savedGroups) setPermissionGroups(JSON.parse(savedGroups));

      const savedParams = localStorage.getItem('etms_company_parameters');
      if (savedParams) setCompanyParameters(JSON.parse(savedParams));

      const savedUsers = localStorage.getItem('etms_user_access_list');
      if (savedUsers) setUserAccessList(JSON.parse(savedUsers));
    } catch (e) {
      console.warn('Failed to load saved config from localStorage', e);
    }
  }, []);

  // Save changes to localStorage
  const saveState = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const openConfigDrawer = useCallback(() => setIsConfigDrawerOpen(true), []);
  const closeConfigDrawer = useCallback(() => setIsConfigDrawerOpen(false), []);

  const addRole = (newRole: Omit<CustomRole, 'id'>) => {
    const createdRole: CustomRole = {
      ...newRole,
      id: `role-${Date.now()}`,
    };
    const nextRoles = [...roles, createdRole];
    setRoles(nextRoles);
    saveState('etms_custom_roles', nextRoles);
  };

  const updateRole = (id: string, updated: Partial<CustomRole>) => {
    const nextRoles = roles.map((r) => (r.id === id ? { ...r, ...updated } : r));
    setRoles(nextRoles);
    saveState('etms_custom_roles', nextRoles);
  };

  const deleteRole = (id: string) => {
    const nextRoles = roles.filter((r) => r.id !== id || r.isSystem);
    setRoles(nextRoles);
    saveState('etms_custom_roles', nextRoles);
  };

  const addPermissionGroup = (newGroup: Omit<PermissionGroup, 'id'>) => {
    const createdGroup: PermissionGroup = {
      ...newGroup,
      id: `pg-${Date.now()}`,
    };
    const nextGroups = [...permissionGroups, createdGroup];
    setPermissionGroups(nextGroups);
    saveState('etms_permission_groups', nextGroups);
  };

  const updatePermissionGroup = (id: string, updated: Partial<PermissionGroup>) => {
    const nextGroups = permissionGroups.map((g) => (g.id === id ? { ...g, ...updated } : g));
    setPermissionGroups(nextGroups);
    saveState('etms_permission_groups', nextGroups);
  };

  const deletePermissionGroup = (id: string) => {
    const nextGroups = permissionGroups.filter((g) => g.id !== id);
    setPermissionGroups(nextGroups);
    saveState('etms_permission_groups', nextGroups);
  };

  const updateParameter = (key: string, value: any) => {
    const nextParams = companyParameters.map((p) => (p.key === key ? { ...p, value } : p));
    setCompanyParameters(nextParams);
    saveState('etms_company_parameters', nextParams);
  };

  const updateUserAccess = (userId: string, roleId: string, permissionGroupId?: string) => {
    const nextUsers = userAccessList.map((u) =>
      u.userId === userId ? { ...u, roleId, permissionGroupId } : u
    );
    setUserAccessList(nextUsers);
    saveState('etms_user_access_list', nextUsers);
  };

  // Helper to check user permissions for a given module & action
  const hasModulePermission = useCallback(
    (moduleId: string, action: PermissionAction): boolean => {
      // 1. Owner & Super Admin have full permissions
      if (!activeCompany || activeCompany.role === 'COMPANY_ADMIN' || activeCompany.role === 'SUPER_ADMIN') {
        return true;
      }

      // 2. Find active user access record
      const currentUserAccess = userAccessList.find(
        (u) => u.userPhone === user?.mobile || u.userName.includes(user?.fullName || '')
      );

      // If specific custom role assigned
      if (currentUserAccess) {
        const assignedRole = roles.find((r) => r.id === currentUserAccess.roleId);
        if (assignedRole && assignedRole.permissions[moduleId]?.includes(action)) {
          return true;
        }

        // Check assigned permission group if any
        if (currentUserAccess.permissionGroupId) {
          const group = permissionGroups.find((g) => g.id === currentUserAccess.permissionGroupId);
          if (group && group.modulePermissions[moduleId]?.includes(action)) {
            return true;
          }
        }
      }

      // Fallback check against system role code in activeCompany
      const roleObj = roles.find((r) => r.code === activeCompany.role);
      if (roleObj && roleObj.permissions[moduleId]?.includes(action)) {
        return true;
      }

      return false;
    },
    [activeCompany, user, userAccessList, roles, permissionGroups]
  );

  // Helper to check if user has 'manage' action on a module (to view setting tab)
  const canManageModule = useCallback(
    (moduleId: string): boolean => {
      return hasModulePermission(moduleId, 'manage');
    },
    [hasModulePermission]
  );

  return (
    <ConfigContext.Provider
      value={{
        isConfigDrawerOpen,
        openConfigDrawer,
        closeConfigDrawer,
        activeTab,
        setActiveTab,
        roles,
        addRole,
        updateRole,
        deleteRole,
        permissionGroups,
        addPermissionGroup,
        updatePermissionGroup,
        deletePermissionGroup,
        companyParameters,
        updateParameter,
        userAccessList,
        updateUserAccess,
        hasModulePermission,
        canManageModule,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
