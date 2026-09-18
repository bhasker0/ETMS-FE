'use client';

import React, { useState, useEffect } from 'react';
import {
  ReportsApi,
  ProductionReportItem,
  SalesReportItem,
  ChallanReportItem,
  ExpenseReportItem,
  PurchaseReportItem,
  PnlReportResult,
} from '@/lib/api/reports';
import { useAuth } from '@/lib/auth-context';
import { formatINR, formatNumber } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel-export';
import {
  BarChart3,
  Calendar,
  Filter,
  FileSpreadsheet,
  Printer,
  Search,
  Layers,
  FileText,
  Truck,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

type ReportType = 'PRODUCTION' | 'SALES' | 'CHALLANS' | 'EXPENSES' | 'PURCHASES' | 'PNL';

function ReportsDashboardContent() {
  const { activeCompany } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const qTab = (searchParams.get('tab') || searchParams.get('type') || '').toUpperCase() as ReportType;
  const initialTab: ReportType = ['PRODUCTION', 'SALES', 'CHALLANS', 'EXPENSES', 'PURCHASES', 'PNL'].includes(qTab)
    ? qTab
    : 'PRODUCTION';

  const [activeReport, setActiveReport] = useState<ReportType>(initialTab);
  const [loading, setLoading] = useState(true);

  // Filters from URL or default
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [partyFilter, setPartyFilter] = useState(searchParams.get('party') || '');
  const [designFilter, setDesignFilter] = useState(searchParams.get('design') || '');
  const [machineFilter, setMachineFilter] = useState(searchParams.get('machine') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'ALL');

  // Synchronize state back into URL query parameters without reloading
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeReport !== 'PRODUCTION') params.set('tab', activeReport.toLowerCase());
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (partyFilter) params.set('party', partyFilter);
    if (designFilter) params.set('design', designFilter);
    if (machineFilter) params.set('machine', machineFilter);
    if (categoryFilter && categoryFilter !== 'ALL') params.set('category', categoryFilter);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, '', newUrl);
  }, [activeReport, startDate, endDate, partyFilter, designFilter, machineFilter, categoryFilter, pathname]);

  // Report Data
  const [prodData, setProdData] = useState<{ summary: any; data: ProductionReportItem[] } | null>(null);
  const [salesData, setSalesData] = useState<{ summary: any; data: SalesReportItem[] } | null>(null);
  const [challanData, setChallanData] = useState<{ summary: any; data: ChallanReportItem[] } | null>(null);
  const [expenseData, setExpenseData] = useState<{ summary: any; data: ExpenseReportItem[] } | null>(null);
  const [purchaseData, setPurchaseData] = useState<{ summary: any; data: PurchaseReportItem[] } | null>(null);
  const [pnlData, setPnlData] = useState<PnlReportResult | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'PRODUCTION') {
        const res = await ReportsApi.getProduction({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          designNo: designFilter || undefined,
          machineId: machineFilter || undefined,
        });
        setProdData(res);
      } else if (activeReport === 'SALES') {
        const res = await ReportsApi.getSales({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          partyName: partyFilter || undefined,
          designNo: designFilter || undefined,
        });
        setSalesData(res);
      } else if (activeReport === 'CHALLANS') {
        const res = await ReportsApi.getChallans({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          partyName: partyFilter || undefined,
        });
        setChallanData(res);
      } else if (activeReport === 'EXPENSES') {
        const res = await ReportsApi.getExpenses({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        });
        setExpenseData(res);
      } else if (activeReport === 'PURCHASES') {
        const res = await ReportsApi.getPurchases({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          supplierName: partyFilter || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        });
        setPurchaseData(res);
      } else if (activeReport === 'PNL') {
        const res = await ReportsApi.getPnl({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setPnlData(res);
      }
    } catch (err: any) {
      toast.error('Failed to load report data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeCompany?.id, activeReport, startDate, endDate, categoryFilter]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setPartyFilter('');
    setDesignFilter('');
    setMachineFilter('');
    setCategoryFilter('ALL');
  };

  // Quick Date Presets
  const setQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    if (activeReport === 'PRODUCTION') {
      const cols = [
        { header: 'Shift Date', key: 'date', width: 14 },
        { header: 'Shift Type', key: 'shift', width: 12 },
        { header: 'Machine No', key: 'machine_no', width: 14 },
        { header: 'Karigar Name', key: 'karigar_name', width: 22 },
        { header: 'Design No', key: 'design_no', width: 16 },
        { header: 'Total Stitches', key: 'stitches', width: 16 },
        { header: 'Total Meters', key: 'meters', width: 14 },
        { header: 'Rate / Meter', key: 'rate_per_meter', width: 14 },
        { header: 'Karigar Wages (Rs)', key: 'wages', width: 18 },
        { header: 'Downtime (Min)', key: 'downtime_minutes', width: 16 },
        { header: 'Downtime Reason', key: 'downtime_reason', width: 25 },
      ];
      exportToExcel(prodData?.data || [], cols, 'Production', 'Production_Report');
    } else if (activeReport === 'SALES') {
      const cols = [
        { header: 'Invoice Date', key: 'date', width: 14 },
        { header: 'Invoice No', key: 'invoice_no', width: 16 },
        { header: 'Party / Trader Name', key: 'party_name', width: 28 },
        { header: 'Party GSTIN', key: 'party_gstin', width: 18 },
        { header: 'Design No', key: 'design_no', width: 20 },
        { header: 'Total Stitches', key: 'stitches', width: 16 },
        { header: 'Meters', key: 'meters', width: 14 },
        { header: 'Rate / 1k', key: 'rate', width: 14 },
        { header: 'Taxable Amount (Rs)', key: 'taxable_amount', width: 18 },
        { header: 'CGST (Rs)', key: 'cgst', width: 14 },
        { header: 'SGST (Rs)', key: 'sgst', width: 14 },
        { header: 'IGST (Rs)', key: 'igst', width: 14 },
        { header: 'Net Amount (Rs)', key: 'total_amount', width: 18 },
        { header: 'Payment Status', key: 'payment_status', width: 16 },
        { header: 'Tally Synced', key: 'tally_synced', width: 14 },
      ];
      exportToExcel(salesData?.data || [], cols, 'Sales', 'Sales_Jobwork_Report');
    } else if (activeReport === 'CHALLANS') {
      const cols = [
        { header: 'Challan Date', key: 'date', width: 14 },
        { header: 'Challan No', key: 'challan_no', width: 16 },
        { header: 'Lot No', key: 'lot_no', width: 14 },
        { header: 'Trader Name', key: 'party_name', width: 28 },
        { header: 'Fabric Quality', key: 'fabric_quality', width: 20 },
        { header: 'Thans', key: 'thans', width: 12 },
        { header: 'Inward Meters', key: 'meters', width: 16 },
        { header: 'Design No', key: 'design_no', width: 16 },
        { header: 'Status', key: 'status', width: 16 },
      ];
      exportToExcel(challanData?.data || [], cols, 'Challans', 'Inward_Challans_Report');
    } else if (activeReport === 'EXPENSES') {
      const cols = [
        { header: 'Expense Date', key: 'date', width: 14 },
        { header: 'Category', key: 'category', width: 14 },
        { header: 'Expense Type', key: 'type', width: 22 },
        { header: 'Payee / Vendor', key: 'payee_name', width: 28 },
        { header: 'Amount (Rs)', key: 'amount', width: 16 },
        { header: 'Payment Mode', key: 'payment_mode', width: 16 },
        { header: 'Bill / UTR Ref', key: 'reference_no', width: 20 },
        { header: 'GST Input (Rs)', key: 'gst_amount', width: 16 },
        { header: 'Description', key: 'description', width: 30 },
      ];
      exportToExcel(expenseData?.data || [], cols, 'Expenses', 'Expenses_Report');
    } else if (activeReport === 'PURCHASES') {
      const cols = [
        { header: 'Invoice Date', key: 'date', width: 14 },
        { header: 'Invoice No', key: 'invoice_no', width: 16 },
        { header: 'Supplier Name', key: 'supplier_name', width: 28 },
        { header: 'Category', key: 'category', width: 16 },
        { header: 'Taxable (Rs)', key: 'subtotal', width: 16 },
        { header: 'GST (Rs)', key: 'gst_amount', width: 14 },
        { header: 'Net Amount (Rs)', key: 'net_amount', width: 18 },
        { header: 'Paid Amount (Rs)', key: 'paid_amount', width: 16 },
        { header: 'Pending (Rs)', key: 'pending_amount', width: 16 },
        { header: 'Payment Status', key: 'payment_status', width: 16 },
      ];
      exportToExcel(purchaseData?.data || [], cols, 'Purchases', 'Purchases_Report');
    } else if (activeReport === 'PNL' && pnlData) {
      const pnlRows = [
        { Metric: '1. Gross Job-Work Billing (Revenue)', Value: pnlData.revenue.jobwork_billing },
        { Metric: '   Invoices Count', Value: pnlData.revenue.invoices_count },
        { Metric: '2. Karigar Wages (Direct Labor)', Value: pnlData.direct_costs.karigar_wages },
        { Metric: '3. Yarn / Dhaga Purchases (Raw Material)', Value: pnlData.direct_costs.yarn_purchases },
        { Metric: '4. Machine Spares Purchases', Value: pnlData.direct_costs.spare_parts_purchases },
        { Metric: '5. Electricity / Power Bills', Value: pnlData.direct_costs.electricity_power },
        { Metric: '6. Machine Repairs & Maintenance', Value: pnlData.direct_costs.machine_repairs },
        { Metric: '7. Other Direct Expenses', Value: pnlData.direct_costs.other_direct_expenses },
        { Metric: 'TOTAL DIRECT MANUFACTURING COST', Value: pnlData.direct_costs.total_direct_cost },
        { Metric: 'GROSS PROFIT (Revenue - Direct Cost)', Value: pnlData.gross_profit },
        { Metric: '8. Factory Shed Rent (Indirect Cost)', Value: pnlData.indirect_costs.factory_rent },
        { Metric: '9. Staff Salaries (Indirect Cost)', Value: pnlData.indirect_costs.staff_salaries },
        { Metric: '10. Karigar Advances / Uchapat (Indirect Cost)', Value: pnlData.indirect_costs.karigar_advances || 0 },
        { Metric: '11. Other Indirect Admin Expenses', Value: pnlData.indirect_costs.other_indirect_expenses },
        { Metric: 'TOTAL INDIRECT ADMINISTRATIVE COST', Value: pnlData.indirect_costs.total_indirect_cost },
        { Metric: 'NET FACTORY PROFIT', Value: pnlData.net_profit },
        { Metric: 'NET PROFIT MARGIN (%)', Value: `${pnlData.profit_margin_percent}%` },
      ];
      exportToExcel(pnlRows, [{ header: 'Financial Metric', key: 'Metric', width: 45 }, { header: 'Amount (INR)', key: 'Value', width: 22 }], 'P&L_Profitability', 'Factory_PNL_Statement');
    }
    toast.success('Excel report exported successfully');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reports</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight mt-1">
              Reports
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Production, sales, challans, purchases, expenses, and P&L statements
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold text-xs rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Export Current Table as Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3.5 py-2 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold text-xs rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Print or Save Report as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 pt-5 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveReport('PRODUCTION')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
              activeReport === 'PRODUCTION'
                ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-400 text-indigo-900 dark:text-indigo-200'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider">Production</span>
              <Layers className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xs font-semibold mt-1">Shifts & Machines</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveReport('SALES')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
              activeReport === 'SALES'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider">Sales / Invoices</span>
              <FileText className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xs font-semibold mt-1">Job-Work Bills</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveReport('CHALLANS')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
              activeReport === 'CHALLANS'
                ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider">Inward Lots</span>
              <Truck className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xs font-semibold mt-1">Challan Register</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveReport('EXPENSES')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
              activeReport === 'EXPENSES'
                ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider">Expenses</span>
              <Receipt className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xs font-semibold mt-1">Direct & Indirect</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveReport('PURCHASES')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
              activeReport === 'PURCHASES'
                ? 'bg-sky-50/60 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-200'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider">Purchases</span>
              <ShoppingBag className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xs font-semibold mt-1">Yarn & Spares</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveReport('PNL')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
              activeReport === 'PNL'
                ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-400 text-purple-900 dark:text-purple-200'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider">P&L Summary</span>
              <TrendingUp className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xs font-semibold mt-1">Net Factory Profit</div>
          </button>
        </div>
      </div>

      {/* Universal Multi-Parameter Filter Toolbar */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
            />
          </div>

          {/* Party / Supplier Filter */}
          {(activeReport === 'SALES' || activeReport === 'CHALLANS' || activeReport === 'PURCHASES') && (
            <div>
              <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
                {activeReport === 'PURCHASES' ? 'Supplier Name' : 'Party / Trader'}
              </label>
              <input
                type="text"
                placeholder="Search party name..."
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
              />
            </div>
          )}

          {/* Design No Filter */}
          {(activeReport === 'PRODUCTION' || activeReport === 'SALES') && (
            <div>
              <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
                Design Number
              </label>
              <input
                type="text"
                placeholder="e.g. DSG-1050..."
                value={designFilter}
                onChange={(e) => setDesignFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
              />
            </div>
          )}

          {/* Expense or Purchase Category Filter */}
          {(activeReport === 'EXPENSES' || activeReport === 'PURCHASES') && (
            <div>
              <label className="block text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs focus:outline-hidden"
              >
                <option value="ALL">All Categories</option>
                {activeReport === 'EXPENSES' ? (
                  <>
                    <option value="DIRECT">Direct (Factory Cost)</option>
                    <option value="INDIRECT">Indirect (Admin/Rent)</option>
                  </>
                ) : (
                  <>
                    <option value="YARN_DHAGA">Yarn / Dhaga / Zari</option>
                    <option value="SPARE_PARTS">Machine Spare Parts</option>
                    <option value="CONSUMABLES">Needles & Lubricants</option>
                    <option value="PACKAGING">Packaging</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-1.5 bg-[var(--primary)] hover:bg-[#9494ff] text-white font-semibold text-xs rounded-md transition cursor-pointer shadow-xs"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-muted)] border border-[var(--border)] text-xs rounded-md transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border)] text-[0.6875rem] text-[var(--text-muted)]">
          <span className="font-semibold uppercase tracking-wider mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => setQuickDate(0)}
            className="px-2 py-0.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] rounded text-[var(--text-main)] transition cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(7)}
            className="px-2 py-0.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] rounded text-[var(--text-main)] transition cursor-pointer"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(30)}
            className="px-2 py-0.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] rounded text-[var(--text-main)] transition cursor-pointer"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(90)}
            className="px-2 py-0.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] rounded text-[var(--text-main)] transition cursor-pointer"
          >
            Last 90 Days
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2 py-0.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] rounded text-[var(--text-main)] transition cursor-pointer"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Report View Area */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-[var(--text-muted)] font-mono">
            Loading analytics report data...
          </div>
        ) : (
          <div>
            {/* 1. Production Report */}
            {activeReport === 'PRODUCTION' && (
              <div>
                {/* Summary bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 p-4 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Shifts Logged
                    </span>
                    <span className="text-base font-bold font-mono">{prodData?.summary?.total_logs || 0}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Stitches
                    </span>
                    <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {formatNumber(prodData?.summary?.total_stitches || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Meters
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatNumber(prodData?.summary?.total_meters || 0)} m
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Karigar Wages
                    </span>
                    <span className="text-base font-bold font-mono text-[var(--text-main)]">
                      {formatINR(prodData?.summary?.total_wages || 0)}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[0.6875rem]">
                        <th className="p-3.5">Date / Shift</th>
                        <th className="p-3.5">Machine</th>
                        <th className="p-3.5">Karigar</th>
                        <th className="p-3.5">Design No</th>
                        <th className="p-3.5 text-right">Stitches</th>
                        <th className="p-3.5 text-right">Meters</th>
                        <th className="p-3.5 text-right">Wage (₹)</th>
                        <th className="p-3.5">Downtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(prodData?.data || []).map((row) => (
                        <tr key={row.id} className="hover:bg-[var(--bg-surface-elevated)] transition">
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            <div className="font-semibold text-[var(--text-main)]">{row.date}</div>
                            <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase">{row.shift}</div>
                          </td>
                          <td className="p-3.5 font-semibold text-[var(--text-main)]">{row.machine_no}</td>
                          <td className="p-3.5">{row.karigar_name}</td>
                          <td className="p-3.5 font-mono">{row.design_no}</td>
                          <td className="p-3.5 text-right font-mono font-medium">{formatNumber(row.stitches)}</td>
                          <td className="p-3.5 text-right font-mono font-medium">{formatNumber(row.meters)} m</td>
                          <td className="p-3.5 text-right font-mono font-bold">{formatINR(row.wages)}</td>
                          <td className="p-3.5 text-[var(--text-muted)]">
                            {row.downtime_minutes > 0 ? `${row.downtime_minutes} min • ${row.downtime_reason}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Sales Report */}
            {activeReport === 'SALES' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 p-4 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Invoices
                    </span>
                    <span className="text-base font-bold font-mono">{salesData?.summary?.total_invoices || 0}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Taxable Value
                    </span>
                    <span className="text-base font-bold font-mono">
                      {formatINR(salesData?.summary?.total_taxable_amount || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total GST (CGST+SGST)
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatINR((salesData?.summary?.total_cgst || 0) + (salesData?.summary?.total_sgst || 0))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Grand Net Amount
                    </span>
                    <span className="text-base font-bold font-mono text-[var(--text-main)]">
                      {formatINR(salesData?.summary?.grand_total || 0)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[0.6875rem]">
                        <th className="p-3.5">Invoice / Date</th>
                        <th className="p-3.5">Party / Trader</th>
                        <th className="p-3.5">Design</th>
                        <th className="p-3.5 text-right">Meters</th>
                        <th className="p-3.5 text-right">Taxable (₹)</th>
                        <th className="p-3.5 text-right">GST (₹)</th>
                        <th className="p-3.5 text-right">Net Bill (₹)</th>
                        <th className="p-3.5 text-center">Tally</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(salesData?.data || []).map((row) => (
                        <tr key={row.id} className="hover:bg-[var(--bg-surface-elevated)] transition">
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            <div className="font-bold text-[var(--text-main)]">{row.invoice_no}</div>
                            <div className="text-[0.6875rem] text-[var(--text-muted)]">{row.date}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-[var(--text-main)]">{row.party_name}</div>
                            <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">{row.party_gstin}</div>
                          </td>
                          <td className="p-3.5 max-w-xs truncate">{row.design_no}</td>
                          <td className="p-3.5 text-right font-mono">{formatNumber(row.meters)} m</td>
                          <td className="p-3.5 text-right font-mono">{formatINR(row.taxable_amount)}</td>
                          <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {formatINR(row.cgst + row.sgst + row.igst)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)]">
                            {formatINR(row.total_amount)}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                                row.tally_synced === 'YES' ? 'badge-pastel-green' : 'badge-pastel-yellow'
                              }`}
                            >
                              {row.tally_synced === 'YES' ? 'Exported' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Inward Challan / Lot Register */}
            {activeReport === 'CHALLANS' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 p-4 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Inward Lots
                    </span>
                    <span className="text-base font-bold font-mono">{challanData?.summary?.total_lots || 0}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Thans
                    </span>
                    <span className="text-base font-bold font-mono">{challanData?.summary?.total_thans || 0}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Inward Fabric
                    </span>
                    <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {formatNumber(challanData?.summary?.total_meters || 0)} m
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[0.6875rem]">
                        <th className="p-3.5">Challan / Lot</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Party / Trader</th>
                        <th className="p-3.5">Fabric Quality</th>
                        <th className="p-3.5 text-right">Thans</th>
                        <th className="p-3.5 text-right">Inward Meters</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(challanData?.data || []).map((row) => (
                        <tr key={row.id} className="hover:bg-[var(--bg-surface-elevated)] transition">
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            <div className="font-bold text-[var(--text-main)]">Lot #{row.lot_no}</div>
                            <div className="text-[0.6875rem] text-[var(--text-muted)]">{row.challan_no}</div>
                          </td>
                          <td className="p-3.5 font-mono text-[var(--text-muted)]">{row.date}</td>
                          <td className="p-3.5 font-semibold text-[var(--text-main)]">{row.party_name}</td>
                          <td className="p-3.5">{row.fabric_quality}</td>
                          <td className="p-3.5 text-right font-mono">{row.thans}</td>
                          <td className="p-3.5 text-right font-mono font-medium">{formatNumber(row.meters)} m</td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase badge-pastel-yellow">
                              {row.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Expenses Report */}
            {activeReport === 'EXPENSES' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 p-4 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Direct Expenses
                    </span>
                    <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                      {formatINR(expenseData?.summary?.total_direct_expenses || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Indirect Expenses
                    </span>
                    <span className="text-base font-bold font-mono text-sky-600 dark:text-sky-400">
                      {formatINR(expenseData?.summary?.total_indirect_expenses || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Grand Total Cost
                    </span>
                    <span className="text-base font-bold font-mono text-[var(--text-main)]">
                      {formatINR(expenseData?.summary?.grand_total || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      GST Input Credit
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatINR(expenseData?.summary?.total_gst_input || 0)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[0.6875rem]">
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Expense Type</th>
                        <th className="p-3.5">Payee / Vendor</th>
                        <th className="p-3.5">Ref / Bill No</th>
                        <th className="p-3.5 text-right">Amount (₹)</th>
                        <th className="p-3.5 text-right">GST (₹)</th>
                        <th className="p-3.5">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(expenseData?.data || []).map((row) => (
                        <tr key={row.id} className="hover:bg-[var(--bg-surface-elevated)] transition">
                          <td className="p-3.5 font-mono text-[var(--text-muted)]">{row.date}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                                row.category === 'DIRECT' ? 'badge-pastel-yellow' : 'badge-pastel-blue'
                              }`}
                            >
                              {row.category}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium">{row.type.replace(/_/g, ' ')}</td>
                          <td className="p-3.5 font-semibold text-[var(--text-main)]">{row.payee_name}</td>
                          <td className="p-3.5 font-mono text-[var(--text-muted)]">{row.reference_no || '—'}</td>
                          <td className="p-3.5 text-right font-mono font-bold">{formatINR(row.amount)}</td>
                          <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {row.gst_amount > 0 ? formatINR(row.gst_amount) : '—'}
                          </td>
                          <td className="p-3.5 font-mono text-[0.6875rem] uppercase">{row.payment_mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Purchases Report */}
            {activeReport === 'PURCHASES' && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 p-4 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] gap-3 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Inward Bills
                    </span>
                    <span className="text-base font-bold font-mono">{purchaseData?.summary?.total_invoices || 0}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Taxable Value
                    </span>
                    <span className="text-base font-bold font-mono">
                      {formatINR(purchaseData?.summary?.total_subtotal || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total GST Paid
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatINR(purchaseData?.summary?.total_gst || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] uppercase text-[0.625rem] font-semibold block">
                      Total Purchases
                    </span>
                    <span className="text-base font-bold font-mono text-[var(--text-main)]">
                      {formatINR(purchaseData?.summary?.grand_total || 0)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[0.6875rem]">
                        <th className="p-3.5">Invoice / Date</th>
                        <th className="p-3.5">Supplier</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5 text-right">Taxable (₹)</th>
                        <th className="p-3.5 text-right">GST (₹)</th>
                        <th className="p-3.5 text-right">Net Bill (₹)</th>
                        <th className="p-3.5 text-right">Paid (₹)</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(purchaseData?.data || []).map((row) => (
                        <tr key={row.id} className="hover:bg-[var(--bg-surface-elevated)] transition">
                          <td className="p-3.5 font-mono whitespace-nowrap">
                            <div className="font-bold text-[var(--text-main)]">{row.invoice_no}</div>
                            <div className="text-[0.6875rem] text-[var(--text-muted)]">{row.date}</div>
                          </td>
                          <td className="p-3.5 font-semibold text-[var(--text-main)]">{row.supplier_name}</td>
                          <td className="p-3.5">{row.category.replace(/_/g, ' ')}</td>
                          <td className="p-3.5 text-right font-mono">{formatINR(row.subtotal)}</td>
                          <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {formatINR(row.gst_amount)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold">{formatINR(row.net_amount)}</td>
                          <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatINR(row.paid_amount)}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                                row.payment_status === 'PAID'
                                  ? 'badge-pastel-green'
                                  : row.payment_status === 'PARTIAL'
                                  ? 'badge-pastel-yellow'
                                  : 'badge-pastel-red'
                              }`}
                            >
                              {row.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Factory P&L Statement */}
            {activeReport === 'PNL' && pnlData && (
              <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <div className="text-center pb-4 border-b border-[var(--border)]">
                  <h2 className="text-lg font-bold text-[var(--text-main)]">Factory Profit & Loss Statement</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                    Period: {pnlData.period.startDate} to {pnlData.period.endDate}
                  </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
                    <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)]">
                      Total Job-Work Revenue
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--text-main)] mt-1">
                      {formatINR(pnlData.revenue.jobwork_billing)}
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
                    <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)]">
                      Gross Profit
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatINR(pnlData.gross_profit)}
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-lg">
                    <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)]">
                      Net Factory Profit
                    </div>
                    <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                      {formatINR(pnlData.net_profit)}
                    </div>
                    <div className="text-xs text-indigo-500 font-mono mt-0.5">
                      Margin: {pnlData.profit_margin_percent}%
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="bg-[var(--bg-surface-elevated)] font-bold text-[var(--text-main)] border-b border-[var(--border)]">
                        <td className="p-3">A. Gross Revenue (Job-Work Outward Billing)</td>
                        <td className="p-3 text-right font-mono">{formatINR(pnlData.revenue.jobwork_billing)}</td>
                      </tr>

                      <tr className="bg-amber-50/40 dark:bg-amber-950/20 font-semibold text-amber-900 dark:text-amber-300 border-b border-[var(--border)]">
                        <td className="p-3">B. Direct Manufacturing & Production Costs</td>
                        <td className="p-3 text-right font-mono">
                          {formatINR(pnlData.direct_costs.total_direct_cost)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Karigar Production Wages</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.direct_costs.karigar_wages)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Yarn / Dhaga / Zari Purchases</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.direct_costs.yarn_purchases)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Machine Needles, Oil & Spares</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.direct_costs.spare_parts_purchases)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Machine Power / Electricity Bills</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.direct_costs.electricity_power)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Machine Servicing & Mechanics Repairs</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.direct_costs.machine_repairs)}
                        </td>
                      </tr>

                      <tr className="bg-[var(--bg-surface-elevated)] font-bold text-[var(--text-main)] border-b border-[var(--border)]">
                        <td className="p-3">C. Gross Operating Profit (A - B)</td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {formatINR(pnlData.gross_profit)}
                        </td>
                      </tr>

                      <tr className="bg-sky-50/40 dark:bg-sky-950/20 font-semibold text-sky-900 dark:text-sky-300 border-b border-[var(--border)]">
                        <td className="p-3">D. Indirect Administrative & Office Overhead</td>
                        <td className="p-3 text-right font-mono">
                          {formatINR(pnlData.indirect_costs.total_indirect_cost)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Factory Shed Rent</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.indirect_costs.factory_rent)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Supervisor & Staff Salaries</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.indirect_costs.staff_salaries)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Karigar Advances / Uchapat (Paid Out)</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.indirect_costs.karigar_advances || 0)}
                        </td>
                      </tr>
                      <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                        <td className="p-2.5 pl-6">• Other Administrative, Tea & Municipal Costs</td>
                        <td className="p-2.5 text-right font-mono font-medium text-[var(--text-main)]">
                          {formatINR(pnlData.indirect_costs.other_indirect_expenses)}
                        </td>
                      </tr>

                      <tr className="bg-indigo-50/80 dark:bg-indigo-950/50 font-bold text-indigo-950 dark:text-indigo-200 border-t-2 border-indigo-400">
                        <td className="p-3.5 text-sm">NET FACTORY PROFIT (C - D)</td>
                        <td className="p-3.5 text-right font-mono text-base text-indigo-600 dark:text-indigo-400">
                          {formatINR(pnlData.net_profit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="h-8 w-48 bg-[var(--bg-surface-elevated)] rounded animate-pulse" />
          <div className="h-64 w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl animate-pulse" />
        </div>
      }
    >
      <ReportsDashboardContent />
    </Suspense>
  );
}
