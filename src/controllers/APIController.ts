import { ProcessDataResponse, GetDocumentInfoResponse } from '../types';

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

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/process-data${import.meta.env.MODE === "development" ? '/dummy' : ''}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch { // Removed unused 'e' variable
                // If response is not JSON, use status text
                throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
            }
            throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
        }

        return response.json() as Promise<ProcessDataResponse>;
    }

    public async getDocumentInfo(docId: string): Promise<GetDocumentInfoResponse> {
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
}

export default APIController.getInstance();
