/**
 * Google sign-in script (Google Identity Services), loaded only when needed.
 *
 * It used to load in the <head> of every page (~100 KB of JavaScript on every
 * visit). Now it loads:
 *  - for One Tap ("Continue as …"): a few seconds after the page has finished,
 *  - for the "Sign in with Google" buttons (checkout, admin): when they appear.
 * Pure browser code with no Firebase imports, so it stays tiny.
 */
const GSI_SRC = 'https://accounts.google.com/gsi/client';

let loading: Promise<boolean> | null = null;

const gsi = () => (typeof window !== 'undefined' ? (window as any).google?.accounts?.id : undefined);

/** Resolves true once the script is ready (false if it couldn't load) */
export function loadGoogleIdentity(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (gsi()) return Promise.resolve(true);
    if (!loading) {
        loading = new Promise<boolean>((resolve) => {
            const script = document.createElement('script');
            script.src = GSI_SRC;
            script.async = true;
            script.onload = () => resolve(!!gsi());
            script.onerror = () => { loading = null; resolve(false); };
            document.head.appendChild(script);
        });
    }
    return loading;
}

/** Show Google One Tap; `onCredential` gets the Google ID token when the visitor continues */
export async function startGoogleOneTap(onCredential: (credential: string) => void): Promise<void> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !(await loadGoogleIdentity())) return;
    const id = gsi();
    id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => { if (response?.credential) onCredential(response.credential); },
        auto_select: true,
        cancel_on_tap_outside: false,
    });
    id.prompt();
}
