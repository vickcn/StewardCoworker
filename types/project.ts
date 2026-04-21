export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ProjectMemberInfo {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: ProjectRole;
  joinedAt: string;
}

export interface ProjectIntegrationData {
  id: string;
  spreadsheetId: string | null;
  sheetName: string | null;
  driveFolderId: string | null;
}

export interface PublicShareSettings {
  id: string;
  shareToken: string;
  isEnabled: boolean;
  allowClaim: boolean;
  allowComment: boolean;
  allowRecommendation: boolean;
  allowReceiptUpload: boolean;
  visibleFields: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  myRole?: ProjectRole;
}

export interface ProjectDetail extends Project {
  members: ProjectMemberInfo[];
  integration: ProjectIntegrationData | null;
  publicShare: PublicShareSettings | null;
}
