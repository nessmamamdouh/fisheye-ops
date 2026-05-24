import { createClient } from '@supabase/supabase-js'; // تم التغيير من client إلى js

const supabaseUrl = 'https://noutbupdtbqdheyhlmdm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdXRidXBkdGJxZGhleWhsbWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MzI2NDQsImV4cCI6MjA5MzIwODY0NH0.yLBTuS_DO322I2e0QjbLBHIUk6_k8tkMGCKBDUlQLLo'

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