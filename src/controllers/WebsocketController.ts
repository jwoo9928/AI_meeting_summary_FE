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
    private url: string = 'ws://localhost:8000/ws/dummy'; // Updated URL based on server code
    private connectionStatus: ConnectionStatus = 'disconnected'; // Added status state

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
            console.log('WebSocket Connected');
            this.updateStatus('connected'); // Set status to connected
            this.callbacks?.onOpen();
            // Don't start the first step visually here, wait for audio data
            // this.callbacks?.onStepUpdate(1, 'processing');
            // this.callbacks?.onSetCurrentStep(1);
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
     * Sends audio data (Blob or ArrayBuffer) over the WebSocket connection.
     * @param audioData The audio data to send.
     * @returns True if the data was sent, false otherwise (e.g., not connected).
     */
    public sendAudioData(audioData: Blob): boolean {
        if (this.isConnected() && this.ws) {
            console.log('Sending audio data...');
            try {
                this.ws.send(audioData);
                console.log('Audio data sent successfully.');
                // Visually start the first step after sending data
                if (this.callbacks) {
                    this.callbacks.onStepUpdate(1, 'processing');
                    this.callbacks.onSetCurrentStep(1);
                }
                return true;
            } catch (error) {
                console.error('Error sending audio data:', error);
                this.updateStatus('error');
                this.callbacks?.onError(new ErrorEvent('senderror', { error }));
                return false;
            }
        } else {
            console.warn('Cannot send audio data: WebSocket is not connected.');
            return false;
        }
    }
    // --- END NEW METHOD ---


    private handleMessage(message: string): void {
        if (!this.callbacks) return;
        console.log("Handling WebSocket message:", message);
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
