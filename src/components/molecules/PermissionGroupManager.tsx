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
import { Plus, Trash2, Edit3, Check, FolderGit2 } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-primary" />
            {t.perm_title || 'Staff Permission Groups'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.perm_subtitle || 'Batch modular access rules and bind them to staff roles'}
          </p>
        </div>
        <button
          onClick={startCreate}
          className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.perm_createNewGroup || 'Create New Group'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sidebar Group List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {t.perm_groupsList || 'Configured Groups'} ({permissionGroups.length})
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
                      ? 'bg-[var(--bg-surface-elevated)]/60 border-primary shadow-xs ring-1 ring-primary/30'
                      : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-primary/50 hover:bg-[var(--bg-surface-elevated)]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <span>{displayName}</span>
                      </div>
                      <p className="text-2xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-3xs text-muted-foreground">
                    <span className="font-medium">{g.associatedRoleIds.length} Linked Roles</span>
                    <span className="font-mono">
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
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {isCreating ? (t.perm_createNewGroup || 'Create New Permission Group') : `${t.perm_editGroup || 'Edit Group'}: ${groupName}`}
                  </h4>
                  <span className="text-2xs text-muted-foreground">{t.perm_subtitle || 'Configure role associations and module privileges'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-[var(--bg-surface-elevated)] rounded-lg transition cursor-pointer"
                  >
                    {t.cancel || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                  >
                    {t.perm_saveGroup || 'Save Group'}
                  </button>
                </div>
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    {t.perm_groupName || 'Group Name'}
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Accounts & GST Compliance Group"
                    className="w-full px-3 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-foreground">
                    {t.perm_groupDesc || 'Group Description'}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the operational purpose of this permission group"
                    className="w-full px-3 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Linked Roles Selection */}
              <div className="space-y-2">
                <label className="block text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.perm_associatedRoles || 'Associated Roles'}
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                          isLinked
                            ? 'bg-primary/10 border-primary text-primary font-semibold'
                            : 'bg-background border-[var(--border)] text-muted-foreground hover:text-foreground hover:bg-[var(--bg-surface-elevated)]'
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
              <div className="border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-surface-elevated)]/60 border-b border-[var(--border)] text-foreground">
                      <th className="p-3 font-semibold">{t.matrix_systemModule || 'System Module'}</th>
                      {PERMISSION_ACTIONS.map((pa) => {
                        const actionLabel =
                          pa.action === 'view'
                            ? (t.matrix_actionView || 'View')
                            : pa.action === 'create'
                            ? (t.matrix_actionCreate || 'Create')
                            : pa.action === 'edit'
                            ? (t.matrix_actionEdit || 'Edit')
                            : pa.action === 'delete'
                            ? (t.matrix_actionDelete || 'Delete')
                            : (t.matrix_actionManage || 'Manage');
                        return (
                          <th key={pa.action} className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-3xs font-semibold border ${pa.color}`}>
                              {actionLabel}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/60 bg-[var(--bg-surface)]">
                    {SYSTEM_MODULES.map((m) => {
                      const actions = modulePermissions[m.id] || [];
                      const moduleLabel = language === 'gu' && m.nameGu ? m.nameGu : m.name;
                      return (
                        <tr key={m.id} className="hover:bg-[var(--bg-surface-elevated)]/40 transition">
                          <td className="p-3 font-medium text-foreground">
                            {moduleLabel}
                          </td>
                          {PERMISSION_ACTIONS.map((pa) => (
                            <td key={pa.action} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={actions.includes(pa.action)}
                                onChange={() => toggleGroupPermission(m.id, pa.action)}
                                className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-primary cursor-pointer"
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
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h4 className="font-semibold text-foreground text-base">
                      {language === 'gu' && selectedGroup.nameGu ? selectedGroup.nameGu : selectedGroup.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedGroup.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => deletePermissionGroup(selectedGroup.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(selectedGroup)}
                      className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.perm_editGroup || 'Edit Group'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.perm_associatedRoles || 'Associated Roles'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGroup.associatedRoleIds.map((rId) => {
                      const r = roles.find((role) => role.id === rId);
                      const roleName = r ? (language === 'gu' && r.nameGu ? r.nameGu : r.name) : rId;
                      return (
                        <span
                          key={rId}
                          className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] text-[var(--text-main)] font-medium rounded-md text-2xs border border-[var(--border)]"
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
