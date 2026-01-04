// Firebase Admin Advanced Features
import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Campaign,
  SystemSetting,
  Incident,
  AutoReport,
  AdminRoleConfig,
  InventoryAlert,
  InventoryTransfer,
  BulkOperation,
  SystemSettings,
} from '@/lib/types';

const COLLECTIONS = {
  CAMPAIGNS: 'campaigns',
  SYSTEM_SETTINGS: 'systemSettings',
  INCIDENTS: 'incidents',
  AUTO_REPORTS: 'autoReports',
  ADMIN_ROLES: 'adminRoles',
  INVENTORY_TRANSFERS: 'inventoryTransfers',
  BULK_OPERATIONS: 'bulkOperations',
};

// ============= CAMPAIGNS =============

export async function createCampaign(data: Omit<Campaign, 'campaignId' | 'createdAt'>) {
  try {
    const campaignRef = doc(collection(db, COLLECTIONS.CAMPAIGNS));
    const campaign: Campaign = {
      ...data,
      campaignId: campaignRef.id,
      createdAt: new Date(),
    };

    await setDoc(campaignRef, {
      ...campaign,
      rewardValue: JSON.stringify(campaign.rewardValue),
      createdAt: serverTimestamp(),
    });

    return { success: true, campaignId: campaign.campaignId };
  } catch (error) {    return { success: false, error };
  }
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  try {
    const now = new Date();
    const q = query(
      collection(db, COLLECTIONS.CAMPAIGNS),
      where('isActive', '==', true),
      where('endDate', '>', now),
      orderBy('endDate', 'asc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        rewardValue: typeof data.rewardValue === 'string'
          ? JSON.parse(data.rewardValue)
          : data.rewardValue,
      } as Campaign;
    });
  } catch (error) {    return [];
  }
}

export async function updateCampaign(campaignId: string, data: Partial<Campaign>) {
  try {
    const docRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);
    const updateData = { ...data };
    
    if (data.rewardValue) {
      updateData.rewardValue = JSON.stringify(data.rewardValue) as any;
    }

    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {    return { success: false, error };
  }
}

export async function deactivateCampaign(campaignId: string) {
  try {
    const docRef = doc(db, COLLECTIONS.CAMPAIGNS, campaignId);
    await updateDoc(docRef, { isActive: false });
    return { success: true };
  } catch (error) {    return { success: false, error };
  }
}

// ============= SYSTEM SETTINGS =============

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.SYSTEM_SETTINGS));
    const settings: any = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data() as SystemSetting;
      let value = data.value;

      // Parse value based on dataType
      switch (data.dataType) {
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          value = JSON.parse(value);
          break;
      }

      settings[data.key] = value;
    });

    // Default settings if not exist
    return {
      depositAmount: settings.depositAmount || 20000,
      returnTimeLimit: settings.returnTimeLimit || 24,
      penaltyPerHour: settings.penaltyPerHour || 5000,
      maxOverdueHours: settings.maxOverdueHours || 72,
      pointsForReturn: settings.pointsForReturn || 50,
      pointsForLateReturn: settings.pointsForLateReturn || 20,
      pointsForCheckin: settings.pointsForCheckin || 10,
      pointsForGreenFeed: settings.pointsForGreenFeed || 30,
      rankThresholds: settings.rankThresholds || {
        seed: 0,
        sprout: 100,
        sapling: 500,
        tree: 1000,
        forest: 5000,
      },
      enableChatAI: settings.enableChatAI !== undefined ? settings.enableChatAI : true,
      enableGreenFeed: settings.enableGreenFeed !== undefined ? settings.enableGreenFeed : true,
      enableFriends: settings.enableFriends !== undefined ? settings.enableFriends : true,
      enableChallenges: settings.enableChallenges !== undefined ? settings.enableChallenges : true,
      enableRewardsStore: settings.enableRewardsStore !== undefined ? settings.enableRewardsStore : true,
      maintenanceMode: settings.maintenanceMode || false,
    };
  } catch (error) {    throw error;
  }
}

