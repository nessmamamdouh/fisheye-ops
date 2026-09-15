import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './utils/supabase';

const AuthContext = createContext({ session: null, profile: null });
export const useAuth = () => useContext(AuthContext);

const ALLOWED_DOMAIN = '@fisheye.sa';

// Exported for unit testing. This is UX only (an early, friendly error in
// the signup form) — the real security boundary is the DB trigger in
// supabase/migrations/001_profiles_and_signup_gate.sql, which is what
// actually decides whether a signup ever gets a profiles row and
// therefore any access at all.
export function isAllowedDomain(email) {
  return (email || '').trim().toLowerCase().endsWith(ALLOWED_DOMAIN);
}

function Centered({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f4f7fe', fontFamily: 'var(--font-sans), Inter, -apple-system, sans-serif',
    }}>
      {children}
    </div>
  );
}

function AuthCard({ children }) {
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 20, padding: '36px 32px', width: 360,
      maxWidth: 'calc(100vw - 32px)', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #f0f2f5',
    }}>
      {children}
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const domainOk = isAllowedDomain(email);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice('');
    const trimmedEmail = email.trim();
    if (mode === 'signup' && !isAllowedDomain(trimmedEmail)) {
      setError(`لازم تستخدمي إيميل بنطاق ${ALLOWED_DOMAIN}`);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email: trimmedEmail, password });
        if (err) throw err;
        setNotice('تم إنشاء الحساب. لو محتاج تأكيد إيميل، هتوصلك رسالة — بعد كده سجّلي دخول عادي.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'حصل خطأ، حاولي تاني');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Centered>
      <AuthCard>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1B2559' }}>Fisheye Ops Pro</h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#A3AED0' }}>
          {mode === 'login' ? 'سجّلي دخول للمتابعة' : `أنشئي حساب بإيميل ${ALLOWED_DOMAIN}`}
        </p>

        <form onSubmit={submit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>الإيميل</label>
          <input
            type="email" required autoFocus value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={`name${ALLOWED_DOMAIN}`}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid #E9EDF7', fontSize: 14, marginBottom: 14 }}
          />
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>الباسورد</label>
          <input
            type="password" required minLength={6} value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid #E9EDF7', fontSize: 14, marginBottom: 6 }}
          />
          {mode === 'signup' && email && !domainOk && (
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#dc2626' }}>لازم يكون الإيميل بنطاق {ALLOWED_DOMAIN}</p>
          )}
          {error && <p style={{ margin: '10px 0', fontSize: 12, color: '#dc2626' }}>{error}</p>}
          {notice && <p style={{ margin: '10px 0', fontSize: 12, color: '#16a34a' }}>{notice}</p>}

          <button
            type="submit" disabled={busy}
            style={{
              width: '100%', marginTop: 10, padding: '11px 0', borderRadius: 10, border: 'none',
              backgroundColor: '#A02843', color: '#fff', fontWeight: 800, fontSize: 14,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? '...' : (mode === 'login' ? 'دخول' : 'إنشاء حساب')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: '#A3AED0' }}>
          {mode === 'login' ? (
            <>مفيش حساب؟ <span style={{ color: '#A02843', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setMode('signup'); setError(''); }}>اعملي حساب جديد</span></>
          ) : (
            <>عندك حساب بالفعل؟ <span style={{ color: '#A02843', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); }}>سجّلي دخول</span></>
          )}
        </p>
      </AuthCard>
    </Centered>
  );
}

function NoAccessScreen({ email }) {
  return (
    <Centered>
      <AuthCard>
        <h1 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 900, color: '#991b1b' }}>مفيش صلاحية دخول</h1>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#374151' }}>
          الحساب ({email}) مش مسموح له بالدخول على النظام — لازم يكون إيميل بنطاق {ALLOWED_DOMAIN}.
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: '#A3AED0' }}>
          لو فاكرة إن ده غلط، كلّمي المسؤول عن النظام.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid #E9EDF7', backgroundColor: '#fff', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          تسجيل خروج
        </button>
      </AuthCard>
    </Centered>
  );
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState('idle'); // idle | loading | ready

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s || null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!session) {
      setProfile(null);
      setProfileState('idle');
      return;
    }
    setProfileState('loading');
    supabase
      .from('profiles')
      .select('id,email,role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data || null);
        setProfileState('ready');
      });
    return () => { cancelled = true; };
  }, [session]);

  if (session === undefined) {
    return <Centered><p style={{ color: '#A3AED0', fontSize: 13 }}>جارِ التحميل…</p></Centered>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (profileState !== 'ready') {
    return <Centered><p style={{ color: '#A3AED0', fontSize: 13 }}>جارِ التحقق من الصلاحيات…</p></Centered>;
  }

  if (!profile) {
    return <NoAccessScreen email={session.user.email} />;
  }

  return (
    <AuthContext.Provider value={{ session, profile }}>
      {children}
    </AuthContext.Provider>
  );
}
