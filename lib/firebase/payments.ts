// Firebase Payment Management
import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  PaymentMethod,
  PaymentTransaction,
  PaymentMethodType,
  PaymentTransactionType,
  PaymentTransactionStatus,
} from '@/lib/types';

const COLLECTIONS = {
  PAYMENT_METHODS: 'paymentMethods',
  PAYMENT_TRANSACTIONS: 'paymentTransactions',
};

// ============= PAYMENT METHODS =============

export async function addPaymentMethod(
  userId: string,
  data: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt'>
) {
  try {
    const methodRef = doc(collection(db, COLLECTIONS.PAYMENT_METHODS));
    const method: PaymentMethod = {
      ...data,
      id: methodRef.id,
      userId,
      createdAt: new Date(),
    };

    await setDoc(methodRef, {
      ...method,
      createdAt: serverTimestamp(),
    });

    // Nếu là default, unset các default khác
    if (data.isDefault) {
      await setOtherMethodsNotDefault(userId, method.id);
    }

    return { success: true, method };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_METHODS),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PaymentMethod);
  } catch (error) {
    return [];
  }
}

export async function setDefaultPaymentMethod(userId: string, methodId: string) {
  try {
    // Unset all defaults
    await setOtherMethodsNotDefault(userId, methodId);

    // Set new default
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_METHODS),
      where('userId', '==', userId),
      where('id', '==', methodId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { isDefault: true });
      return { success: true };
    }

    return { success: false, error: 'Payment method not found' };
  } catch (error) {
    return { success: false, error };
  }
}

async function setOtherMethodsNotDefault(userId: string, exceptId: string) {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_METHODS),
      where('userId', '==', userId),
      where('isDefault', '==', true)
    );
    const snapshot = await getDocs(q);

    const updates = snapshot.docs
      .filter(doc => doc.data().id !== exceptId)
      .map(doc => updateDoc(doc.ref, { isDefault: false }));

    await Promise.all(updates);
  } catch (error) { }
}

export async function deletePaymentMethod(userId: string, methodId: string) {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_METHODS),
      where('userId', '==', userId),
      where('id', '==', methodId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { isActive: false });
      return { success: true };
    }

    return { success: false, error: 'Payment method not found' };
  } catch (error) {
    return { success: false, error };
  }
}

// ============= PAYMENT TRANSACTIONS =============

export async function createPaymentTransaction(
  data: Omit<PaymentTransaction, 'id' | 'createdAt'>
) {
  try {
    const transactionRef = doc(collection(db, COLLECTIONS.PAYMENT_TRANSACTIONS));
    const transaction: PaymentTransaction = {
      ...data,
      id: transactionRef.id,
      createdAt: new Date(),
    };

    await setDoc(transactionRef, {
      ...transaction,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdAt: serverTimestamp(),
    });

    return { success: true, transaction };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getPaymentTransactions(
  userId: string,
  limit?: number
): Promise<PaymentTransaction[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_TRANSACTIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    let transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        metadata: data.metadata ? JSON.parse(data.metadata) : null,
      } as PaymentTransaction;
    });

    if (limit) {
      transactions = transactions.slice(0, limit);
    }

    return transactions;
  } catch (error) {
    return [];
  }
}

export async function updatePaymentTransactionStatus(
  transactionCode: string,
  status: PaymentTransactionStatus,
  completedAt?: Date
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.PAYMENT_TRANSACTIONS),
      where('transactionCode', '==', transactionCode)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Transaction not found' };
    }

    const docRef = snapshot.docs[0].ref;
    const updateData: any = { status };
    if (completedAt) {
      updateData.completedAt = completedAt;
    }

    await updateDoc(docRef, updateData);

    // Nếu success và type là topup → cập nhật wallet
    const transaction = snapshot.docs[0].data() as PaymentTransaction;
    if (status === 'success' && transaction.type === 'topup') {
      const userRef = doc(db, 'users', transaction.userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentBalance = userDoc.data().walletBalance || 0;
        await updateDoc(userRef, {
          walletBalance: currentBalance + transaction.amount,
        });
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// ============= PAYMENT INTEGRATIONS =============

// VNPay
export async function createVNPayPayment(
  userId: string,
  amount: number,
  description: string
) {
  try {
    const transactionCode = `VNP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    const transaction = await createPaymentTransaction({
      userId,
      type: 'topup',
      amount,
      paymentMethod: 'vnpay',
      transactionCode,
      status: 'pending',
      description,
    });

    if (!transaction.success) {
      return transaction;
    }

    // TODO: Integrate with VNPay API
    // const vnpayUrl = await generateVNPayURL(transactionCode, amount);

    return {
      success: true,
      transactionCode,
      paymentUrl: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${transactionCode}`,
    };
  } catch (error) {
    return { success: false, error };
  }
}

// MoMo
export async function createMoMoPayment(
  userId: string,
  amount: number,
  description: string
) {
  try {
    const transactionCode = `MOMO${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    const transaction = await createPaymentTransaction({
      userId,
      type: 'topup',
      amount,
      paymentMethod: 'momo',
      transactionCode,
      status: 'pending',
      description,
    });

    if (!transaction.success) {
      return transaction;
    }

    // TODO: Integrate with MoMo API

    return {
      success: true,
      transactionCode,
      paymentUrl: `https://test-payment.momo.vn/pay/${transactionCode}`,
    };
  } catch (error) {
    return { success: false, error };
  }
}

// ZaloPay
export async function createZaloPayPayment(
  userId: string,
  amount: number,
  description: string
) {
  try {
    const transactionCode = `ZP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    const transaction = await createPaymentTransaction({
      userId,
      type: 'topup',
      amount,
      paymentMethod: 'zalopay',
      transactionCode,
      status: 'pending',
      description,
    });

    if (!transaction.success) {
      return transaction;
    }

    // TODO: Integrate with ZaloPay API

    return {
      success: true,
      transactionCode,
      paymentUrl: `https://sbgateway.zalopay.vn/pay/${transactionCode}`,
    };
  } catch (error) {
    return { success: false, error };
  }
}

// Auto Top-up (Nạp tự động khi balance < threshold)
export async function setupAutoTopup(
  userId: string,
  threshold: number,
  amount: number,
  paymentMethodId: string
) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      autoTopup: {
        enabled: true,
        threshold,
        amount,
        paymentMethodId,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function checkAndTriggerAutoTopup(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const autoTopup = userData.autoTopup;

    if (!autoTopup || !autoTopup.enabled) {
      return { success: false, error: 'Auto top-up not enabled' };
    }

    const currentBalance = userData.walletBalance || 0;

    if (currentBalance < autoTopup.threshold) {
      // Trigger top-up
      // TODO: Implement based on payment method
      return {
        success: true,
        triggered: true,
        amount: autoTopup.amount,
      };
    }

    return { success: true, triggered: false };
  } catch (error) {
    return { success: false, error };
  }
}

