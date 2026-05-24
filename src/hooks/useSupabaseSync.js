import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

/**
 * useSupabaseSync
 * ---------------
 * Handles full two-way sync between localStorage and Supabase for:
 *   - employees  (table: employees_master)
 *   - clients    (table: fisheye_clients)
 *   - partners   (table: fisheye_partners)
 *   - payroll    (table: fisheye_payroll_flows)
 */
export const useSupabaseSync = (employees, setEmployees, extraData = {}) => {
  const [syncStatus, setSyncStatus]     = useState('idle');   // idle | syncing | success | error
  const [syncMessage, setSyncMessage]   = useState('');
  const [lastSync, setLastSync]         = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isOnline, setIsOnline]         = useState(navigator.onLine);

  // ── Online / Offline listener ────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Helper: chunk array for progress reporting ───────────────────────────
  const upsertInChunks = async (table, rows, idField = '_id') => {
    if (!rows || rows.length === 0) return { error: null };
    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: idField });
      if (error) return { error };
      setSyncProgress(Math.round(((i + CHUNK) / rows.length) * 100));
    }
    return { error: null };
  };

  // ── Upload all data to Supabase ──────────────────────────────────────────
  const uploadToCloud = useCallback(async (empOverride) => {
    setSyncStatus('syncing');
    setSyncMessage('جاري الرفع إلى السحابة...');
    setSyncProgress(0);

    try {
      const emps = empOverride || employees;

      // 1. Employees
      if (emps && emps.length > 0) {
        const { error } = await upsertInChunks('employees_master', emps, '_id');
        if (error) throw new Error('employees: ' + error.message);
      }
      setSyncProgress(40);

      // 2. Clients
      const rawClients = localStorage.getItem('fisheyeClients_v1');
      if (rawClients) {
        const clients = JSON.parse(rawClients);
        if (clients.length > 0) {
          const { error } = await upsertInChunks('fisheye_clients', clients, 'id');
          if (error) throw new Error('clients: ' + error.message);
        }
      }
      setSyncProgress(65);

      // 3. Partners
      const rawPartners = localStorage.getItem('fisheyePartners_v1');
      if (rawPartners) {
        const partners = JSON.parse(rawPartners);
        if (partners.length > 0) {
          const { error } = await upsertInChunks('fisheye_partners', partners, 'id');
          if (error) throw new Error('partners: ' + error.message);
        }
      }
      setSyncProgress(85);

      // 4. Payroll flows
      const rawPayroll = localStorage.getItem('fisheye_payroll_flow_v1');
      if (rawPayroll) {
        const flows = JSON.parse(rawPayroll);
        const rows = Object.entries(flows).map(([month, data]) => ({ month, data }));
        if (rows.length > 0) {
          const { error } = await upsertInChunks('fisheye_payroll_flows', rows, 'month');
          if (error) throw new Error('payroll: ' + error.message);
        }
      }
      setSyncProgress(100);

      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('fisheye_last_sync', now);
      setSyncStatus('success');
      setSyncMessage('✅ تم الرفع بنجاح');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('uploadToCloud error:', err);
      setSyncStatus('error');
      setSyncMessage('❌ فشل الرفع: ' + err.message);
    }
  }, [employees]);

  // ── Download all data from Supabase ─────────────────────────────────────
  const downloadFromCloud = useCallback(async () => {
    setSyncStatus('syncing');
    setSyncMessage('جاري التحميل من السحابة...');
    setSyncProgress(0);

    try {
      // 1. Employees
      const { data: emps, error: empErr } = await supabase.from('employees_master').select('*');
      if (empErr) throw new Error('employees: ' + empErr.message);
      if (emps && emps.length > 0) {
        setEmployees(emps);
        localStorage.setItem('fisheyeData_v3', JSON.stringify(emps));
      }
      setSyncProgress(40);

      // 2. Clients
      const { data: clients, error: clErr } = await supabase.from('fisheye_clients').select('*');
      if (!clErr && clients && clients.length > 0) {
        localStorage.setItem('fisheyeClients_v1', JSON.stringify(clients));
      }
      setSyncProgress(65);

      // 3. Partners
      const { data: partners, error: pErr } = await supabase.from('fisheye_partners').select('*');
      if (!pErr && partners && partners.length > 0) {
        localStorage.setItem('fisheyePartners_v1', JSON.stringify(partners));
      }
      setSyncProgress(85);

      // 4. Payroll flows
      const { data: flows, error: flErr } = await supabase.from('fisheye_payroll_flows').select('*');
      if (!flErr && flows && flows.length > 0) {
        const obj = {};
        flows.forEach(r => { obj[r.month] = r.data; });
        localStorage.setItem('fisheye_payroll_flow_v1', JSON.stringify(obj));
      }
      setSyncProgress(100);

      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('fisheye_last_sync', now);
      setSyncStatus('success');
      setSyncMessage('✅ تم التحميل بنجاح — أعد تحميل الصفحة لرؤية التغييرات');
      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (err) {
      console.error('downloadFromCloud error:', err);
      setSyncStatus('error');
      setSyncMessage('❌ فشل التحميل: ' + err.message);
    }
  }, [setEmployees]);

  // ── Backup (alias for upload) ────────────────────────────────────────────
  const backup = useCallback(() => uploadToCloud(), [uploadToCloud]);

  // ── Bidirectional sync: remote wins for employees, merge rest ────────────
  const bidirectionalSync = useCallback(async () => {
    setSyncStatus('syncing');
    setSyncMessage('جاري المزامنة الثنائية...');
    setSyncProgress(0);

    try {
      // Pull remote employees
      const { data: remoteEmps, error: pullErr } = await supabase.from('employees_master').select('*');
      if (pullErr) throw new Error(pullErr.message);
      setSyncProgress(30);

      // Merge: remote takes priority, add any local-only records
      const remoteIds = new Set((remoteEmps || []).map(e => e._id));
      const localOnly = employees.filter(e => !remoteIds.has(e._id));
      const merged = [...(remoteEmps || []), ...localOnly];

      if (merged.length > 0) {
        setEmployees(merged);
        localStorage.setItem('fisheyeData_v3', JSON.stringify(merged));
        // Push merged back
        await upsertInChunks('employees_master', merged, '_id');
      }
      setSyncProgress(70);

      // Upload clients + partners + payroll
      await uploadToCloud(merged);
      setSyncProgress(100);

      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('fisheye_last_sync', now);
      setSyncStatus('success');
      setSyncMessage('✅ تمت المزامنة الثنائية بنجاح');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('bidirectionalSync error:', err);
      setSyncStatus('error');
      setSyncMessage('❌ فشلت المزامنة: ' + err.message);
    }
  }, [employees, setEmployees, uploadToCloud]);

  // ── Load last sync time from localStorage ────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('fisheye_last_sync');
    if (saved) setLastSync(saved);
  }, []);

  return {
    syncStatus,
    syncMessage,
    lastSync,
    syncProgress,
    isOnline,
    uploadToCloud,
    downloadFromCloud,
    backup,
    bidirectionalSync,
  };
};
