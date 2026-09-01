'use client';

import React, { useState } from 'react';
import {
  useConfig,
  SYSTEM_MODULES,
  PERMISSION_ACTIONS,
  PermissionAction,
  PermissionGroup,
  RolePermissionsMap,
} from '@/lib/config-context';
import { Users, Plus, Trash2, Edit3, Check, FolderGit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export const PermissionGroupManager: React.FC = () => {
  const { permissionGroups, roles, addPermissionGroup, updatePermissionGroup, deletePermissionGroup } = useConfig();
  const { t, language } = useI18n();
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(permissionGroups[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupNameGu, setGroupNameGu] = useState('');
  const [description, setDescription] = useState('');
  const [associatedRoleIds, setAssociatedRoleIds] = useState<string[]>([]);
  const [modulePermissions, setModulePermissions] = useState<RolePermissionsMap>({});

  const startCreate = () => {
    const emptyMap: RolePermissionsMap = SYSTEM_MODULES.reduce((acc, m) => {
      acc[m.id] = ['view'];
      return acc;
    }, {} as RolePermissionsMap);

    setSelectedGroup(null);
    setGroupName('');
    setGroupNameGu('');
    setDescription('');
    setAssociatedRoleIds([]);
    setModulePermissions(emptyMap);
    setIsEditing(true);
    setIsCreating(true);
  };

  const startEdit = (group: PermissionGroup) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupNameGu(group.nameGu);
    setDescription(group.description);
    setAssociatedRoleIds([...group.associatedRoleIds]);
    setModulePermissions(JSON.parse(JSON.stringify(group.modulePermissions)));
    setIsEditing(true);
    setIsCreating(false);
  };

  const toggleRoleAssociation = (roleId: string) => {
    setAssociatedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleGroupPermission = (moduleId: string, action: PermissionAction) => {
    setModulePermissions((prev) => {
      const current = prev[moduleId] || [];
      const hasIt = current.includes(action);
      const next = hasIt ? current.filter((a) => a !== action) : [...current, action];
      return { ...prev, [moduleId]: next };
    });
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      toast.error('Permission Group name is required');
      return;
    }

    if (isCreating) {
      addPermissionGroup({
        name: groupName,
        nameGu: groupNameGu || groupName,
        description: description || 'Custom permission group for staff batching',
        associatedRoleIds,
        modulePermissions,
      });
      toast.success('Permission Group created successfully');
    } else if (selectedGroup) {
      updatePermissionGroup(selectedGroup.id, {
        name: groupName,
        nameGu: groupNameGu,
        description,
        associatedRoleIds,
        modulePermissions,
      });
      toast.success('Permission Group updated');
    }

    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[var(--primary)]" />
            {t.perm_title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.perm_subtitle}
          </p>
        </div>
        <button
          onClick={startCreate}
          className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.perm_createNewGroup}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Group List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {t.perm_groupsList} ({permissionGroups.length})
          </div>
          <div className="space-y-2">
            {permissionGroups.map((g) => {
              const isSelected = selectedGroup?.id === g.id;
              const displayName = language === 'gu' && g.nameGu ? g.nameGu : g.name;
              return (
                <div
                  key={g.id}
                  onClick={() => startEdit(g)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[var(--primary)] shadow-sm ring-1 ring-[var(--primary)]/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{displayName}</span>
                      </div>
                      <p className="text-2xs text-slate-500 mt-1 line-clamp-2">{g.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-3xs text-slate-400">
                    <span>{g.associatedRoleIds.length} Linked Roles</span>
                    <span>
                      {Object.values(g.modulePermissions).reduce((a, c) => a + c.length, 0)} Actions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group Editor / View */}
        <div className="lg:col-span-8">
          {isEditing ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isCreating ? t.perm_createNewGroup : `${t.perm_editGroup}: ${groupName}`}
                  </h4>
                  <span className="text-2xs text-slate-500">{t.perm_subtitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[#9494ff] text-white text-xs font-bold rounded-lg transition shadow-xs"
                  >
                    {t.perm_saveGroup}
                  </button>
                </div>
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    {t.perm_groupName}
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Accounts & GST Compliance Group"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[var(--primary)] outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    {t.perm_groupDesc}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe group purpose"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              {/* Linked Roles Selection */}
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {t.perm_associatedRoles}
                </label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const isLinked = associatedRoleIds.includes(r.id);
                    const roleTitle = language === 'gu' && r.nameGu ? r.nameGu : r.name;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => toggleRoleAssociation(r.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                          isLinked
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{roleTitle}</span>
                        {isLinked && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group Permissions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="p-3 font-bold">{t.matrix_systemModule}</th>
                      {PERMISSION_ACTIONS.map((pa) => {
                        const actionLabel =
                          pa.action === 'view'
                            ? t.matrix_actionView
                            : pa.action === 'create'
                            ? t.matrix_actionCreate
                            : pa.action === 'edit'
                            ? t.matrix_actionEdit
                            : pa.action === 'delete'
                            ? t.matrix_actionDelete
                            : t.matrix_actionManage;
                        return (
                          <th key={pa.action} className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${pa.color}`}>
                              {actionLabel}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {SYSTEM_MODULES.map((m) => {
                      const actions = modulePermissions[m.id] || [];
                      const moduleLabel = language === 'gu' && m.nameGu ? m.nameGu : m.name;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-medium text-slate-900">
                            {moduleLabel}
                          </td>
                          {PERMISSION_ACTIONS.map((pa) => (
                            <td key={pa.action} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={actions.includes(pa.action)}
                                onChange={() => toggleGroupPermission(m.id, pa.action)}
                                className="w-4 h-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            selectedGroup && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {language === 'gu' && selectedGroup.nameGu ? selectedGroup.nameGu : selectedGroup.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedGroup.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deletePermissionGroup(selectedGroup.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(selectedGroup)}
                      className="px-3.5 py-1.5 bg-[var(--primary)]/10 hover:bg-[#9494ff]/20 text-[var(--primary)] text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.perm_editGroup}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                    {t.perm_associatedRoles}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGroup.associatedRoleIds.map((rId) => {
                      const r = roles.find((role) => role.id === rId);
                      const roleName = r ? (language === 'gu' && r.nameGu ? r.nameGu : r.name) : rId;
                      return (
                        <span
                          key={rId}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-md text-2xs border border-slate-200"
                        >
                          {roleName}
                        </span>
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