export async function updateSystemSetting(
  key: string,
  value: any,
  dataType: SystemSetting['dataType'],
  category: SystemSetting['category'],
  adminId?: string
) {
  try {
    const settingRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, key);
    
    const setting: Omit<SystemSetting, 'id'> = {
      key,
      value: dataType === 'json' ? JSON.stringify(value) : String(value),
      dataType,
      category,
      updatedAt: new Date(),
      updatedBy: adminId,
    };

    await setDoc(settingRef, {
      ...setting,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error) {    return { success: false, error };
  }
}

// ============= INCIDENTS =============

export async function createIncident(data: Omit<Incident, 'incidentId' | 'createdAt' | 'updatedAt'>) {
  try {
    const incidentRef = doc(collection(db, COLLECTIONS.INCIDENTS));
    const incident: Incident = {
      ...data,
      incidentId: incidentRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(incidentRef, {
      ...incident,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, incidentId: incident.incidentId };
  } catch (error) {    return { success: false, error };
  }
}

export async function getIncidents(status?: Incident['status']): Promise<Incident[]> {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, COLLECTIONS.INCIDENTS),
        where('status', '==', status),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.INCIDENTS),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Incident);
  } catch (error) {    return [];
  }
}

export async function updateIncident(
  incidentId: string,
  data: Partial<Incident>,
  adminId?: string
) {
  try {
    const docRef = doc(db, COLLECTIONS.INCIDENTS, incidentId);
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (adminId && !data.assignedTo) {
      updateData.assignedTo = adminId;
    }

    if (data.status === 'resolved' || data.status === 'closed') {
      updateData.resolvedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {    return { success: false, error };
  }
}

// ============= AUTO REPORTS =============

export async function setupAutoReport(data: Omit<AutoReport, 'reportId' | 'createdAt'>) {
  try {
    const reportRef = doc(collection(db, COLLECTIONS.AUTO_REPORTS));
    const report: AutoReport = {
      ...data,
      reportId: reportRef.id,
      createdAt: new Date(),
    };

    await setDoc(reportRef, {
      ...report,
      recipients: JSON.stringify(report.recipients),
      config: report.config ? JSON.stringify(report.config) : null,
      createdAt: serverTimestamp(),
    });

    return { success: true, reportId: report.reportId };
  } catch (error) {    return { success: false, error };
  }
}

export async function getAutoReports(): Promise<AutoReport[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.AUTO_REPORTS),
      where('isActive', '==', true),
      orderBy('nextSend', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        recipients: JSON.parse(data.recipients),
        config: data.config ? JSON.parse(data.config) : null,
      } as AutoReport;
    });
  } catch (error) {    return [];
  }
}

// ============= ADMIN ROLES & PERMISSIONS =============

export async function createAdminRole(data: Omit<AdminRoleConfig, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const roleRef = doc(collection(db, COLLECTIONS.ADMIN_ROLES));
    const role: AdminRoleConfig = {
      ...data,
      id: roleRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(roleRef, {
      ...data,
      id: roleRef.id,
      permissions: JSON.stringify(data.permissions),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, roleId: role.id };
  } catch (error) {    return { success: false, error };
  }
}

export async function getAdminRoles(): Promise<AdminRoleConfig[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.ADMIN_ROLES));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        permissions: JSON.parse(data.permissions || '[]'),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as AdminRoleConfig;
    });
  } catch (error) {    return [];
  }
}

// ============= INVENTORY MANAGEMENT =============

export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
  try {
    const stores = await getDocs(collection(db, 'stores'));
    const alerts: InventoryAlert[] = [];

    stores.docs.forEach(doc => {
      const store = doc.data();
      const available = store.cupAvailable || 0;
      const total = store.cupTotal || 0;

      // Low stock
      if (available < 10) {
        alerts.push({
          storeId: store.storeId,
          storeName: store.name,
          alertType: 'low_stock',
          currentStock: available,
          recommendedAction: `Điều chuyển thêm ${20 - available} ly từ kho khác`,
          priority: available < 5 ? 'high' : 'medium',
        });
      }

      // Overstock
      if (available > total * 0.8 && total > 50) {
        alerts.push({
          storeId: store.storeId,
          storeName: store.name,
          alertType: 'overstock',
          currentStock: available,
          recommendedAction: `Điều chuyển ${available - Math.floor(total * 0.6)} ly sang kho khác`,
          priority: 'low',
        });
      }
    });

    return alerts;
  } catch (error) {    return [];
  }
}

