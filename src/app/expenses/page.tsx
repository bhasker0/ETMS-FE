'use client';

import React, { useState, useEffect } from 'react';
import { ExpensesApi, ExpenseApiItem, ExpensesSummary } from '@/lib/api/expenses';
import { useAuth } from '@/lib/auth-context';
import { useAppDrawer } from '@/lib/app-drawer-context';
import { formatINR, formatNumber } from '@/lib/utils';
import { exportToExcel } from '@/lib/excel-export';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Trash2,
  Zap,
  Building,
  Wrench,
  Truck,
  Coffee,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const { activeCompany } = useAuth();
  const { openDrawer } = useAppDrawer();

  const [expenses, setExpenses] = useState<ExpenseApiItem[]>([]);
  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIRECT' | 'INDIRECT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('ALL');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        ExpensesApi.getAll({
          category: activeTab !== 'ALL' ? activeTab : undefined,
          expenseType: expenseTypeFilter !== 'ALL' ? expenseTypeFilter : undefined,
          search: searchTerm || undefined,
        }),
        ExpensesApi.getSummary(),
      ]);
      setExpenses(listRes.expenses || []);
      setSummary(summaryRes);
    } catch (err: any) {
      toast.error('Failed to load expenses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeCompany?.id, activeTab, expenseTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleDelete = async (id: string, payee: string) => {
    if (!confirm(`Are you sure you want to delete expense for ${payee}?`)) return;
    try {
      await ExpensesApi.delete(id);
      toast.success(`Expense for ${payee} deleted`);
      fetchExpenses();
    } catch (err: any) {
      toast.error('Failed to delete expense: ' + err.message);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'Expense Date', key: 'expense_date', width: 14 },
      { header: 'Category', key: 'category', width: 14 },
      { header: 'Expense Type', key: 'expense_type', width: 22 },
      { header: 'Payee / Vendor', key: 'payee_name', width: 28 },
      { header: 'Amount (Rs)', key: 'amount', width: 16 },
      { header: 'GST (Rs)', key: 'gst_amount', width: 14 },
      { header: 'Payment Mode', key: 'payment_mode', width: 16 },
      { header: 'Reference / Bill No', key: 'reference_no', width: 22 },
      { header: 'Description', key: 'description', width: 30 },
    ];
    exportToExcel(expenses, columns, 'Expenses', 'Expenses_Register');
    toast.success('Downloaded Expenses Excel Report');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-[var(--text-main)]" />
                <span>Cost & Overhead Accounting</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight mt-1">
              Expense Management
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Track Direct Manufacturing Costs (Electricity, Machine Repairs, Fuel, Carting) vs Indirect Administrative Costs (Rent, Salaries, Karigar Advances / Uchapat, Tea, Taxes)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={expenses.length === 0}
              className="px-3 py-2 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border)] text-[var(--text-main)] border border-[var(--border)] font-semibold text-xs rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Expenses Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={() => openDrawer('CREATE_EXPENSE', {}, fetchExpenses)}
              className="px-3.5 py-2 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold text-xs rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-[var(--text-muted)] tracking-wider">
            Total Factory Expenses
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-mono tabular-nums mt-1">
            {formatINR(summary?.grand_total || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            {summary?.count || 0} Recorded Vouchers
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Direct Expenses (Production)</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
            {formatINR(summary?.total_direct || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            Electricity, repairs, fuel, carting
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-sky-700 dark:text-sky-400 tracking-wider flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            <span>Indirect Expenses (Admin)</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono tabular-nums mt-1">
            {formatINR(summary?.total_indirect || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            Rent, staff salary, Karigar advances / uchapat
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
          <div className="text-[0.6875rem] font-semibold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
            GST Input Eligible
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            {formatINR(summary?.total_gst || 0)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            GST tax credit on power/bills
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border)] p-3 rounded-lg">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] p-1 rounded-lg border border-[var(--border)] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            All Vouchers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DIRECT')}
            className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'DIRECT'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Direct (Factory)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INDIRECT')}
            className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'INDIRECT'
                ? 'bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Building className="w-3 h-3" />
            <span>Indirect (Office/Rent)</span>
          </button>
        </div>

        {/* Search & Type Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search payee, bill no, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono focus:outline-hidden"
            />
          </form>

          <select
            value={expenseTypeFilter}
            onChange={(e) => setExpenseTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-md text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">All Types</option>
            <option value="STAFF_SALARY">Salary (Staff / Karigar Monthly Wages)</option>
            <option value="ADVANCE">Advance / Uchapat (Karigar / Staff)</option>
            <option value="ELECTRICITY_POWER">Electricity / Power</option>
            <option value="MACHINE_REPAIR">Machine Repairs & Spares</option>
            <option value="FUEL_DIESEL">Fuel / Generator Diesel</option>
            <option value="FREIGHT_CARTING">Tempo / Carting / Freight</option>
            <option value="RENT">Factory Shed Rent</option>
            <option value="TEA_REFRESHMENT">Tea & Refreshment</option>
            <option value="GIDC_TAX">GIDC / Municipal Tax</option>
            <option value="OTHER">Other Expenses</option>
          </select>
        </div>
      </div>

      {/* Expenses Data Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] font-mono">
            Loading expense register...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
            <p className="text-sm font-semibold text-[var(--text-main)]">No expenses found</p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Record power bills, machine repairing, shed rent, and staff salary vouchers to monitor your net factory profit.
            </p>
            <button
              type="button"
              onClick={() => openDrawer('CREATE_EXPENSE', {}, fetchExpenses)}
              className="px-3 py-1.5 bg-[var(--text-main)] hover:bg-[#2c2c2c] text-[var(--bg-surface)] font-semibold text-xs rounded-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Expense</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[0.6875rem]">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Expense Type</th>
                  <th className="p-3.5">Payee / Vendor</th>
                  <th className="p-3.5">Bill / Ref No</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                  <th className="p-3.5 text-right">GST (₹)</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[var(--bg-surface-elevated)] transition">
                    <td className="p-3.5 whitespace-nowrap font-mono text-[var(--text-muted)]">
                      {exp.expense_date}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold uppercase ${
                          exp.category === 'DIRECT'
                            ? 'badge-pastel-yellow'
                            : 'badge-pastel-blue'
                        }`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-medium text-[var(--text-main)]">
                      {exp.expense_type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 font-semibold text-[var(--text-main)]">
                      {exp.payee_name}
                    </td>
                    <td className="p-3.5 font-mono text-[var(--text-muted)]">
                      {exp.reference_no || '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[var(--text-main)]">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {exp.gst_amount > 0 ? formatINR(exp.gst_amount) : '—'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-[0.6875rem] text-[var(--text-muted)] font-mono uppercase">
                        {exp.payment_mode}
                      </span>
                    </td>
                    <td className="p-3.5 text-[var(--text-muted)] max-w-xs truncate">
                      {exp.description || '—'}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(exp.id, exp.payee_name)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-900 rounded transition shadow-xs cursor-pointer inline-flex items-center"
                        title="Delete Expense Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
