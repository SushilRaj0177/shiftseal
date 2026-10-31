import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Auth, ConfirmationResult, RecaptchaVerifier } from '@firebase/auth';
import { api, setTokenGetter } from '../lib/api.js';
import { callNative, isAndroidApp } from '../lib/native.js';

/**
 * Sign-in. Production uses Firebase Authentication (phone number + SMS code for
 * workers; Google or phone for employers). A server running in `dev` auth mode
 * also offers a developer sign-in; production servers refuse that mode.
 */

interface PublicConfig {
  authMode: 'firebase' | 'dev';
  firebase: { apiKey: string | null; authDomain: string | null; projectId: string | null };
}

export interface SignedInUser {
  uid: string;
  phone?: string;
  email?: string;
}

interface AuthContextValue {
  ready: boolean;
  config: PublicConfig | null;
  user: SignedInUser | null;
  configError: string | null;
  sendCode(phoneE164: string, recaptchaHost: HTMLElement): Promise<void>;
  confirmCode(code: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  devSignIn(uid: string, phone?: string): void;
  signOut(): Promise<void>;
  /** Erases the account on the server and in Firebase, then signs out. */
  deleteAccount(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEV_KEY = 'shiftseal.dev-identity';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [ready, setReady] = useState(false);
  const authRef = useRef<Auth | null>(null);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      try {
        const cfg = await api<PublicConfig>('/config');
        setConfig(cfg);
        if (cfg.authMode === 'dev') {
          const saved = sessionStorage.getItem(DEV_KEY);
          if (saved) setUser(JSON.parse(saved) as SignedInUser);
          setTokenGetter(async () => {
            const s = sessionStorage.getItem(DEV_KEY);
            if (!s) return null;
            const u = JSON.parse(s) as SignedInUser;
            return `dev:${u.uid}${u.phone ? `:${u.phone}` : ''}`;
          });
          setReady(true);
          return;
        }
        if (!cfg.firebase.apiKey || !cfg.firebase.authDomain) {
          setConfigError('Sign-in is not configured on this server yet.');
          setReady(true);
          return;
        }
        const [{ initializeApp }, fa] = await Promise.all([
          import('@firebase/app'),
          import('@firebase/auth'),
        ]);
        const app = initializeApp({
          apiKey: cfg.firebase.apiKey,
          authDomain: cfg.firebase.authDomain,
          projectId: cfg.firebase.projectId ?? undefined,
        });
        const auth = fa.getAuth(app);
        auth.useDeviceLanguage();
        authRef.current = auth;
        setTokenGetter(async () => (auth.currentUser ? auth.currentUser.getIdToken() : null));
        unsubscribe = fa.onAuthStateChanged(auth, (u) => {
          setUser(
            u
              ? { uid: u.uid, phone: u.phoneNumber ?? undefined, email: u.email ?? undefined }
              : null
          );
          setReady(true);
        });
      } catch {
        setConfigError('Could not reach Shiftseal. Check your connection and try again.');
        setReady(true);
      }
    })();
    return () => unsubscribe();
  }, []);

  const sendCode = useCallback(async (phone: string, host: HTMLElement) => {
    const auth = authRef.current;
    if (!auth) throw new Error('Sign-in is not ready yet.');
    const fa = await import('@firebase/auth');
    verifier.current?.clear();
    verifier.current = new fa.RecaptchaVerifier(auth, host, { size: 'invisible' });
    confirmation.current = await fa.signInWithPhoneNumber(auth, phone, verifier.current);
  }, []);

  const confirmCode = useCallback(async (code: string) => {
    if (!confirmation.current) throw new Error('Request a new code first.');
    await confirmation.current.confirm(code);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = authRef.current;
    if (!auth) throw new Error('Sign-in is not ready yet.');
    const fa = await import('@firebase/auth');
    // Google refuses sign-in pages inside an app's web view, so the Android app
    // signs in natively and hands over the Google ID token.
    if (isAndroidApp()) {
      const res = await callNative<{ idToken?: string; error?: string }>(
        'googleSignIn',
        {},
        120_000
      );
      if (!res?.idToken) {
        if (res?.error === 'cancelled') return;
        throw new Error(
          'Google sign-in did not work on this phone. Try your phone number instead.'
        );
      }
      await fa.signInWithCredential(auth, fa.GoogleAuthProvider.credential(res.idToken));
      return;
    }
    await fa.signInWithPopup(auth, new fa.GoogleAuthProvider());
  }, []);

  const devSignIn = useCallback((uid: string, phone?: string) => {
    const u = { uid, phone };
    sessionStorage.setItem(DEV_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(DEV_KEY);
    if (authRef.current) {
      const fa = await import('@firebase/auth');
      await fa.signOut(authRef.current);
    }
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await api('/me', { method: 'DELETE' });
    const auth = authRef.current;
    if (auth?.currentUser) {
      const fa = await import('@firebase/auth');
      // Firebase may ask for a recent sign-in first; the Shiftseal account is
      // already gone by then, so signing out is enough.
      await fa.deleteUser(auth.currentUser).catch(() => undefined);
    }
    await signOut();
  }, [signOut]);

  const value = useMemo(
    () => ({
      ready,
      config,
      user,
      configError,
      sendCode,
      confirmCode,
      signInWithGoogle,
      devSignIn,
      signOut,
      deleteAccount,
    }),
    [
      ready,
      config,
      user,
      configError,
      sendCode,
      confirmCode,
      signInWithGoogle,
      devSignIn,
      signOut,
      deleteAccount,
    ]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

/** Firebase error codes, in words a worker understands. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('invalid-phone-number')) return 'That phone number does not look right.';
  if (code.includes('invalid-verification-code'))
    return 'That code is not right. Check the SMS and try again.';
  if (code.includes('code-expired')) return 'That code has expired. Request a new one.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a few minutes.';
  if (code.includes('popup-closed')) return 'Sign-in was cancelled.';
  if (code.includes('network')) return 'No internet connection.';
  return err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
}