export async function createInventoryTransfer(
  data: Omit<InventoryTransfer, 'transferId' | 'createdAt'>
) {
  try {
    const transferRef = doc(collection(db, COLLECTIONS.INVENTORY_TRANSFERS));
    const transfer: InventoryTransfer = {
      ...data,
      transferId: transferRef.id,
      createdAt: new Date(),
    };

    await setDoc(transferRef, {
      ...transfer,
      createdAt: serverTimestamp(),
    });

    return { success: true, transferId: transfer.transferId };
  } catch (error) {    return { success: false, error };
  }
}

export async function updateInventoryTransfer(
  transferId: string,
  status: InventoryTransfer['status']
) {
  try {
    const q = query(
      collection(db, COLLECTIONS.INVENTORY_TRANSFERS),
      where('transferId', '==', transferId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Transfer not found' };
    }

    const docRef = snapshot.docs[0].ref;
    const transfer = snapshot.docs[0].data() as InventoryTransfer;
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completedAt = serverTimestamp();

      // Update store inventories
      const fromStoreRef = doc(db, 'stores', transfer.fromStoreId);
      const toStoreRef = doc(db, 'stores', transfer.toStoreId);

      const [fromStoreDoc, toStoreDoc] = await Promise.all([
        getDoc(fromStoreRef),
        getDoc(toStoreRef),
      ]);

      if (fromStoreDoc.exists() && toStoreDoc.exists()) {
        const fromStore = fromStoreDoc.data();
        const toStore = toStoreDoc.data();

        await Promise.all([
          updateDoc(fromStoreRef, {
            cupAvailable: (fromStore.cupAvailable || 0) - transfer.cupCount,
            cupTotal: (fromStore.cupTotal || 0) - transfer.cupCount,
          }),
          updateDoc(toStoreRef, {
            cupAvailable: (toStore.cupAvailable || 0) + transfer.cupCount,
            cupTotal: (toStore.cupTotal || 0) + transfer.cupCount,
          }),
        ]);
      }
    }

    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {    return { success: false, error };
  }
}

// ============= BULK OPERATIONS =============

export async function createBulkOperation(
  data: Omit<BulkOperation, 'operationId' | 'createdAt' | 'successCount' | 'failCount'>
) {
  try {
    const operationRef = doc(collection(db, COLLECTIONS.BULK_OPERATIONS));
    const operation: BulkOperation = {
      ...data,
      operationId: operationRef.id,
      successCount: 0,
      failCount: 0,
      createdAt: new Date(),
    };

    await setDoc(operationRef, {
      ...operation,
      result: operation.result ? JSON.stringify(operation.result) : null,
      createdAt: serverTimestamp(),
    });

    return { success: true, operationId: operation.operationId };
  } catch (error) {    return { success: false, error };
  }
}

export async function updateBulkOperation(
  operationId: string,
  updates: Partial<BulkOperation>
) {
  try {
    const docRef = doc(db, COLLECTIONS.BULK_OPERATIONS, operationId);
    const updateData = { ...updates };

    if (updates.result) {
      updateData.result = JSON.stringify(updates.result) as any;
    }

    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completedAt = serverTimestamp() as any;
    }

    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {    return { success: false, error };
  }
}

// ============= QR CODE GENERATION (BULK) =============

export async function generateBulkQRCodes(count: number, material: 'pp_plastic' | 'bamboo_fiber') {
  try {
    const operationId = `QR_${Date.now()}`;
    let successCount = 0;
    let failCount = 0;
    const cupIds: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Generate 8-digit ID
        const cupId = Math.floor(10000000 + Math.random() * 90000000).toString();
        
        // Create cup document
        const cupRef = doc(db, 'cups', cupId);
        await setDoc(cupRef, {
          cupId,
          material,
          status: 'available',
          createdAt: serverTimestamp(),
          totalUses: 0,
        });

        cupIds.push(cupId);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    return {
      success: true,
      successCount,
      failCount,
      cupIds,
    };
  } catch (error) {    return { success: false, error };
  }
}

