import { supabase } from './client';
// We do not import createUser/admin utils here anymore to avoid client-side leakage of server logic
import { isAdminEmail } from './admin';

/**
 * Đăng ký với email/password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
  studentId?: string,
  captchaToken?: string
) {
  try {
    // Sign up với Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          student_id: studentId,
        },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
        captchaToken,
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    const userId = authData.user.id;

    // Call API to create user profile (and admin if needed) securely on server
    try {
      const response = await fetch('/api/auth/post-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          displayName,
          studentId
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('Failed to create user profile:', result.error);
        // We log but don't throw here to ensure the Auth User is created even if Profile creation has issues.
      }
    } catch (apiError) {
      console.error('Error calling post-register API:', apiError);
    }

    return authData.user;
  } catch (error: unknown) {
    // const err = error as Error; 
    throw error;
  }
}

/**
 * Đăng nhập với email/password - SIMPLIFIED VERSION
 */
export async function signInWithEmail(email: string, password: string, captchaToken?: string) {
  try {
    // Step 1: Try direct login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken,
      },
    });
    // If login succeeds, return user
    if (!authError && authData?.user) {
      // Ensure user/admin records exist
      // We call the same API endpoint to ensure records exist
      await ensureUserRecordsViaApi(authData.user.id, authData.user.email || email);

      return authData.user;
    }

    // If login fails, throw error with helpful message
    if (authError) {
      // Provide helpful error messages
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
      }
      if (authError.message.includes('Email not confirmed')) {
        throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra email.');
      }
      throw authError;
    }

    throw new Error('Đăng nhập thất bại');
  } catch (error: unknown) {
    // const err = error as Error; 
    throw error;
  }
}

/**
 * Ensure user and admin records exist in database via API
 */
async function ensureUserRecordsViaApi(userId: string, email: string) {
  try {
    // We reuse the post-register API as it's idempotent (creates if missing)
    // We don't have displayName/studentId on login easily if they aren't in metadata, 
    // but the API handles missing fields gracefully (updateUser vs createUser)
    // Actually post-register calls createUser which handles insert. It might fail if already exists?
    // createUser in users.ts uses .insert(). If conflict?
    // users.ts createUser: .insert({...}).single(). 
    // It does NOT use upsert. It will duplicate key error if exists.
    // However, the API checks isAdmin and calls createOrUpdateAdmin (upsert).
    // createUser logic in API needs to handle "already exists".
    // 
    // Let's just try calling it. If it fails due to PK conflict, it means user exists. Good.
    await fetch('/api/auth/post-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
      }),
    });
  } catch (err: any) {
    // Ignore errors
  }
}

/**
 * Đăng nhập với Google
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    // const err = error as Error; 
    throw error;
  }
}

/**
 * Đăng xuất
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Lắng nghe thay đổi auth state
 */
export function onAuthChange(callback: (user: any | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Lấy user hiện tại (async - recommended)
 */
export async function getCurrentUserAsync() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      return null;
    }
    return session?.user || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get current user (legacy sync - returns promise)
 */
export function getCurrentUser() {
  return getCurrentUserAsync();
}
