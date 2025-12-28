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
        const displayName = data.user.user_metadata?.display_name || data.user.user_metadata?.full_name || email.split('@')[0];

        // Nếu là admin email, tạo/update admin document
        if (isAdminEmail(email)) {
          try {
            await createOrUpdateAdmin(userId, email, displayName, 'super_admin');
          } catch (adminError) {
            console.error('Error creating admin:', adminError);
          }
        }

        // Đảm bảo user document tồn tại
        try {
          const { getUser } = await import('@/lib/supabase/users');
          const existingUser = await getUser(userId);
          if (!existingUser) {
            await createUser(userId, email, displayName);
          }
        } catch (userError) {
          console.error('Error creating user:', userError);
        }

        // Redirect based on admin status
        if (isAdminEmail(email)) {
          return NextResponse.redirect(new URL('/admin', requestUrl.origin));
        } else {
          return NextResponse.redirect(new URL('/', requestUrl.origin));
        }
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}

