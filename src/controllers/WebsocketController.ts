import { Document, KeyInsight, ProcessStep } from '../App'; // Import ProcessStep as well

// Define types for raw data received from WebSocket
type RawDocument = {
    title: string;
    type: string;
    score?: number; // Assuming score might be optional or named differently
    // Add other potential fields if known
};

type RawInsight = {
    insight: string; // Assuming 'insight' field based on App.tsx
    score: number;   // Assuming 'score' field based on App.tsx
    // Add other potential fields if known
};

// Type for the object structure of insights received in step 3
type RawInsightsObject = {
    [key: string]: RawInsight;
};

// ProcessStep type is now imported from App.tsx
/*
type ProcessStep = {
    id: number;
    title: string;
    status: 'pending' | 'processing' | 'completed';
};
*/

type UpdateCallbacks = {
    onOpen: () => void;
    onClose: (reason?: string) => void;
    onError: (error: Event) => void;
    onStepUpdate: (stepId: number, status: ProcessStep['status']) => void;
    onDocumentsReceived: (documents: Document[]) => void;
    onInsightsReceived: (insights: KeyInsight[]) => void;
    onHtmlReceived: (html: string) => void;
    onSetCurrentStep: (step: number) => void;
    // onSetPdfGenerating: (generating: boolean) => void; // REMOVED
    onSetAiHighlightMode: (enabled: boolean) => void;
    onStatusChange: (status: ConnectionStatus) => void; // Added status change callback
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'; // Added status type

class WebsocketController {
    private static instance: WebsocketController | null = null;
    private ws: WebSocket | null = null;
    private callbacks: UpdateCallbacks | null = null;
    private url: string = 'ws://localhost:8000/ws'; // Corrected WebSocket endpoint for FastAPI
    private connectionStatus: ConnectionStatus = 'disconnected';

    private constructor() { }

    public static getInstance(): WebsocketController {
        if (!WebsocketController.instance) {
            WebsocketController.instance = new WebsocketController();
        }
        return WebsocketController.instance;
    }

    private updateStatus(newStatus: ConnectionStatus): void {
        if (this.connectionStatus !== newStatus) {
            this.connectionStatus = newStatus;
            console.log(`WebSocket status changed to: ${newStatus}`);
            this.callbacks?.onStatusChange(newStatus);
        }
    }

    public connect(callbacks: UpdateCallbacks): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected.');
            this.updateStatus('connected'); // Ensure status is correct if already connected
            // If re-connecting with potentially new callbacks, assign them
            this.callbacks = callbacks;
            // Optionally trigger onOpen again if needed for UI updates
            this.callbacks?.onOpen();
            return;
        }

        console.log('Attempting to connect WebSocket...');
        this.updateStatus('connecting'); // Set status to connecting
        this.callbacks = callbacks;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('WebSocket Connected to', this.url);
            this.updateStatus('connected');
            // App.tsx's onOpen callback will now handle sending initial data
            this.callbacks?.onOpen();
        };

        this.ws.onmessage = (event) => {
            const message = event.data;
            console.log('WebSocket Message Received:', message);
            this.handleMessage(message);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            this.updateStatus('error'); // Set status to error
            this.callbacks?.onError(error);
            // Consider if disconnect() should be called here or if onclose handles it
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket Disconnected:', event.reason);
            // Only set to 'disconnected' if not already in 'error' state
            if (this.connectionStatus !== 'error') {
                this.updateStatus('disconnected');
            }
            this.callbacks?.onClose(event.reason);
            this.ws = null; // Clear the reference
            this.callbacks = null; // Clear callbacks
        };
    }

    public disconnect(): void {
        if (this.ws) {
            console.log('Closing WebSocket connection...');
            this.ws.onclose = null; // Prevent onClose callback during manual disconnect
            this.ws.close();
            this.ws = null;
            this.callbacks = null; // Clear callbacks on disconnect
            this.updateStatus('disconnected'); // Set status on manual disconnect
        } else {
            // If already disconnected, ensure status reflects it
            this.updateStatus('disconnected');
        }
    }

    // --- NEW METHOD ---
    /**
     * Sends metadata (as JSON string) and then audio data (Blob) over the WebSocket.
     * @param metadata An object containing meeting information.
     * @param audioData The audio data Blob.
     * @returns True if both metadata and audio data were sent successfully, false otherwise.
     */
    public async sendMeetingData(metadata: object, audioData: Blob): Promise<boolean> {
        if (!this.isConnected() || !this.ws) {
            console.warn('Cannot send meeting data: WebSocket is not connected.');
            return false;
        }

        try {
            // 1. Send metadata as JSON string
            console.log('[WebsocketController] Preparing metadata:', metadata); // Log the object itself
            const metadataStr = JSON.stringify(metadata);
            console.log('[WebsocketController] Sending metadata string:', metadataStr);
            this.ws.send(metadataStr);
            console.log('[WebsocketController] Metadata sent successfully.');

            // Optional: Wait for a brief moment or an ack if server sends one, though not typical for this step.
            // await new Promise(resolve => setTimeout(resolve, 100)); 

            // 2. Send audio data
            console.log('[WebsocketController] Sending audio data:', audioData);
            this.ws.send(audioData);
            console.log('[WebsocketController] Audio data sent successfully.');

            // Visually start the first step after sending data
            if (this.callbacks) {
                this.callbacks.onStepUpdate(1, 'processing');
                this.callbacks.onSetCurrentStep(1);
            }
            return true;

        } catch (error) {
            console.error('Error sending meeting data:', error);
            this.updateStatus('error');
            if (this.callbacks) {
                // Ensure error is an Event instance
                const errorEvent = error instanceof Event ? error : new ErrorEvent('senderror', { error });
                this.callbacks.onError(errorEvent);
            }
            return false;
        }
    }

    private handleMessage(message: string): void {
        if (!this.callbacks) return;
        console.log("Handling WebSocket message:", message);

        // Check for initial error message from server if metadata was missing
        if (message.startsWith("오류: meeting_info가 메타데이터에 제공되지 않았습니다.")) {
            console.error("Server error due to missing meeting_info:", message);
            this.updateStatus('error');
            if (this.callbacks) {
                this.callbacks.onError(new ErrorEvent('servererror', { message }));
            }
            this.disconnect(); // Close connection as server intends to
            return;
        }

        // Check for other generic error messages from server
        if (message.toLowerCase().startsWith("error:") || message.startsWith("오류:") || message.startsWith("처리 중 오류 발생:")) {
            console.error("Received error message from server:", message);
            this.updateStatus('error');
            if (this.callbacks) {
                // Pass a generic error event, the message itself is the detail
                this.callbacks.onError(new ErrorEvent('servererror', { message }));
            }
            // Optionally disconnect if server errors are usually fatal
            // this.disconnect(); 
            return;
        }


        // Proceed with normal message handling if no initial error
        try {
            // Updated logic to handle messages starting with step numbers directly
            if (message.startsWith("1단계 완료")) {
                console.log("Step 1 (Whisper) Completed");
                this.callbacks.onStepUpdate(1, 'completed');
                this.callbacks.onStepUpdate(2, 'processing');
                this.callbacks.onSetCurrentStep(2);
                const step1Data = message.substring("1단계 완료: ".length);
                console.log("Step 1 (Whisper) Result:", step1Data);

            } else if (message.startsWith("2단계 완료:")) {
                this.callbacks.onStepUpdate(2, 'completed');
                this.callbacks.onStepUpdate(3, 'processing');
                this.callbacks.onSetCurrentStep(3);
                const jsonDataString = message.substring("2단계 완료: ".length);
                const step2Data: RawDocument[] = JSON.parse(jsonDataString);
                console.log("Step 2 (Document Extraction) Data:", step2Data);
                const documentsWithIds: Document[] = step2Data.map((doc: RawDocument, index: number): Document => ({
                    id: `doc-${Date.now()}-${index}`,
                    title: doc.title,
                    type: doc.type,
                    score: doc.score,
                }));
                this.callbacks.onDocumentsReceived(documentsWithIds);

            } else if (message.startsWith("3단계 완료:")) {
                this.callbacks.onStepUpdate(3, 'completed');
                this.callbacks.onStepUpdate(4, 'processing');
                this.callbacks.onSetCurrentStep(4);
                const jsonDataString = message.substring("3단계 완료: ".length);
                const step3Data: RawInsightsObject = JSON.parse(jsonDataString); // Use RawInsightsObject
                console.log("Step 3 (Key Insights) Data:", step3Data);
                // Iterate over the values of the object
                const insightsWithIds: KeyInsight[] = Object.values(step3Data).map((insight: RawInsight, index: number): KeyInsight => ({
                    id: `insight-${Date.now()}-${index}`,
                    insight: insight.insight,
                    score: insight.score,
                }));
                this.callbacks.onInsightsReceived(insightsWithIds);

            } else if (message.startsWith("4단계 완료:")) {
                this.callbacks.onStepUpdate(4, 'completed');
                this.callbacks.onStepUpdate(5, 'processing');
                this.callbacks.onSetCurrentStep(5);
                const htmlContent = message.substring("4단계 완료: ".length);
                console.log("Step 4 (HTML Report) Received, starting Step 5 (Display)");
                this.callbacks.onHtmlReceived(htmlContent);
                this.callbacks.onSetAiHighlightMode(true);
                // HTML 설정 후 바로 5단계 완료 처리
                this.callbacks.onStepUpdate(5, 'completed');
                console.log("Step 5 (Display) Completed");
            } else {
                console.warn("Received unhandled WebSocket message:", message);
            }
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
            this.updateStatus('error');
            this.callbacks?.onError(new ErrorEvent('messageerror', { error }));
        }
    }

    public isConnected(): boolean {
        // Check readyState directly for connection status
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    // Added getter for connection status
    public getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }
}

export default WebsocketController.getInstance(); // Export the singleton instance
