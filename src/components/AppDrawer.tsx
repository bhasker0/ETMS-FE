'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAppDrawer } from '@/lib/app-drawer-context';

/* -------------------------------------------------------------------------- */
/* Dynamic Lazy-Loaded Drawer Form Chunks (SCRUM-289)                         */
/* -------------------------------------------------------------------------- */

const KarigarDrawerForm = dynamic(
  () => import('./drawers/KarigarDrawer').then((mod) => mod.KarigarDrawerForm),
  { ssr: false }
);

const KarigarLedgerDrawerForm = dynamic(
  () => import('./drawers/KarigarDrawer').then((mod) => mod.KarigarLedgerDrawerForm),
  { ssr: false }
);

const MachineDrawerForm = dynamic(
  () => import('./drawers/MachineDrawer').then((mod) => mod.MachineDrawerForm),
  { ssr: false }
);

const UchapatDrawerForm = dynamic(
  () => import('./drawers/UchapatDrawer').then((mod) => mod.UchapatDrawerForm),
  { ssr: false }
);

const InviteCompanyDrawerForm = dynamic(
  () => import('./drawers/InviteCompanyDrawer').then((mod) => mod.InviteCompanyDrawerForm),
  { ssr: false }
);

const HisabDrawerForm = dynamic(
  () => import('./drawers/HisabDrawer').then((mod) => mod.HisabDrawerForm),
  { ssr: false }
);

const ShiftDrawerForm = dynamic(
  () => import('./drawers/ShiftDrawer').then((mod) => mod.ShiftDrawerForm),
  { ssr: false }
);

const ChallanDrawerForm = dynamic(
  () => import('./drawers/ChallanDrawer').then((mod) => mod.ChallanDrawerForm),
  { ssr: false }
);

const ViewChallanDrawerForm = dynamic(
  () => import('./drawers/ChallanDrawer').then((mod) => mod.ViewChallanDrawerForm),
  { ssr: false }
);

const InvoiceDrawerForm = dynamic(
  () => import('./drawers/InvoiceDrawer').then((mod) => mod.InvoiceDrawerForm),
  { ssr: false }
);

const ViewInvoiceDrawerForm = dynamic(
  () => import('./drawers/InvoiceDrawer').then((mod) => mod.ViewInvoiceDrawerForm),
  { ssr: false }
);

const PartyDrawerForm = dynamic(
  () => import('./drawers/PartyDrawer').then((mod) => mod.PartyDrawerForm),
  { ssr: false }
);

const DefectDeductionDrawerForm = dynamic(
  () => import('./drawers/DefectDeductionDrawer').then((mod) => mod.DefectDeductionDrawerForm),
  { ssr: false }
);

const EwbGenerationDrawerForm = dynamic(
  () => import('./drawers/EwbDrawer').then((mod) => mod.EwbGenerationDrawerForm),
  { ssr: false }
);

const IotGatewayConfigDrawerForm = dynamic(
  () => import('./drawers/IotGatewayConfigDrawer').then((mod) => mod.IotGatewayConfigDrawerForm),
  { ssr: false }
);

const OfflineConflictDrawerForm = dynamic(
  () => import('./drawers/OfflineConflictDrawer').then((mod) => mod.OfflineConflictDrawerForm),
  { ssr: false }
);

const CreatePurchaseDrawerForm = dynamic(
  () => import('./drawers/PurchaseDrawer').then((mod) => mod.CreatePurchaseDrawerForm),
  { ssr: false }
);

const ViewPurchaseDrawerForm = dynamic(
  () => import('./drawers/PurchaseDrawer').then((mod) => mod.ViewPurchaseDrawerForm),
  { ssr: false }
);

const CreateExpenseDrawerForm = dynamic(
  () => import('./drawers/ExpenseDrawer').then((mod) => mod.CreateExpenseDrawerForm),
  { ssr: false }
);

const ThreadLedgerDrawerForm = dynamic(
  () => import('./drawers/ThreadLedgerDrawer').then((mod) => mod.ThreadLedgerDrawerForm),
  { ssr: false }
);

const MachineMaintenanceDrawerForm = dynamic(
  () => import('./drawers/MachineMaintenanceDrawer').then((mod) => mod.MachineMaintenanceDrawerForm),
  { ssr: false }
);

const ShrinkageCertificateDrawerForm = dynamic(
  () => import('./drawers/ShrinkageCertificateDrawer').then((mod) => mod.ShrinkageCertificateDrawerForm),
  { ssr: false }
);

const UgraaniRecoveryDrawerForm = dynamic(
  () => import('./drawers/UgraaniRecoveryDrawer').then((mod) => mod.UgraaniRecoveryDrawerForm),
  { ssr: false }
);

const KarigarWageSlipDrawerForm = dynamic(
  () => import('./drawers/KarigarWageSlipDrawer').then((mod) => mod.KarigarWageSlipDrawerForm),
  { ssr: false }
);

const SacInvoicingTallyDrawerForm = dynamic(
  () => import('./drawers/SacInvoicingTallyDrawer').then((mod) => mod.SacInvoicingTallyDrawerForm),
  { ssr: false }
);

/* -------------------------------------------------------------------------- */
/* Master AppDrawer Dynamic Renderer                                          */
/* -------------------------------------------------------------------------- */
export const AppDrawer: React.FC = () => {
  const { drawerStack } = useAppDrawer();

  if (drawerStack.length === 0) return null;

  return (
    <>
      {drawerStack.map((instance, index) => {
        switch (instance.type) {
          case 'ADD_KARIGAR':
          case 'EDIT_KARIGAR':
            return <KarigarDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'KARIGAR_LEDGER':
            return <KarigarLedgerDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'ADD_MACHINE':
          case 'EDIT_MACHINE':
            return <MachineDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'ADD_UCHAPAT':
            return <UchapatDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'INVITE_COMPANY':
            return <InviteCompanyDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'COMPUTE_HISAB':
            return <HisabDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'LOG_SHIFT':
            return <ShiftDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'ADD_CHALLAN':
          case 'EDIT_CHALLAN':
            return <ChallanDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'VIEW_CHALLAN':
            return <ViewChallanDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'CREATE_INVOICE':
          case 'EDIT_INVOICE':
            return <InvoiceDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'VIEW_INVOICE':
            return <ViewInvoiceDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'ADD_PARTY':
          case 'EDIT_PARTY':
            return <PartyDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'LOG_DEFECT':
            return <DefectDeductionDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'GENERATE_EWB':
            return <EwbGenerationDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'IOT_GATEWAY_CONFIG':
            return <IotGatewayConfigDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'OFFLINE_CONFLICTS':
            return <OfflineConflictDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'CREATE_PURCHASE':
            return <CreatePurchaseDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'VIEW_PURCHASE':
            return <ViewPurchaseDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'CREATE_EXPENSE':
            return <CreateExpenseDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'THREAD_LEDGER':
            return <ThreadLedgerDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'MACHINE_MAINTENANCE':
            return <MachineMaintenanceDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'SHRINKAGE_CERTIFICATE':
            return <ShrinkageCertificateDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'UGRAANI_RECOVERY':
            return <UgraaniRecoveryDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'KARIGAR_WAGE_SLIP':
            return <KarigarWageSlipDrawerForm key={instance.id} instance={instance} level={index} />;

          case 'SAC_INVOICING_TALLY':
            return <SacInvoicingTallyDrawerForm key={instance.id} instance={instance} level={index} />;

          default:
            return null;
        }
      })}
    </>
  );
};
