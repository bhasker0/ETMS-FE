'use client';

import React, { useState } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Radio } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 12. IoT Gateway Config Drawer Form (SCRUM-191)                             */
/* -------------------------------------------------------------------------- */
export const IotGatewayConfigDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({ instance, level }) => {
  const { closeDrawer } = useAppDrawer();
  const { activeCompany } = useAuth();
  const { t } = useI18n();

  const [brokerUrl, setBrokerUrl] = useState('mqtt://broker.emqx.io:1883');
  const [pulseThreshold, setPulseThreshold] = useState<number>(1000);
  const [heartbeatSeconds, setHeartbeatSeconds] = useState<number>(10);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('IoT Gateway configuration updated successfully');
    instance.onSuccess?.();
    closeDrawer();
  };

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      title={t.machine_iotModalTitle || 'IoT Gateway Telemetry & Broker Config'}
      icon={<Radio className="w-5 h-5 text-emerald-600 animate-pulse" />}
      level={level}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={closeDrawer}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            type="submit"
            form={`iot-drawer-form-${instance.id}`}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {t.save || 'Save IoT Config'}
          </button>
        </div>
      }
    >
      <form id={`iot-drawer-form-${instance.id}`} onSubmit={handleSave} className="space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          {t.machine_iotModalDesc || 'Connect optical rotation and stitch pulse sensors via ESP32/MQTT broker for automated live shift logging.'}
        </p>

        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">MQTT Broker URL</label>
          <input
            type="text"
            value={brokerUrl}
            onChange={(e) => setBrokerUrl(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Heartbeat Interval (s)</label>
            <input
              type="number"
              min="1"
              value={heartbeatSeconds}
              onChange={(e) => setHeartbeatSeconds(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-700 font-medium">Pulse Threshold (Stitches)</label>
            <input
              type="number"
              min="100"
              step="100"
              value={pulseThreshold}
              onChange={(e) => setPulseThreshold(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-2xs">
          <div className="text-slate-500 font-bold">{t.machine_iotBrokerTopic || 'Telemetry Ingest Topic'}</div>
          <div className="p-2 bg-white rounded border border-slate-300 text-indigo-700 font-bold select-all">
            machines/{activeCompany?.id || 'default'}/telemetry
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-2xs">
          <div className="text-slate-500 font-bold">{t.machine_iotWebhookEndpoint || 'HTTP Webhook Endpoint'}</div>
          <div className="p-2 bg-white rounded border border-slate-300 text-emerald-700 font-bold select-all">
            POST http://localhost:4000/api/v1/machines/telemetry
          </div>
        </div>
      </form>
    </Drawer>
  );
};
