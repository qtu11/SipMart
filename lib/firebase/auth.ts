import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
} from 'firebase/auth';
import { auth } from './config';
import { createUser, getUser } from '../supabase/users'; // Changed to Supabase
import { isAdminEmail, createOrUpdateAdmin } from '../supabase/admin';

// Đăng ký với email/password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
  studentId?: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Nếu là admin email, tạo/update admin document
    if (isAdminEmail(user.email || email)) {
      try {        await createOrUpdateAdmin(
          user.uid,
          user.email || email,
          displayName || email.split('@')[0],
          'super_admin'
        );      } catch (adminError: any) {      }
    }

    // Tạo user document trong Firestore
    try {
      await createUser(user.uid, email, displayName, studentId);
    } catch (userError: any) {      // Nếu là lỗi permission hoặc network, throw lại để frontend biết
      if (userError.code === 'permission-denied' || userError.code === 'unavailable') {
        throw new Error('Không thể tạo tài khoản. Vui lòng thử lại sau.');
      }
      // Các lỗi khác vẫn tiếp tục (document sẽ được tạo lại khi login)
    }

    return user;
  } catch (error: unknown) {
    const err = error as Error;    throw error;
  }
}

// Đăng nhập với email/password
export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Nếu là admin email, tạo/update admin document
    if (isAdminEmail(user.email || email)) {
      try {
        await createOrUpdateAdmin(
          user.uid,
          user.email || email,
          user.displayName || email.split('@')[0],
          'super_admin'
        );
      } catch (adminError: any) {      }
    }

    // Đảm bảo user document tồn tại trong Supabase
    try {
      const existingUser = await getUser(user.uid);
      if (!existingUser) {
        // Tạo user document nếu chưa có
        await createUser(user.uid, user.email || email, user.displayName || undefined);
      }
    } catch (userError: any) {      // Không throw error để user vẫn có thể đăng nhập
    }

    return user;
  } catch (error: unknown) {
    const err = error as Error;    throw error;
  }
}

// Đăng nhập với Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Kiểm tra user đã tồn tại chưa
  const existingUser = await getUser(user.uid);
  if (!existingUser) {
    await createUser(user.uid, user.email || '', user.displayName || undefined);
  }

  return user;
}

// Đăng nhập với Facebook
export async function signInWithFacebook() {
  const provider = new FacebookAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  const existingUser = await getUser(user.uid);
  if (!existingUser) {
    await createUser(user.uid, user.email || '', user.displayName || undefined);
  }

  return user;
}

// Đăng xuất
export async function signOutUser() {
  await signOut(auth);
}

// Lắng nghe thay đổi auth state
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Lấy user hiện tại
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

