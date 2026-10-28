/**
 * Veryfi AI API Contracts and Client Interface
 * 
 * This contract defines the clean interface between the Veryfi AI frontend
 * and future backend services (AI auditing, guidelines management, asset sync, analytics).
 */

import { AuditItem, BrandTemplate, GuidelineCategory, WorkspaceSettings } from '../types';

export interface AuditSubmissionPayload {
  file: File | Blob;
  fileName: string;
  contentType: string;
  brandId?: string;
  guidelineIds?: string[];
  notes?: string;
}

export interface AuditSubmissionResponse {
  auditId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedDurationMs?: number;
}

export interface VeryfiApiClient {
  /** Check backend health and readiness */
  getHealthStatus(): Promise<{ connected: boolean; version?: string; aiEngineReady: boolean }>;
  
  /** Submit new content for AI brand compliance audit */
  submitAudit(payload: AuditSubmissionPayload): Promise<AuditSubmissionResponse>;
  
  /** Fetch audit details by ID */
  getAuditById(id: string): Promise<AuditItem | null>;
  
  /** Fetch audit history with optional filters */
  listAudits(params?: { type?: string; timeRange?: string; search?: string; page?: number }): Promise<{
    items: AuditItem[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  
  /** Retrieve guideline categories and rules */
  getGuidelines(): Promise<GuidelineCategory[]>;
  
  /** Update a specific guideline rule */
  updateGuideline(categoryId: string, data: Partial<GuidelineCategory>): Promise<GuidelineCategory>;
  
  /** Fetch brand assets */
  getBrandAssets(): Promise<{
    logos: { id: string; name: string; url: string; type: string }[];
    templates: BrandTemplate[];
    storageUsedBytes: number;
    storageLimitBytes: number;
  }>;
  
  /** Fetch analytics metrics */
  getAnalytics(dateRange?: string): Promise<{
    hasData: boolean;
    totalAudits: number | null;
    approved: number | null;
    needsFix: number | null;
    rejected: number | null;
    complianceTrends: { date: string; score: number }[];
    issueDistribution: { category: string; count: number; color: string }[];
  }>;
  
  /** Update workspace configuration */
  updateSettings(settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings>;
}

/**
 * Offline / Disconnected Client Implementation
 * Ensures frontend is resilient and fully functional before backend is wired up.
 */
export const isBackendConnected = false;

