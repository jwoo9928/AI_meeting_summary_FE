// src/types.ts

// For PDF documents received from WebSocket, to be displayed in RightSidebar
export interface DocumentSource {
    id: string;
    title: string;
    type?: string; // e.g., 'pdf', 'txt'
    summary?: string; // To store the summary text for the document
    isChecked?: boolean; // For UI selection state, managed in App.tsx
    // Add other relevant fields like score, content snippet, etc. if available
}

// For "Studio" items in LeftSidebar
export interface StudioItemData {
    id: string;
    name: string;
    currentStep?: number; // e.g., 3 (for 3 out of 5 steps done)
    totalSteps?: number;  // e.g., 5
    // lastModified?: string;
    // other studio-specific metadata
}

// You can add other shared types here as the project grows.

// For individual document info from the /process-data API
export interface DocInfo {
    file: string;
    ids: string;
}

// For the response from the /get-document-info API
export interface DocumentDetail {
    summary: string;
    deep_summary: string;
    // Add other fields if the API returns more details for a single document
}

export interface GetDocumentInfoResponse {
    [docId: string]: DocumentDetail;
}

export type DocsInfo = {
    file: string;
    ids: string;
};

export type OriginFile = {
    file_name: string;
    file_size: number;   // in bytes
    file_type: string;   // e.g., 'pdf'
    link: string;        // download link
};

export type DocumentSummary = {
    summary: string;
    action_items: string[];
};

// For the response from the /process/find_docs API
export interface FindDocsResponse {
    docs_info: DocsInfo[];
}
