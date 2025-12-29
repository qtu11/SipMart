import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createUser } from '@/lib/supabase/users';
import { isAdminEmail, createOrUpdateAdmin } from '@/lib/supabase/admin';

/**
 * OAuth callback handler cho Supabase
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', requestUrl.origin));
      }

      if (data.user) {
        const userId = data.user.id;
        const email = data.user.email || '';
        const displayName = data.user.user_metadata?.display_name || 
                          data.user.user_metadata?.full_name || 
                          data.user.user_metadata?.name ||
                          email.split('@')[0];

        // Nếu là admin email, tạo/update admin document
        if (isAdminEmail(email)) {
          try {
            await createOrUpdateAdmin(userId, email, displayName, 'super_admin');
            console.log('✅ Admin document created/updated for OAuth user');
          } catch (adminError) {
            console.error('❌ Error creating admin:', adminError);
            // Continue even if admin creation fails
          }
        }

        // Đảm bảo user document tồn tại
        try {
          const { getUser } = await import('@/lib/supabase/users');
          const existingUser = await getUser(userId);
          if (!existingUser) {
            console.log('🔵 Creating user document for OAuth user...');
            await createUser(userId, email, displayName);
            console.log('✅ User document created successfully');
          } else {
            console.log('✅ User document already exists');
          }
        } catch (userError: any) {
          console.error('❌ Error creating user:', userError);
          // Nếu là lỗi duplicate, không cần throw
          if (userError.code === '23505' || userError.message?.includes('duplicate')) {
            console.warn('⚠️ User document already exists, continuing...');
          } else {
            // Log error nhưng vẫn redirect (user đã được tạo trong auth)
            console.error('⚠️ User document creation failed, but auth user exists');
          }
        }

        // Redirect based on admin status
        if (isAdminEmail(email)) {
          console.log('🔐 Admin OAuth login, redirecting to /admin');
          return NextResponse.redirect(new URL('/admin', requestUrl.origin));
        } else {
          console.log('✅ Regular user OAuth login, redirecting to /');
          return NextResponse.redirect(new URL('/', requestUrl.origin));
        }
      } else {
        console.error('❌ No user in OAuth callback data');
        return NextResponse.redirect(new URL('/auth/login?error=no_user', requestUrl.origin));
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}

