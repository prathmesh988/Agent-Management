"use server";

import { Query, ID } from "node-appwrite";
import { createDatabasesWithAuth, DB_CONFIG } from "@/services/database/client";

export interface IncentiveRecord {
  $id?: string;
  employeeId: string;
  month?: string;
  incentiveAmount?: number;
  performanceBonus?: number;
  referralBonus?: number;
  festivalBonus?: number;
  retentionBonus?: number;
  totalIncentive?: number;
  [key: string]: any;
}

export async function getIncentiveByEmployeeIdAction(employeeId: string): Promise<IncentiveRecord | null> {
  try {
    const databases = createDatabasesWithAuth();
    const response = await databases.listDocuments(
      DB_CONFIG.DATABASE_ID,
      DB_CONFIG.INCENTIVE_COLLECTION_ID,
      [
        Query.equal("employeeId", employeeId),
        Query.limit(1)
      ]
    );

    if (response.documents.length > 0) {
      return JSON.parse(JSON.stringify(response.documents[0]));
    }
    return null;
  } catch (error) {
    console.error("Error fetching incentive:", error);
    return null;
  }
}

export async function saveIncentiveAction(employeeId: string, incentiveData: Partial<IncentiveRecord>): Promise<IncentiveRecord> {
  try {
    const databases = createDatabasesWithAuth();
    
    // Check if one already exists
    const existing = await getIncentiveByEmployeeIdAction(employeeId);
    
    // Build update object based on what was provided and defined
    const dbData: Record<string, any> = {
      employeeId,
      month: incentiveData.month ?? new Date().toISOString().slice(0, 7) // Default to current month YYYY-MM
    };
    
    // Explicitly check for undefined so we can store 0
    if (incentiveData.incentiveAmount !== undefined) dbData.incentiveAmount = incentiveData.incentiveAmount;
    if (incentiveData.performanceBonus !== undefined) dbData.performanceBonus = incentiveData.performanceBonus;
    if (incentiveData.referralBonus !== undefined) dbData.referralBonus = incentiveData.referralBonus;
    if (incentiveData.festivalBonus !== undefined) dbData.festivalBonus = incentiveData.festivalBonus;
    if (incentiveData.retentionBonus !== undefined) dbData.retentionBonus = incentiveData.retentionBonus;
    if (incentiveData.totalIncentive !== undefined) dbData.totalIncentive = incentiveData.totalIncentive;

    if (existing && existing.$id) {
      const response = await databases.updateDocument(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.INCENTIVE_COLLECTION_ID,
        existing.$id,
        dbData
      );
      return JSON.parse(JSON.stringify(response));
    } else {
      const response = await databases.createDocument(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.INCENTIVE_COLLECTION_ID,
        ID.unique(),
        dbData
      );
      return JSON.parse(JSON.stringify(response));
    }
  } catch (error) {
    console.error("Error saving incentive:", error);
    throw error;
  }
}
