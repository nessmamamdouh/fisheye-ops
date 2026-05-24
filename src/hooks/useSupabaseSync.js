import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// تأكد من وجود كلمة export قبل الفانكشن ⬇️
export const useSupabaseSync = (employees, setEmployees) => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // ... باقي كود الـ hook هنا ...

  return {
    syncStatus,
    syncMessage,
    // وباقي الحاجات اللي بتعمل لها return
  };
};