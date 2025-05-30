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
    doc_name: string;
    doc_id: string;
};

export type OriginFile = {
    file_name: string;
    file_size: string;
    file_type: string;
    doc_id: string;
    text: string
};

export type DocumentSummary = {
    summary: string;
    action_items: string[];
};

// For the response from the /process/find_docs API
export interface FindDocsResponse {
    docs_info: DocsInfo[];
}

// For the combined response from the new /process-data/dummy API
export interface ProcessDataResponse {
    docs_info: DocsInfo[];
    summary: string;
    action_items: string;
    report_link: string,
    report_doc_Id: string;
    origin_file: OriginFile;
}

// For the RAG chat API
export interface MeetingContext {
    hub_meeting_id: string;
    hub_meeting_title: string;
    hub_participant_names: string[];
    hub_minutes_s3_url: string;
}

export interface RagChatRequest {
    query: string;
    session_id: string;
    search_in_meeting_documents_only: boolean;
    target_document_ids: string[];
    meeting_context?: MeetingContext;
}

// For storing the parsed meeting_info JSON string
export interface ParsedMeetingInfo {
    hub_meeting_id: string;
    hub_participant_names: string[];
    // Add other fields from meeting_info if they exist and are needed
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    content: string; // Content will always be a string, accumulated
    reasoning?: string; // Optional reasoning for AI messages
    isStreaming?: boolean;
}
