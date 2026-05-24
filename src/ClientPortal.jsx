import React, { useMemo } from 'react';
import { isExcluded } from './utils/helpers';

const WORKFLOW_OPTS = ["Agreement Signed","Pending","Complete","Rejected","Qiwa Submitted","Qiwa Approved","Onboarding"];
const ONBOARDING_STEPS = ["Docs Requested", "Docs Received", "Docs Received +"];

function StatCard({ title, value, icon, color = "#800000" }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f2f5' }}>
      <div style={{ width: 48, height: 48, backgroundColor: `${color}15`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        {icon}
      </div>
      <div>
        <p style={{ color: '#A3AED0', fontSize: 11, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</p>
        <h3 style={{ color: '#1B2559', fontSize: 26, margin: 0, fontWeight: 900 }}>{value}</h3>
      </div>
    </div>
  );
}

function StatusPill({ value, map }) {
  const cfg = map[value] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {value || 'Pending'}
    </span>
  );
}

const QIWA_MAP = {
  'Qiwa Approved': { bg: '#def7ec', color: '#03543f' },
  'Qiwa Submitted': { bg: '#e1effe', color: '#1e429f' },
};

const STATUS_MAP = {
  'active': { bg: '#E6FAF5', color: '#05CD99' },
  'expired': { bg: '#FFF5F5', color: '#EE5D50' },
  'resigned': { bg: '#f3f4f6', color: '#6b7280' },
};

const WF_MAP = {
  'Qiwa Approved':   { bg: '#def7ec', color: '#03543f' },
  'Qiwa Submitted':  { bg: '#e1effe', color: '#1e429f' },
  'Onboarding':      { bg: '#fef3c7', color: '#92400e' },
  'Agreement Signed':{ bg: '#ede9fe', color: '#5b21b6' },
  'Complete':        { bg: '#dcfce7', color: '#166534' },
  'Pending':         { bg: '#f3f4f6', color: '#6b7280' },
  'Rejected':        { bg: '#fee2e2', color: '#991b1b' },
};

export default function ClientPortal({ employees, clientName: propClientName }) {
  // Support both URL params and props
  const clientName = propClientName || new URLSearchParams(window.location.search).get('client');

  const clientData = useMemo(() => {
    return (employees || []).filter(emp =>
      emp.client?.toLowerCase() === clientName?.toLowerCase() &&
      !isExcluded(emp)
    );
  }, [employees, clientName]);

  const stats = {
    active:        clientData.filter(e => e.status?.toLowerCase() === 'active').length,
    onboarding:    clientData.filter(e => ["Docs Requested", "Docs Received", "Docs Received +"].includes(e.workflowStatus)).length,
    qiwaSubmitted: clientData.filter(e => e.workflowStatus === 'Qiwa Submitted').length,
    qiwaApproved:  clientData.filter(e => e.workflowStatus === 'Qiwa Approved').length,
  };

  const onboardingBreakdown = ONBOARDING_STEPS.map(step => ({
    label: step,
    count: clientData.filter(e => e.workflowStatus === step).length,
  }));

  // Billing Info
  const totalPayroll = clientData.reduce((sum, e) => sum + (Number(e.totalPackage) || 0), 0);

  return (
    <div style={{ backgroundColor: '#f4f7fe', minHeight: '100vh', fontFamily: 'var(--font-sans), Inter, -apple-system, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: '#fff', padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E9EDF7', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, backgroundColor: '#800000', borderRadius: 8 }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: '#1B2559' }}>
            Client Portal <span style={{ color: '#A3AED0', fontWeight: 400 }}>| {clientName}</span>
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#A3AED0', fontWeight: 600 }}>Live Workforce Data</span>
      </nav>

      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', paddingBottom: 80 }}>

        {/* Main Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard title="Active Workforce" value={stats.active} icon="👥" color="#800000" />
          <StatCard title="Onboarding" value={stats.onboarding} icon="⏳" color="#d97706" />
          <StatCard title="Qiwa Submitted" value={stats.qiwaSubmitted} icon="📩" color="#2563eb" />
          <StatCard title="Qiwa Approved" value={stats.qiwaApproved} icon="✅" color="#16a34a" />
        </div>

        {/* Billing Summary */}
        <div className="fe-card" style={{ borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', fontFamily: 'var(--font-sans)' }}>
          <p style={{ margin: '0 0 14px', fontWeight: 800, fontSize: 13, color: '#374151' }}>💳 Monthly Billing</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Total Payroll This Month</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#800000', marginTop: 4 }}>SR {totalPayroll.toLocaleString()}</div>
            </div>
            <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Headcount</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1e429f', marginTop: 4 }}>{clientData.length}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Invoice will be issued by 7th of month</p>
            </div>
          </div>
        </div>

        {/* Onboarding Breakdown */}
        {stats.onboarding > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 24, border: '1px solid #fde68a', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <p style={{ margin: '0 0 14px', fontWeight: 800, fontSize: 13, color: '#92400e' }}>⏳ Onboarding Breakdown</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {onboardingBreakdown.map(({ label, count }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 18px' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#92400e' }}>{count}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workforce Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f0f2f5', fontFamily: 'var(--font-sans)' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#1B2559', margin: 0, fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-sans)' }}>Staffing Directory</h3>
            <p style={{ color: '#A3AED0', fontSize: 13, margin: '4px 0 0' }}>Showing all active and pending employees · {clientData.length} records</p>
          </div>

          <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
            <table className="fe-table" style={{ width: '100%', textAlign: 'left', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F4F7FE' }}>
                  {['Employee', 'Position & Project', 'ID / IQAMA', 'Workflow', 'Start Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#A3AED0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientData.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#A3AED0', fontSize: 14 }}>No active records found for this client.</td></tr>
                ) : clientData.map(emp => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid #F4F7FE' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                    <td style={{ padding: '14px 16px', color: '#1B2559', fontWeight: 700, fontSize: 13 }}>{emp.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#2B3674', fontSize: 13, fontWeight: 600 }}>{emp.position || '—'}</div>
                      <div style={{ color: '#A3AED0', fontSize: 11 }}>{emp.project || 'General'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#2B3674', fontFamily: 'monospace', fontSize: 12 }}>{emp.idNumber || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusPill value={emp.workflowStatus} map={WF_MAP} />
                    </td>
                    <td style={{ padding: '14px 16px', color: '#718096', fontSize: 12 }}>{emp.startDate || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusPill value={emp.status?.toLowerCase()} map={STATUS_MAP} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#d1d5db' }}>
          Powered by Fisheye Ops · Read-only view · Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
import { useOperationalIssues } from './useOperationalIssues';

function ClientView({ employees, clientName }) {
  const issues = useOperationalIssues(employees);
  const clientIssues = issues.byClient[clientName] || [];
  // Show only issues relevant to this client
}