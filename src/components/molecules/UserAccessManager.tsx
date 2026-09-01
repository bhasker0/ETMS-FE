'use client';

import React, { useState } from 'react';
import { useConfig } from '@/lib/config-context';
import { UserCheck, ShieldCheck, Users, Check, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export const UserAccessManager: React.FC = () => {
  const { userAccessList, roles, permissionGroups, updateUserAccess } = useConfig();
  const { t, language } = useI18n();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0099B8]" />
            {t.access_title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.access_subtitle}
          </p>
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="p-3.5 font-bold">{t.access_thUser}</th>
                <th className="p-3.5 font-bold">{t.access_thDesignation}</th>
                <th className="p-3.5 font-bold">{t.access_thRole}</th>
                <th className="p-3.5 font-bold">{t.access_thGroup}</th>
                <th className="p-3.5 font-bold text-right">{t.actions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {userAccessList.map((u) => {
                const isEditing = editingUserId === u.userId;
                const activeRole = roles.find((r) => r.id === u.roleId);
                const activeGroup = permissionGroups.find((g) => g.id === u.permissionGroupId);
                const roleLabel = activeRole ? (language === 'gu' && activeRole.nameGu ? activeRole.nameGu : activeRole.name) : u.roleId;
                const groupLabel = activeGroup ? (language === 'gu' && activeGroup.nameGu ? activeGroup.nameGu : activeGroup.name) : null;

                return (
                  <tr key={u.userId} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{u.userName}</div>
                      <div className="text-2xs text-slate-400 font-mono">{u.userPhone}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{u.designation}</td>

                    {/* Assigned Role */}
                    <td className="p-3.5">
                      {isEditing ? (
                        <select
                          value={selectedRoleId}
                          onChange={(e) => setSelectedRoleId(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0099B8] outline-none"
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
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-2xs font-bold inline-flex items-center gap-1">
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
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0099B8] outline-none"
                        >
                          <option value="">{t.access_noneGroup}</option>
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
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-2xs font-bold inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{groupLabel}</span>
                        </span>
                      ) : (
                        <span className="text-2xs text-slate-400 italic">{t.access_noneGroup}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1 text-2xs text-slate-600 hover:bg-slate-100 rounded transition"
                          >
                            {t.cancel}
                          </button>
                          <button
                            onClick={() => handleSave(u.userId)}
                            className="px-3 py-1 bg-[#0099B8] text-white text-2xs font-bold rounded shadow-xs transition"
                          >
                            {t.save}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(u)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-2xs font-semibold rounded transition"
                        >
                          {t.access_btnEditAccess}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
