import {
    GetDocumentInfoResponse,
    ProcessDataResponse,
    RagChatRequest,
    MeetingContext
} from '../types';

class APIController {
    private static instance: APIController;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): APIController {
        if (!APIController.instance) {
            APIController.instance = new APIController();
        }
        return APIController.instance;
    }

    public async processDocument(
        file: File,
        meeting_info: string,
        language?: string,
    ): Promise<ProcessDataResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('meeting_info', meeting_info);
        if (language) {
            formData.append('language', language);
        }


        // Always use /dummy for this endpoint as per new requirement
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/process-data`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
            }
            throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
        }


        return response.json() as Promise<ProcessDataResponse>;
    }

    public async getDocumentInfo(docId: string): Promise<GetDocumentInfoResponse> {
        // Assuming /get-document-info/dummy still exists and is useful for individual doc details
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/get-document-info${import.meta.env.MODE === "development" ? '/dummy' : ''}`;

        const response = await fetch(apiUrl, {
            method: 'POST', // Assuming POST, adjust if it's GET or other
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([docId]), // Assuming the API expects { "doc_id": "..." }
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
            }
            throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
        }

        return response.json() as Promise<GetDocumentInfoResponse>;
    }

    public async chatWithAI(
        query: string,
        sessionId: string,
        meetingContext?: MeetingContext,
        targetDocumentIds?: string[]
    ): Promise<ReadableStream<Uint8Array> | null> {
        const apiUrl = `https://team5chat.ap.loclx.io/api/v1/chat/rag/stream`;

        const requestBody: RagChatRequest = {
            query,
            session_id: sessionId,
            search_in_meeting_documents_only: false, // As per example, can be parameterized if needed
            target_document_ids: targetDocumentIds || [sessionId], // Default to the main document of the session
            meeting_context: meetingContext,
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream' // Important for streaming APIs like SSE
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                let errorData;
                let errorText = '';
                try {
                    errorText = await response.text();
                    errorData = JSON.parse(errorText);
                } catch {
                    // If parsing JSON fails, use the raw text or status text
                    throw new Error(errorText || response.statusText || `HTTP error! status: ${response.status}`);
                }
                throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null, cannot stream.');
            }

            return response.body; // Return the readable stream

        } catch (error) {
            console.error('Error in chatWithAI:', error);
            // Re-throw the error for the caller to handle
            // This allows UI components to display appropriate error messages
            throw error;
        }
    }
}

export default APIController.getInstance();
