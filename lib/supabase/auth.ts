import { supabase } from './client';
import { createUser } from './users';
import { isAdminEmail, createOrUpdateAdmin } from './admin';

/**
 * Đăng ký với email/password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
  studentId?: string
) {
  try {
    console.log('🔵 Supabase signUp - Starting...', { email, displayName, studentId });
    
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
      },
    });

    if (authError) {
      console.error('❌ Supabase Auth error:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      console.error('❌ No user returned from signUp');
      throw new Error('User creation failed');
    }

    const userId = authData.user.id;
    console.log('✅ Supabase Auth success, userId:', userId);

    // Nếu là admin email, tạo/update admin document
    if (isAdminEmail(email)) {
      try {
        console.log('🔐 Admin email detected during signup, creating admin document...');
        await createOrUpdateAdmin(
          userId,
          email,
          displayName || email.split('@')[0],
          'super_admin'
        );
        console.log('✅ Admin document created successfully');
      } catch (adminError: any) {
        console.error('❌ Error creating/updating admin document:', adminError);
      }
    }

    // Tạo user document trong Supabase
    try {
      console.log('🔵 Creating user document in Supabase...');
      await createUser(userId, email, displayName, studentId);
      console.log('✅ User document created successfully');
    } catch (userError: any) {
      console.error('❌ Error creating user document:', userError);
      console.error('User error details:', JSON.stringify(userError, null, 2));
      
      // Nếu là lỗi duplicate (user đã tồn tại), không throw error
      // Vì có thể auth user đã được tạo nhưng document chưa có
      if (userError.code === '23505' || userError.message?.includes('duplicate') || userError.message?.includes('unique')) {
        console.warn('⚠️ User document already exists, continuing...');
      } else {
        throw new Error(`Không thể tạo tài khoản: ${userError.message || 'Vui lòng thử lại sau'}`);
      }
    }

    console.log('✅ SignUp completed successfully');
    return authData.user;
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    throw error;
  }
}

/**
 * Đăng nhập với email/password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    console.log('🔵 Supabase signIn - Starting...', { email });
    
    // Thử đăng nhập với Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Nếu lỗi, kiểm tra xem có phải admin credentials không và tạo user mới
    if (authError) {
      console.log('⚠️ Sign in failed, checking admin credentials...', authError.message);
      
      // Check admin credentials (chỉ dùng NEXT_PUBLIC_* ở client-side)
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      
      if (adminKey && adminPassword) {
        const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
        const normalizedEmail = email.toLowerCase().trim();
        const isAdminEmail = adminKeys.includes(normalizedEmail);
        const isAdminPassword = password === adminPassword;
        
        if (isAdminEmail && isAdminPassword) {
          console.log('✅ Admin credentials valid, attempting to create user...');
          
          // Tạo user mới trong Supabase Auth với admin credentials
          // Thử signUp thông thường, nếu lỗi confirmation email thì thử đăng nhập lại
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: email.split('@')[0],
              },
              emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : '',
            },
          });
          
          // Nếu lỗi "already registered", thử đăng nhập lại
          if (signUpError?.message?.includes('already registered') || signUpError?.message?.includes('already been registered')) {
            console.log('🔄 User already exists, retrying sign in...');
            const retryResult = await supabase.auth.signInWithPassword({ email, password });
            if (retryResult.error) {
              console.error('❌ Retry sign in failed:', retryResult.error);
              throw new Error('Không thể đăng nhập. Vui lòng kiểm tra lại mật khẩu.');
            }
            if (!retryResult.data?.user) {
              throw new Error('Login failed');
            }
            
            const userId = retryResult.data.user.id;
            console.log('✅ Supabase Auth success after retry, userId:', userId);
            
            await createOrUpdateAdmin(userId, email, email.split('@')[0], 'super_admin');
            const { getUser } = await import('./users');
            const existingUser = await getUser(userId);
            if (!existingUser) {
              await createUser(userId, email, email.split('@')[0]);
            }
            
            return retryResult.data.user;
          }
          
          // Nếu lỗi "confirmation email" hoặc "Error sending", user có thể đã được tạo
          // Thử đăng nhập ngay để xem user đã tồn tại chưa
          if (signUpError?.message?.includes('confirmation email') || 
              signUpError?.message?.includes('Error sending') ||
              signUpError?.message?.includes('email')) {
            console.log('⚠️ Confirmation email error detected, but user might be created. Trying to sign in...');
            console.log('📋 SignUp error details:', signUpError);
            
            // Đợi 2 giây để Supabase xử lý việc tạo user
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const retryResult = await supabase.auth.signInWithPassword({ email, password });
            console.log('🔄 Retry sign in result:', { error: retryResult.error, hasUser: !!retryResult.data?.user });
            
            if (!retryResult.error && retryResult.data?.user) {
              console.log('✅ User created and signed in successfully despite confirmation email error');
              const userId = retryResult.data.user.id;
              await createOrUpdateAdmin(userId, email, email.split('@')[0], 'super_admin');
              const { getUser } = await import('./users');
              const existingUser = await getUser(userId);
              if (!existingUser) {
                await createUser(userId, email, email.split('@')[0]);
              }
              return retryResult.data.user;
            }
            
            // Nếu vẫn không đăng nhập được, có thể user chưa được tạo hoặc cần confirm email
            console.error('❌ Cannot sign in after signUp. SignUp error:', signUpError);
            console.error('❌ Retry sign in error:', retryResult.error);
            
            // Throw error với hướng dẫn chi tiết
            throw new Error(
              'Không thể tạo tài khoản admin tự động. ' +
              'Vui lòng tạo user thủ công trong Supabase Dashboard: ' +
              'Authentication > Users > Add user (email: qtusadmin@gmail.com, password: qtusdev, Auto Confirm: ON). ' +
              'Hoặc tắt email confirmation trong Supabase: Authentication > Providers > Email > Confirm email (OFF).'
            );
          }
          
          // Nếu có lỗi khác, throw error
          if (signUpError) {
            throw signUpError;
          }
          
          // User created successfully
          if (!signUpData?.user) {
            throw new Error('Failed to create admin user');
          }
          
          console.log('✅ Admin user created, userId:', signUpData.user.id);
          
          // Tạo admin và user documents
          const userId = signUpData.user.id;
          await createOrUpdateAdmin(userId, email, email.split('@')[0], 'super_admin');
          
          const { getUser } = await import('./users');
          const existingUser = await getUser(userId);
          if (!existingUser) {
            await createUser(userId, email, email.split('@')[0]);
          }
          
          return signUpData.user;
        }
      }
      
      // Không phải admin credentials hoặc không có env vars
      console.error('❌ Supabase Auth error:', authError);
      throw authError;
    }
    
    if (!authData?.user) {
      console.error('❌ No user returned from signIn');
      throw new Error('Login failed');
    }

    const userId = authData.user.id;
    console.log('✅ Supabase Auth success, userId:', userId);

    // Nếu là admin email, tạo/update admin document
    if (isAdminEmail(authData.user.email || email)) {
      try {
        await createOrUpdateAdmin(
          userId,
          authData.user.email || email,
          authData.user.user_metadata?.display_name || email.split('@')[0],
          'super_admin'
        );
      } catch (adminError: any) {
        console.error('Error creating/updating admin document:', adminError);
      }
    }

    // Đảm bảo user document tồn tại trong Supabase
    try {
      const { getUser } = await import('./users');
      const existingUser = await getUser(userId);
      if (!existingUser) {
        // Tạo user document nếu chưa có
        await createUser(userId, authData.user.email || email, authData.user.user_metadata?.display_name);
      }
    } catch (userError: any) {
      console.error('Error checking/creating user document:', userError);
      // Không throw error để user vẫn có thể đăng nhập
    }

    return authData.user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
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
  } catch (error: any) {
    console.error('Google sign in error:', error);
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
      console.error('Error getting session:', error);
      return null;
    }
    return session?.user || null;
  } catch (error) {
    console.error('Error in getCurrentUserAsync:', error);
    return null;
  }
}

/**
 * Get current user (legacy sync - returns promise)
 */
export function getCurrentUser() {
  return getCurrentUserAsync();
}
