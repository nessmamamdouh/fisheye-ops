import { createClient } from '@supabase/supabase-js'; // تم التغيير من client إلى js

// Credentials load from environment variables (Vite: import.meta.env.VITE_*),
// set in .env.local for local dev and in the Vercel project settings for
// production/preview deployments. See .env.example for the required keys.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly at build/boot time instead of silently shipping a client
  // that can't reach the database — a missing env var should never look
  // like a network outage to the user.
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_KEY. ' +
    'Set them in .env.local (dev) or the Vercel project environment variables (prod).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
// onboarding-supabase.js
export const onboardingTables = {
  tickets: 'onboarding_tickets',
  steps: 'onboarding_steps',
  documents: 'employee_documents',
  approvals: 'onboarding_approvals'
};

export async function initOnboardingDatabase() {
  // Create tables
  // Setup RLS policies
  // Setup triggers
}
export const testConnection = async () => {
  try {
    const { data, error, status } = await supabase
      .from('employees_master')
      .select('*')
      .limit(1); // نطلب سطر واحد فقط للتجربة
    
    if (error) {
      console.error("❌ فشل الاتصال بالسيرفر:", error.message);
      return false;
    }

    if (data) {
      console.log("✅ تم الاتصال بنجاح! عينة من البيانات:", data);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error("❌ خطأ غير متوقع:", err);
    return false;
  }
};