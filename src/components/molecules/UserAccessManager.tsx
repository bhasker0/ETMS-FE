'use client';

import React, { useState, useMemo } from 'react';
import { useConfig } from '@/lib/config-context';
import { UserCheck, ShieldCheck, Users, Search, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export const UserAccessManager: React.FC = () => {
  const { userAccessList, roles, permissionGroups, updateUserAccess } = useConfig();
  const { t, language } = useI18n();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const startEdit = (user: (typeof userAccessList)[0]) => {
    setEditingUserId(user.userId);
    setSelectedRoleId(user.roleId);
    setSelectedGroupId(user.permissionGroupId || '');
  };

  const handleSave = (userId: string) => {
    updateUserAccess(userId, selectedRoleId, selectedGroupId || undefined);
    toast.success('User role & access permissions updated');
    setEditingUserId(null);
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return userAccessList;
    return userAccessList.filter(
      (u) =>
        u.userName.toLowerCase().includes(q) ||
        u.userPhone.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q)
    );
  }, [userAccessList, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            {t.access_title || 'Staff User Access & Directory'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.access_subtitle || 'Assign RBAC operational roles and permission groups to factory personnel'}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
          />
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-surface-elevated)]/60 border-b border-[var(--border)] text-foreground">
                <th className="p-3.5 font-semibold">{t.access_thUser || 'Staff Personnel'}</th>
                <th className="p-3.5 font-semibold">{t.access_thDesignation || 'Designation'}</th>
                <th className="p-3.5 font-semibold">{t.access_thRole || 'Assigned Role'}</th>
                <th className="p-3.5 font-semibold">{t.access_thGroup || 'Permission Group'}</th>
                <th className="p-3.5 font-semibold text-right">{t.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60 bg-[var(--bg-surface)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No staff members match the current search filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isEditing = editingUserId === u.userId;
                  const activeRole = roles.find((r) => r.id === u.roleId);
                  const activeGroup = permissionGroups.find((g) => g.id === u.permissionGroupId);
                  const roleLabel = activeRole ? (language === 'gu' && activeRole.nameGu ? activeRole.nameGu : activeRole.name) : u.roleId;
                  const groupLabel = activeGroup ? (language === 'gu' && activeGroup.nameGu ? activeGroup.nameGu : activeGroup.name) : null;

                  return (
                    <tr key={u.userId} className="hover:bg-[var(--bg-surface-elevated)]/40 transition">
                      <td className="p-3.5">
                        <div className="font-medium text-foreground text-xs">{u.userName}</div>
                        <div className="text-3xs text-muted-foreground font-mono mt-0.5">{u.userPhone}</div>
                      </td>
                      <td className="p-3.5 text-muted-foreground font-medium">{u.designation}</td>

                      {/* Assigned Role */}
                      <td className="p-3.5">
                        {isEditing ? (
                          <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="px-2.5 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                          >
                            {roles.map((r) => {
                              const rName = language === 'gu' && r.nameGu ? r.nameGu : r.name;
                              return (
                                <option key={r.id} value={r.id}>
                                  {rName} ({r.code})
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-2xs font-semibold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{roleLabel}</span>
                          </span>
                        )}
                      </td>

                      {/* Permission Group */}
                      <td className="p-3.5">
                        {isEditing ? (
                          <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="px-2.5 py-1.5 bg-background border border-[var(--border)] rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                          >
                            <option value="">{t.access_noneGroup || 'No Batch Group'}</option>
                            {permissionGroups.map((g) => {
                              const gName = language === 'gu' && g.nameGu ? g.nameGu : g.name;
                              return (
                                <option key={g.id} value={g.id}>
                                  {gName}
                                </option>
                              );
                            })}
                          </select>
                        ) : activeGroup ? (
                          <span className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] text-[var(--text-main)] border border-[var(--border)] rounded-md text-2xs font-medium inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-primary" />
                            <span>{groupLabel}</span>
                          </span>
                        ) : (
                          <span className="text-3xs text-muted-foreground italic">{t.access_noneGroup || 'Standard Role Permissions'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-2.5 py-1 text-2xs text-muted-foreground hover:text-foreground hover:bg-[var(--bg-surface-elevated)] rounded-md transition cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              {t.cancel || 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSave(u.userId)}
                              className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-2xs font-semibold rounded-md shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {t.save || 'Save'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] text-2xs font-medium rounded-md transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-muted-foreground" />
                            {t.access_btnEditAccess || 'Edit Access'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
