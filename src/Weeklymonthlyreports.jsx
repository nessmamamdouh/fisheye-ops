import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { useOperationalIssues } from './useOperationalIssues';
import { isExcluded, isWFDone } from './utils/helpers';

const M = "#800000";

const daysUntil = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : 9999;

export function WeeklyMonthlyReports({ employees = [] }) {
  const [reportType, setReportType] = useState('monthly');
  const [showReport, setShowReport] = useState(false);

  // استخدام الـ Hook الجديد للحصول على إحصائيات دقيقة
  const issues = useOperationalIssues(employees);
  
  const active = employees.filter(e => !isExcluded(e));
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  // ── WEEKLY REPORT ────────────────────────────────────────
  const weeklyCompleted = active.filter(e => {
    if (!e.updatedAt) return false;
    const updated = new Date(e.updatedAt);
    return updated >= weekStart;
  });

  const weeklyText = `
📊 WEEKLY SUMMARY REPORT
${weekStart.toLocaleDateString('en-GB')} to ${now.toLocaleDateString('en-GB')}

════════════════════════════════════════════════════════════════

✅ COMPLETED THIS WEEK (${weeklyCompleted.length}):
${weeklyCompleted.slice(0, 10).map(e => `  • ${e.name} (${e.client}) — ${e.status}`).join('\n')}
${weeklyCompleted.length > 10 ? `  +${weeklyCompleted.length - 10} more` : ''}

⏳ IN PROGRESS (${active.filter(e => !isWFDone(e.workflowStatus)).length}):
${active.filter(e => !isWFDone(e.workflowStatus)).slice(0, 10).map(e => `  • ${e.name} (${e.client}) — ${e.workflowStatus}`).join('\n')}

🔴 URGENT (FROM SYSTEM):
  • Expired/Urgent: ${issues.counts.urgent}
  • Renewals Due: ${issues.counts.renewals}

════════════════════════════════════════════════════════════════
`;

  // ── MONTHLY REPORT ───────────────────────────────────────
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalPayroll = active.reduce((sum, e) => sum + (e.totalPackage || 0), 0);

  const monthlyText = `
📊 MONTHLY SUMMARY REPORT
${monthStart.toLocaleDateString('en-GB')} to ${now.toLocaleDateString('en-GB')}

════════════════════════════════════════════════════════════════

👥 HEADCOUNT:
  • Total Active: ${active.length}
  • New This Month: ${active.filter(e => e.status === 'new').length}

💸 FINANCIAL SUMMARY:
  • Total Payroll: SR ${totalPayroll.toLocaleString()}
  • Average Salary: SR ${Math.round(totalPayroll / Math.max(active.length, 1)).toLocaleString()}

🚨 OPERATIONAL ISSUES (via Hook):
  • Critical Issues: ${issues.counts.urgent}
  • Total Follow-ups: ${issues.followups.length}

════════════════════════════════════════════════════════════════
`;

  const reportText = reportType === 'weekly' ? weeklyText : monthlyText;

  return (
    <div className="fe-page" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#111827", margin:0, display:"flex", alignItems:"center", gap:8, fontFamily:"var(--font-sans)", letterSpacing:"-0.02em" }}>
          <FileText size={20} style={{ color:"#800000" }}/> Reports
        </h2>
        <p style={{ color:"#6b7280", fontSize:13, margin:"2px 0 0", fontFamily:"var(--font-sans)" }}>Weekly &amp; Monthly summaries</p>
      </div>

      <button onClick={() => setShowReport(!showReport)}
        className={showReport ? 'fe-btn fe-btn-ghost' : 'fe-btn fe-btn-primary'}
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        📅 {showReport ? '▲ Hide' : '▼ Show'} Weekly/Monthly Reports
      </button>

      {showReport && (
        <div className="fe-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', gap: 8 }}>
              {['weekly', 'monthly'].map(t => (
                <button key={t} onClick={() => setReportType(t)}
                  className={reportType === t ? 'fe-btn fe-btn-primary' : 'fe-btn fe-btn-ghost'}>
                  {t === 'weekly' ? '📅 Weekly' : '📊 Monthly'}
                </button>
              ))}
            </div>

            <div style={{ 
              fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, color: '#1f2937', 
              backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', 
              maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' 
            }}>
              {reportText}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigator.clipboard.writeText(reportText)}
                className="fe-btn fe-btn-primary">
                📋 Copy
              </button>
              <button onClick={() => window.print()}
                className="fe-btn fe-btn-ghost">
                🖨️ Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// السطر الأهم لحل مشكلة الـ Import في App.jsx
export default WeeklyMonthlyReports;