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

export const RolesPermissionMatrix: React.FC = () => {
  const { roles, addRole, updateRole, deleteRole } = useConfig();
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
        if (m.id === 'shift_logs') {
          updated[m.id] = ['view', 'create'];
        } else {
          updated[m.id] = ['view'];
        }
      } else {
        // view_only
        updated[m.id] = ['view'];
      }
    });

    setPermissionsMap(updated);
    toast.info(`Applied ${presetType.toUpperCase()} preset permissions`);
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
        code: roleCode || roleName.toUpperCase().replace(/\s+/g, '_'),
        description: description || 'Custom role created for company staff',
        permissions: permissionsMap,
      });
      toast.success('Custom Role created successfully');
    } else if (selectedRole) {
      updateRole(selectedRole.id, {
        name: roleName,
        nameGu: roleNameGu,
        description,
        permissions: permissionsMap,
      });
      toast.success('Custom Role updated successfully');
    }

    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0099B8]" />
            Custom Roles & Module Permissions Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure action privileges (<code className="text-[#0099B8] font-mono">view</code>, <code className="text-[#0099B8] font-mono">create</code>, <code className="text-[#0099B8] font-mono">edit</code>, <code className="text-[#0099B8] font-mono">delete</code>, <code className="text-purple-600 font-mono font-bold">manage</code>) for each system module.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="px-3.5 py-2 bg-[#0099B8] hover:bg-[#0E7090] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Role</span>
        </button>
      </div>

      {/* Special Rule Notice Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-900 leading-relaxed">
          <span className="font-bold">Understanding the `manage` Action Rule:</span>
          <br />
          The <span className="font-bold text-purple-700">`manage`</span> permission action specifically grants access to view & configure the module&apos;s settings inside this configuration drawer. If a user is assigned <span className="font-semibold">`view`</span> permission for a module (e.g. Users or Invoices), they can access standard pages in the app, but if <span className="font-bold text-purple-700">`manage`</span> action is OFF for that module, the setting drawer menu section remains completely hidden from them.
        </div>
      </div>

      {/* Main Grid: Left List + Right Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role List Selection Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Company Roles ({roles.length})
          </div>
          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = (selectedRole?.id === r.id && !isCreatingNew) || (isEditing && selectedRole?.id === r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => startEdit(r)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-[#0099B8] shadow-sm ring-1 ring-[#0099B8]/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{r.name}</span>
                        {r.isSystem && (
                          <span className="text-3xs bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-2xs text-[#0099B8] font-medium mt-0.5">{r.nameGu}</div>
                      <p className="text-2xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0099B8] shrink-0" />}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-3xs text-slate-400">
                    <span className="font-mono">{r.code}</span>
                    <span>
                      {Object.values(r.permissions).reduce((acc, curr) => acc + curr.length, 0)} Active Actions
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
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isCreatingNew ? 'Create New Custom Role' : `Edit Role: ${roleName}`}
                  </h4>
                  <span className="text-2xs text-slate-500">
                    Set granular module privileges & manage controls
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-[#0099B8] hover:bg-[#0E7090] text-white text-xs font-bold rounded-lg transition shadow-xs"
                  >
                    Save Role & Matrix
                  </button>
                </div>
              </div>

              {/* Role Details Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Role Name (English)
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Floor Shift Supervisor"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0099B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Role Name (Gujarati / Local)
                  </label>
                  <input
                    type="text"
                    value={roleNameGu}
                    onChange={(e) => setRoleNameGu(e.target.value)}
                    placeholder="e.g. શિફ્ટ ઇનચાર્જ"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0099B8] outline-none font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Description & Role Scope
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what staff members with this role can do"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0099B8] outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-2xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0099B8]" />
                  <span>Quick Permission Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('admin')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-3xs font-semibold rounded-md transition"
                  >
                    Full Admin Access
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('supervisor')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-3xs font-semibold rounded-md transition"
                  >
                    Floor Supervisor Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('munim')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-3xs font-semibold rounded-md transition"
                  >
                    Munim & Accounts Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('operator')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-3xs font-semibold rounded-md transition"
                  >
                    Karigar / Operator Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('view_only')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-3xs font-semibold rounded-md transition"
                  >
                    Read Only Auditor Preset
                  </button>
                </div>
              </div>

              {/* Module Action Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="p-3 font-bold w-1/3">
                          System Module
                        </th>
                        {PERMISSION_ACTIONS.map((pa) => (
                          <th key={pa.action} className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleActionColumn(pa.action)}
                              className="group flex flex-col items-center mx-auto hover:opacity-80 transition"
                            >
                              <span
                                className={`px-2 py-0.5 rounded text-3xs font-bold border ${pa.color}`}
                              >
                                {pa.label}
                              </span>
                              <span className="text-3xs text-slate-400 mt-0.5 group-hover:underline">
                                (Toggle All)
                              </span>
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {SYSTEM_MODULES.map((m) => {
                        const activeActions = permissionsMap[m.id] || [];
                        const isFullySelected = PERMISSION_ACTIONS.every((pa) =>
                          activeActions.includes(pa.action)
                        );

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleModuleRow(m.id)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                                    isFullySelected
                                      ? 'bg-[#0099B8] border-[#0099B8] text-white'
                                      : 'border-slate-300 bg-white hover:border-[#0099B8]'
                                  }`}
                                  title="Toggle entire row"
                                >
                                  {isFullySelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{m.name}</span>
                                    <span className="text-2xs font-normal text-[#0099B8]">
                                      ({m.nameGu})
                                    </span>
                                  </div>
                                  <p className="text-3xs text-slate-400">{m.description}</p>
                                </div>
                              </div>
                            </td>

                            {PERMISSION_ACTIONS.map((pa) => {
                              const isChecked = activeActions.includes(pa.action);
                              const isManage = pa.action === 'manage';

                              return (
                                <td key={pa.action} className="p-3 text-center">
                                  <label className="inline-flex items-center justify-center cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleActionPermission(m.id, pa.action)}
                                      className={`w-4 h-4 rounded border-slate-300 text-[#0099B8] focus:ring-[#0099B8] ${
                                        isManage ? 'accent-purple-600' : 'accent-[#0099B8]'
                                      }`}
                                    />
                                  </label>
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
            </div>
          ) : (
            /* Selected Role Overview Read-only Matrix */
            selectedRole && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{selectedRole.name}</h4>
                      <span className="text-xs text-[#0099B8] font-semibold">({selectedRole.nameGu})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedRole.isSystem && (
                      <button
                        onClick={() => deleteRole(selectedRole.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(selectedRole)}
                      className="px-3.5 py-1.5 bg-[#0099B8]/10 hover:bg-[#0099B8]/20 text-[#0099B8] text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Matrix</span>
                    </button>
                  </div>
                </div>

                {/* Read-Only Summary Table */}
                <div className="space-y-2">
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                    Active Module Permissions Matrix
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SYSTEM_MODULES.map((m) => {
                      const actions = selectedRole.permissions[m.id] || [];
                      return (
                        <div
                          key={m.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{m.name}</div>
                            <div className="text-3xs text-slate-400">{m.nameGu}</div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[160px]">
                            {actions.length > 0 ? (
                              actions.map((act) => {
                                const pa = PERMISSION_ACTIONS.find((p) => p.action === act);
                                return (
                                  <span
                                    key={act}
                                    className={`px-1.5 py-0.5 rounded text-3xs font-bold border ${
                                      pa?.color || 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {act}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-3xs text-slate-400 italic">No access</span>
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
