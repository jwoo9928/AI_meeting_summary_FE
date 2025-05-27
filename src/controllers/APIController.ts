import { GetDocumentInfoResponse, OriginFile, FindDocsResponse, DocumentSummary, DocsInfo } from '../types';

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

    // New method for /process/origin
    public async processOrigin(file: File, meeting_info: string, language?: string): Promise<OriginFile> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('meeting_info', meeting_info);
        if (language) {
            formData.append('language', language);
        }
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/process/origin${import.meta.env.MODE === "development" ? '/dummy' : ''}`;

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
        // Mocked response for development if /dummy is used
        if (import.meta.env.MODE === "development" && apiUrl.endsWith("/dummy")) {
            console.log("APIController: Using dummy data for /process/origin");
            return {
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                link: `/dummy/${file.name}`
            } as OriginFile;
        }
        return response.json() as Promise<OriginFile>;
    }

    // New method for /process/find_docs
    public async findDocs(origin_file: OriginFile): Promise<FindDocsResponse> {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/process/find_docs${import.meta.env.MODE === "development" ? '/dummy' : ''}`;
        const body = {
            origin_file
        };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
        // Mocked response for development if /dummy is used
        return response.json() as Promise<FindDocsResponse>;
    }

    // New method for /process/summary
    public async getSummary(origin_file: OriginFile, meeting_info: string, language?: string): Promise<DocumentSummary> {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/process/summary${import.meta.env.MODE === "development" ? '/dummy' : ''}`;
        const body = {
            origin_file,
            meeting_info,
            language,
        };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
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
        return response.json() as Promise<DocumentSummary>;
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
