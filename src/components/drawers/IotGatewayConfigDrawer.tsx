'use client';

import React, { useState, useEffect } from 'react';
import { useAppDrawer, DrawerInstance } from '@/lib/app-drawer-context';
import { Drawer } from '@/components/ui/drawer';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { MachinesApi, MachineApiItem } from '@/lib/api/machines';
import { toast } from 'sonner';
import {
  Radio,
  Copy,
  Check,
  RefreshCw,
  Key,
  Layers,
  Send,
  Cpu,
  Globe,
  Terminal,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* IoT Gateway & Hardware ESP32 CAN Bus Config Drawer Form (SCRUM-336)       */
/* -------------------------------------------------------------------------- */
export const IotGatewayConfigDrawerForm: React.FC<{ instance: DrawerInstance; level: number }> = ({
  instance,
  level,
}) => {
  const { closeDrawer } = useAppDrawer();
  const { activeCompany } = useAuth();
  const { t } = useI18n();

  const passedMachine = instance.payload?.machine as MachineApiItem | undefined;
  const [machines, setMachines] = useState<MachineApiItem[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(passedMachine?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [testingPayload, setTestingPayload] = useState(false);
  const [codeFormat, setCodeFormat] = useState<'CPP' | 'JSON'>('CPP');

  // Webhook URL calculation
  const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const defaultPort = '4000';
  const defaultProtocol = typeof window !== 'undefined' && window.location.protocol.startsWith('https') ? 'https:' : 'http:';
  const webhookUrl = `${defaultProtocol}//${defaultHost}:${defaultPort}/api/v1/machines/telemetry`;

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const data = await MachinesApi.getAll();
        setMachines(data);
        if (!selectedMachineId && data.length > 0) {
          setSelectedMachineId(data[0].id);
        }
      } catch (err: any) {
        console.warn('Failed to load machine list:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!passedMachine) {
      loadMachines();
    } else {
      setMachines([passedMachine]);
      setSelectedMachineId(passedMachine.id);
    }
  }, [passedMachine]);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || passedMachine;
  const tenantId = activeCompany?.id || selectedMachine?.company_id || '00000000-0000-0000-0000-000000000000';
  const machineId = selectedMachine?.id || 'pending-machine-id';
  const apiKey = selectedMachine?.api_key || 'etms_sec_key_placeholder';
  const machineNo = selectedMachine?.machine_no || '01';

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success(`${keyName} copied to clipboard`);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyName ? null : prev));
    }, 2000);
  };

  const handleRegenerateApiKey = async () => {
    if (!selectedMachineId) return;
    setRegenerating(true);
    try {
      const res = await MachinesApi.regenerateApiKey(selectedMachineId);
      setMachines((prev) =>
        prev.map((m) => (m.id === selectedMachineId ? { ...m, api_key: res.api_key } : m))
      );
      toast.success(`IoT API Key regenerated for Machine #${machineNo}`);
      instance.onSuccess?.();
    } catch (err: any) {
      toast.error('Failed to regenerate key: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleTestTelemetry = async () => {
    if (!selectedMachineId) return;
    setTestingPayload(true);
    try {
      const nextStitchCount = (selectedMachine?.stitch_count || 0) + 250;
      await MachinesApi.sendTelemetry({
        machineId: selectedMachineId,
        status: 'running',
        stitchCount: nextStitchCount,
        apiKey: apiKey,
      });
      toast.success(`Simulated CAN telemetry sent: +250 stitches recorded!`);
      // Update local machine
      setMachines((prev) =>
        prev.map((m) =>
          m.id === selectedMachineId
            ? { ...m, stitch_count: nextStitchCount, status: 'running', is_active: true }
            : m
        )
      );
      instance.onSuccess?.();
    } catch (err: any) {
      toast.error('Telemetry test failed: ' + err.message);
    } finally {
      setTestingPayload(false);
    }
  };

  const cppCodeSnippet = `// ========================================================
// ETMS ESP32 CAN Bus Telemetry Configuration (Machine #${machineNo})
// ========================================================
#define ETMS_TENANT_ID    "${tenantId}"
#define ETMS_MACHINE_ID   "${machineId}"
#define ETMS_API_KEY      "${apiKey}"
#define ETMS_WEBHOOK_URL  "${webhookUrl}"

// Sample JSON Dispatcher Routine:
// POST ${webhookUrl}
// Headers: "x-api-key: ${apiKey}", "Content-Type: application/json"
// Payload: {"machineId": "${machineId}", "status": "running", "stitchCount": 12500}
`;

  const jsonConfigSnippet = JSON.stringify(
    {
      tenantId,
      machineId,
      machineNo: `#${machineNo}`,
      apiKey,
      webhookEndpoint: webhookUrl,
      samplePayload: {
        machineId,
        status: 'running',
        stitchCount: 12500,
      },
    },
    null,
    2
  );

  return (
    <Drawer
      isOpen={true}
      onClose={closeDrawer}
      title={t.machine_iotModalTitle || 'ESP32 CAN Bus IoT Configuration'}
      subtitle={t.machine_iotModalDesc || 'Pre-configured hardware parameters for live stitch counters & CAN bus telemetry.'}
      icon={<Radio className="w-5 h-5 text-emerald-600 animate-pulse" />}
      level={level}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleTestTelemetry}
            disabled={testingPayload || !selectedMachineId}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition border border-emerald-200 dark:border-emerald-800 disabled:opacity-50 cursor-pointer"
          >
            <Send className={`w-3.5 h-3.5 ${testingPayload ? 'animate-spin' : ''}`} />
            <span>{testingPayload ? 'Sending...' : 'Test Ingestion (+250 Stitches)'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeDrawer}
              className="px-4 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] rounded-lg text-xs font-semibold transition"
            >
              {t.cancel || 'Close'}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(codeFormat === 'CPP' ? cppCodeSnippet : jsonConfigSnippet, 'Full ESP32 Configuration')}
              className="px-4 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-surface)] font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              {copiedKey === 'Full ESP32 Configuration' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Copy All Configuration</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Machine Selector */}
        {machines.length > 1 && (
          <div className="space-y-1.5 bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border)]">
            <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Target Machine</span>
            </label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  Machine #{m.machine_no} ({m.make_model || 'Tajima'} - {m.head_count} Heads)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4 Pre-Configured Parameters Matrix */}
        <div className="space-y-3">
          <div className="text-[0.6875rem] uppercase font-semibold tracking-wider text-[var(--text-muted)]">
            Hardware Integration Parameters
          </div>

          {/* 1. Tenant ID */}
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Layers className="w-3 h-3" /> Tenant ID (Company Context)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(tenantId, 'Tenant ID')}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border)]"
              >
                {copiedKey === 'Tenant ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'Tenant ID' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-[var(--text-main)] font-semibold select-all break-all pt-0.5">
              {tenantId}
            </div>
          </div>

          {/* 2. Machine ID */}
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Machine ID (Target Unit #{machineNo})
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(machineId, 'Machine ID')}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border)]"
              >
                {copiedKey === 'Machine ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'Machine ID' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-[var(--text-main)] font-semibold select-all break-all pt-0.5">
              {machineId}
            </div>
          </div>

          {/* 3. Assigned API Key */}
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Key className="w-3 h-3" /> Assigned IoT API Key
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRegenerateApiKey}
                  disabled={regenerating}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border)] disabled:opacity-50"
                  title="Generate new API Key"
                >
                  <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>Renew</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiKey, 'API Key')}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border)]"
                >
                  {copiedKey === 'API Key' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'API Key' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold select-all break-all pt-0.5">
              {apiKey}
            </div>
          </div>

          {/* 4. Webhook Ingestion Endpoint */}
          <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Globe className="w-3 h-3" /> ETMS Webhook Endpoint (HTTP POST)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border)]"
              >
                {copiedKey === 'Webhook URL' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'Webhook URL' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold select-all break-all pt-0.5">
              {webhookUrl}
            </div>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[0.6875rem] uppercase font-semibold tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Hardware Code Snippet</span>
            </div>
            <div className="flex items-center gap-1 text-2xs">
              <button
                type="button"
                onClick={() => setCodeFormat('CPP')}
                className={`px-2 py-0.5 rounded font-mono transition ${
                  codeFormat === 'CPP'
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-bold'
                    : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
                }`}
              >
                C++ / ESP32
              </button>
              <button
                type="button"
                onClick={() => setCodeFormat('JSON')}
                className={`px-2 py-0.5 rounded font-mono transition ${
                  codeFormat === 'JSON'
                    ? 'bg-[var(--text-main)] text-[var(--bg-surface)] font-bold'
                    : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
                }`}
              >
                JSON Config
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-3.5 bg-slate-950 text-slate-100 rounded-xl text-2xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {codeFormat === 'CPP' ? cppCodeSnippet : jsonConfigSnippet}
            </pre>
            <button
              type="button"
              onClick={() => copyToClipboard(codeFormat === 'CPP' ? cppCodeSnippet : jsonConfigSnippet, 'Code Snippet')}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-2xs font-medium rounded flex items-center gap-1 transition"
            >
              {copiedKey === 'Code Snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'Code Snippet' ? 'Copied' : 'Copy Snippet'}</span>
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
