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
        is_dumy: boolean = true // Default to true for dummy endpoint
    ): Promise<ProcessDataResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('meeting_info', meeting_info);
        if (language) {
            formData.append('language', language);
        }
        // The backend expects is_dumy as a boolean form field.
        // FormData converts booleans to strings "true"/"false".
        // If the backend strictly expects a boolean, this might need adjustment or backend change.
        // For now, assuming string "true" or "false" is acceptable by FastAPI for Form(bool).
        formData.append('is_dumy', String(is_dumy));


        // Always use /dummy for this endpoint as per new requirement
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/process-data/dummy`;

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

        // The backend /dummy endpoint already provides the dummy response with a 5s delay.
        // So, no need for frontend mock if calling the actual dummy endpoint.
        // If VITE_API_BASE_URL is not set or we want a pure frontend mock for some reason:
        if (import.meta.env.MODE === "development" && !import.meta.env.VITE_API_BASE_URL) { // Example condition for pure FE mock
            console.warn("APIController: Using pure frontend dummy data for /process-data/dummy because VITE_API_BASE_URL might not be set.");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate 5s delay
            return {
                docs_info: [{ "file": "문서1.pdf", "ids": "dummy_id1_fe" }, { "file": "문서2.pdf", "ids": "dummy_id2_fe" }],
                summary: "프론트엔드 더미 요약",
                action_items: ["프론트엔드 더미 작업 항목 1", "프론트엔드 더미 작업 항목 2"],
                origin_file: {
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type || "unknown",
                    link: URL.createObjectURL(file),
                    text: `This is a dummy text content for the file ${file.name}. It could be a snippet or the full text if available and appropriate to send. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
                }
            };
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
        const apiUrl = `${import.meta.env.VITE_AI_CHAT_API_URL}/api/v1/chat/rag/stream`;



    }
}

export default APIController.getInstance();
