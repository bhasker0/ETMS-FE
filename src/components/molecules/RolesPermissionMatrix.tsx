'use client';

import React, { useState } from 'react';
import {
  useConfig,
  SYSTEM_MODULES,
  PERMISSION_ACTIONS,
  PermissionAction,
  CustomRole,
  RolePermissionsMap,
} from '@/lib/config-context';
import { ShieldCheck, Plus, Check, Trash2, Edit3, Lock, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export const RolesPermissionMatrix: React.FC = () => {
  const { roles, addRole, updateRole, deleteRole } = useConfig();
  const { t, language } = useI18n();
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(roles[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state
  const [roleName, setRoleName] = useState('');
  const [roleNameGu, setRoleNameGu] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [description, setDescription] = useState('');
  const [permissionsMap, setPermissionsMap] = useState<RolePermissionsMap>({});

  const startEdit = (role: CustomRole) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleNameGu(role.nameGu);
    setRoleCode(role.code);
    setDescription(role.description);
    setPermissionsMap(JSON.parse(JSON.stringify(role.permissions)));
    setIsEditing(true);
    setIsCreatingNew(false);
  };

  const startCreate = () => {
    const emptyMap: RolePermissionsMap = SYSTEM_MODULES.reduce((acc, m) => {
      acc[m.id] = ['view'];
      return acc;
    }, {} as RolePermissionsMap);

    setSelectedRole(null);
    setRoleName('');
    setRoleNameGu('');
    setRoleCode('');
    setDescription('');
    setPermissionsMap(emptyMap);
    setIsEditing(true);
    setIsCreatingNew(true);
  };

  const toggleActionPermission = (moduleId: string, action: PermissionAction) => {
    setPermissionsMap((prev) => {
      const currentActions = prev[moduleId] || [];
      const hasIt = currentActions.includes(action);
      const nextActions = hasIt
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        [moduleId]: nextActions,
      };
    });
  };

  const toggleModuleRow = (moduleId: string) => {
    setPermissionsMap((prev) => {
      const currentActions = prev[moduleId] || [];
      const allActions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'manage'];
      const isFullySelected = allActions.every((a) => currentActions.includes(a));

      return {
        ...prev,
        [moduleId]: isFullySelected ? [] : allActions,
      };
    });
  };

  const toggleActionColumn = (action: PermissionAction) => {
    const allModuleIds = SYSTEM_MODULES.map((m) => m.id);
    const allHaveIt = allModuleIds.every((id) => (permissionsMap[id] || []).includes(action));

    setPermissionsMap((prev) => {
      const updated = { ...prev };
      allModuleIds.forEach((id) => {
        const currentActions = updated[id] || [];
        if (allHaveIt) {
          updated[id] = currentActions.filter((a) => a !== action);
        } else {
          if (!currentActions.includes(action)) {
            updated[id] = [...currentActions, action];
          }
        }
      });
      return updated;
    });
  };

  const applyPreset = (presetType: 'admin' | 'supervisor' | 'munim' | 'operator' | 'view_only') => {
    const updated: RolePermissionsMap = {};

    SYSTEM_MODULES.forEach((m) => {
      if (presetType === 'admin') {
        updated[m.id] = ['view', 'create', 'edit', 'delete', 'manage'];
      } else if (presetType === 'supervisor') {
        if (['shift_logs', 'machines', 'challans'].includes(m.id)) {
          updated[m.id] = ['view', 'create', 'edit', 'manage'];
        } else {
          updated[m.id] = ['view'];
        }
      } else if (presetType === 'munim') {
        if (['invoices', 'wage_hisab', 'uchapat', 'munim_portal'].includes(m.id)) {
          updated[m.id] = ['view', 'create', 'edit', 'delete', 'manage'];
        } else {
          updated[m.id] = ['view'];
        }
      } else if (presetType === 'operator') {
        if (['shift_logs', 'uchapat'].includes(m.id)) {
          updated[m.id] = ['view', 'create'];
        } else {
          updated[m.id] = ['view'];
        }
      } else if (presetType === 'view_only') {
        updated[m.id] = ['view'];
      }
    });

    setPermissionsMap(updated);
    toast.success(`[PRESET] Applied ${presetType.toUpperCase()} permissions template`);
  };

  const handleSave = () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (isCreatingNew) {
      addRole({
        name: roleName,
        nameGu: roleNameGu || roleName,
        code: roleCode || roleName.toUpperCase().replace(/\s+/g, '_').slice(0, 15),
        description: description || 'Custom embroidery factory role',
        permissions: permissionsMap,
      });
      toast.success('[CREATED] Custom role registered');
    } else if (selectedRole) {
      updateRole(selectedRole.id, {
        name: roleName,
        nameGu: roleNameGu,
        description,
        permissions: permissionsMap,
      });
      toast.success('[UPDATED] Role privileges updated');
    }

    setIsEditing(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-5 border border-[var(--border)] rounded-xl shadow-xs">
        <div>
          <h3 className="font-bold text-[var(--text-main)] text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Configure action privileges (<span className="font-mono text-emerald-600 font-semibold">View</span>, <span className="font-mono text-emerald-600 font-semibold">Create</span>, <span className="font-mono text-emerald-600 font-semibold">Edit</span>, <span className="font-mono text-emerald-600 font-semibold">Delete</span>, <span className="font-mono text-emerald-600 font-semibold">Manage</span>) per module.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="px-3.5 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Role</span>
        </button>
      </div>

      {/* Special Rule Notice Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-semibold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider text-[0.6875rem] mr-1">Manage Privilege Rule:</strong> The <span className="font-semibold">Manage</span> permission grants exclusive authority to access configuration settings inside this drawer. Standard users with only <span className="font-semibold">View</span> can use pages, but will have the management drawer menu section concealed.
        </div>
      </div>

      {/* Main Grid: Left List + Right Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role List Selection Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Roles Directory ({roles.length})
          </div>
          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = (selectedRole?.id === r.id && !isCreatingNew) || (isEditing && selectedRole?.id === r.id);
              const displayName = language === 'gu' && r.nameGu ? r.nameGu : r.name;
              return (
                <div
                  key={r.id}
                  onClick={() => startEdit(r)}
                  className={`p-4 border rounded-xl transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-[var(--bg-surface)] border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--text-muted)]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[var(--text-main)] text-xs flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {r.isSystem && (
                          <span className="badge-pastel-green px-1.5 py-0.2 rounded text-[0.625rem] font-semibold">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{r.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
                    <span className="uppercase text-[0.6875rem] font-semibold">{r.code}</span>
                    <span className="text-[0.6875rem]">
                      {Object.values(r.permissions).reduce((acc, curr) => acc + curr.length, 0)} Actions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matrix & Form Details Editor */}
        <div className="lg:col-span-8">
          {isEditing ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h4 className="font-bold text-[var(--text-main)] text-sm">
                    {isCreatingNew ? 'Create Custom Factory Role' : `Edit Role: ${roleName}`}
                  </h4>
                  <span className="text-xs text-[var(--text-muted)]">
                    Set granular module action privileges
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-[var(--text-main)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] font-semibold rounded-md transition cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3.5 py-1.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-semibold rounded-md transition cursor-pointer shadow-sm"
                  >
                    Save Privileges
                  </button>
                </div>
              </div>

              {/* Role Details Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[var(--text-main)] text-[0.6875rem]">
                    Role Identifier / Title
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Floor Shift Supervisor"
                    className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[var(--text-main)] text-[0.6875rem]">
                    Role Scope Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe authorized tasks for this role"
                    className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* Quick Presets Bar */}
              <div className="p-3 bg-[var(--bg-surface-elevated)]/50 border border-[var(--border)] rounded-xl space-y-2">
                <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quick Preset Archetypes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('admin')}
                    className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium rounded transition cursor-pointer shadow-xs"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('supervisor')}
                    className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium rounded transition cursor-pointer shadow-xs"
                  >
                    Supervisor
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('munim')}
                    className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium rounded transition cursor-pointer shadow-xs"
                  >
                    Munim
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('operator')}
                    className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium rounded transition cursor-pointer shadow-xs"
                  >
                    Operator
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('view_only')}
                    className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] text-xs font-medium rounded transition cursor-pointer shadow-xs"
                  >
                    Auditor
                  </button>
                </div>
              </div>

              {/* Module Action Matrix Table */}
              <div className="border border-[var(--border)] rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold text-[0.6875rem] uppercase">
                      <th className="p-3 w-1/3">
                        System Module
                      </th>
                      {PERMISSION_ACTIONS.map((pa) => {
                        return (
                          <th key={pa.action} className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleActionColumn(pa.action)}
                              className="group flex flex-col items-center mx-auto hover:opacity-80 transition cursor-pointer"
                            >
                              <span className="font-semibold text-xs text-[var(--text-main)] uppercase">
                                {pa.action}
                              </span>
                              <span className="text-[0.625rem] text-[var(--text-muted)] group-hover:underline">
                                toggle all
                              </span>
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-surface)] font-sans">
                    {SYSTEM_MODULES.map((m) => {
                      const activeActions = permissionsMap[m.id] || [];
                      const isFullySelected = PERMISSION_ACTIONS.every((pa) =>
                        activeActions.includes(pa.action)
                      );
                      const moduleTitle = language === 'gu' && m.nameGu ? m.nameGu : m.name;

                      return (
                        <tr key={m.id} className="hover:bg-[var(--bg-surface-elevated)]/40 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => toggleModuleRow(m.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 cursor-pointer ${
                                  isFullySelected
                                    ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-surface)]'
                                    : 'border-[var(--border)] bg-[var(--bg-canvas)]'
                                }`}
                                title="Toggle entire module"
                              >
                                {isFullySelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <div>
                                <div className="font-semibold text-[var(--text-main)] text-xs">
                                  <span>{moduleTitle}</span>
                                </div>
                                <p className="text-[0.6875rem] text-[var(--text-muted)]">{m.description}</p>
                              </div>
                            </div>
                          </td>

                          {PERMISSION_ACTIONS.map((pa) => {
                            const isChecked = activeActions.includes(pa.action);

                            return (
                              <td key={pa.action} className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleActionPermission(m.id, pa.action)}
                                  className={`w-7 h-7 rounded-md font-bold text-xs inline-flex items-center justify-center transition cursor-pointer ${
                                    isChecked
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                      : 'bg-[var(--bg-canvas)] text-[var(--text-muted)]/30 border border-[var(--border)] hover:border-[var(--text-muted)]/50'
                                  }`}
                                >
                                  {isChecked ? '✓' : '—'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Selected Role Overview Read-only Matrix */
            selectedRole && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h4 className="font-bold text-[var(--text-main)] text-sm">
                      {language === 'gu' && selectedRole.nameGu ? selectedRole.nameGu : selectedRole.name}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedRole.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedRole.isSystem && (
                      <button
                        onClick={() => deleteRole(selectedRole.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-md transition cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(selectedRole)}
                      className="px-3 py-1.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Configure Matrix</span>
                    </button>
                  </div>
                </div>

                {/* Read-Only Summary Table */}
                <div className="space-y-3">
                  <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Active Privileges Matrix
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SYSTEM_MODULES.map((m) => {
                      const actions = selectedRole.permissions[m.id] || [];
                      const moduleName = language === 'gu' && m.nameGu ? m.nameGu : m.name;
                      return (
                        <div
                          key={m.id}
                          className="p-3.5 bg-[var(--bg-surface-elevated)]/50 border border-[var(--border)] rounded-xl flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div>
                            <div className="font-semibold text-[var(--text-main)] text-xs">{moduleName}</div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                            {actions.length > 0 ? (
                              actions.map((act) => {
                                return (
                                  <span
                                    key={act}
                                    className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                                      act === 'manage'
                                        ? 'badge-pastel-green'
                                        : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border)]'
                                    }`}
                                  >
                                    {act}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[0.6875rem] text-[var(--text-muted)] italic">No Access</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

