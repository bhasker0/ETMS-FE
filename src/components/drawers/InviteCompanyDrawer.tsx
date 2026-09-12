'use client';

import React, { useState } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { MunimApi } from '@/lib/api/munim';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 4. Invite Company Drawer Form (Munim Dashboard)                            */
/* -------------------------------------------------------------------------- */
export const InviteCompanyDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { t } = useI18n();
  const [inviteGstin, setInviteGstin] = useState('');
  const [inviteMobile, setInviteMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteGstin || !inviteMobile) {
      toast.error('GSTIN and Mobile number are required');
      return;
    }
    setSubmitting(true);
    try {
      const result = await MunimApi.munimInviteCompany({
        gstin: inviteGstin.toUpperCase(),
        mobile: inviteMobile,
      });
      toast.success('Company access request sent');
      closeDrawer();
      if (instance.onSuccess) instance.onSuccess(result);
    } catch (err: any) {
      toast.error('Failed to send request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      level={level}
      title={t.munim_drawerTitle}
      subtitle={t.munim_drawerSubtitle}
      icon={<Building2 className="w-5 h-5 text-slate-700" />}
      size="md"
      footer={
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(`invite-form-${instance.id}`) as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={submitting}
            className="w-1/2 py-2 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            {submitting ? t.saving : t.munim_btnSendRequest}
          </button>
        </div>
      }
    >
      <form id={`invite-form-${instance.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.munim_labelGstin}</label>
          <input
            type="text"
            required
            pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
            placeholder="24ABCDE1234F1Z5"
            value={inviteGstin}
            onChange={(e) => setInviteGstin(e.target.value.toUpperCase())}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 uppercase"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">{t.munim_labelMobile}</label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            placeholder="10-digit mobile"
            value={inviteMobile}
            onChange={(e) => setInviteMobile(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900"
          />
        </div>
      </form>
    </Drawer>
  );
};
