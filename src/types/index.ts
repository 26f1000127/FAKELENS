export type AuditStatus = 'Approved' | 'Needs Fix' | 'Rejected' | 'Pending';

export type ContentType = 'Ad Design' | 'Marketing Copy' | 'Guideline' | 'Design' | 'Banner' | 'Video' | 'PDF';

export interface AuditIssue {
  id: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface AuditFix {
  id: string;
  type: 'typography' | 'claim' | 'color' | 'layout';
  title: string;
  description: string;
  applied?: boolean;
}

export interface RuleCheckItem {
  id: string;
  name: string;
  status: 'Passed' | 'Warning' | 'Failed';
  details?: string;
}

export interface AuditItem {
  id: string;
  title: string;
  type: ContentType;
  date: string;
  relativeTime: string;
  status: AuditStatus;
  complianceScore: number;
  complianceStatus: 'On Brand' | 'Needs Review' | 'Off Brand';
  thumbnailUrl?: string;
  summaryText: string;
  issues: AuditIssue[];
  suggestedFixes: AuditFix[];
  checklist: RuleCheckItem[];
}

export interface BrandColor {
  name: string;
  hex: string;
  role: string;
}

export interface TypographySpec {
  fontFamily: string;
  weight: string;
  usage: string;
}

export interface BrandTemplate {
  id: string;
  title: string;
  category: string;
  previewUrl: string;
  dimensions?: string;
}

export interface GuidelineCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  attributes?: string[];
  dos: string[];
  donts: string[];
  examples: {
    onBrand: string;
    offBrand: string;
  };
}

export interface WorkspaceSettings {
  workspaceName: string;
  industry: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  brandFont: string;
  rules: {
    brandConsistency: boolean;
    factChecking: boolean;
    claimsCompliance: boolean;
    accessibility: boolean;
  };
}

