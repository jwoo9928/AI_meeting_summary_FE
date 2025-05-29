import { GetDocumentInfoResponse, OriginFile, DocsInfo, ProcessDataResponse } from '../types'; // Removed FindDocsResponse, DocumentSummary, added ProcessDataResponse

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

    public async chatWithAI(prompt: string): Promise<string> {




    }
}

export default APIController.getInstance();
