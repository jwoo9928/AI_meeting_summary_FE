
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import React, { useRef, useState, useEffect } from "react"; // Added React and useEffect
import { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea } from "../ui/prompt-input";

interface PromptInputWithActionsProps {
    onSend: (text: string, files?: File[]) => void; // Allow sending files too
    disabled?: boolean;
}

export function PromptInputWithActions({ onSend, disabled }: PromptInputWithActionsProps) {
    const [input, setInput] = useState("");
    const [isLoadingInternal, setIsLoadingInternal] = useState(false); // Renamed to avoid conflict
    const [files, setFiles] = useState<File[]>([]);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (disabled !== undefined) {
            setIsLoadingInternal(disabled);
        }
    }, [disabled]);

    const handleSubmit = () => {
        if (input.trim() || files.length > 0) {
            if (!disabled) { // Only proceed if not externally disabled
                onSend(input, files); // Call the passed onSend prop
                setInput(""); // Clear input after sending
                setFiles([]); // Clear files after sending
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files)
            setFiles((prev) => [...prev, ...newFiles])
        }
    }

    const handleRemoveFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
        if (uploadInputRef?.current) {
            uploadInputRef.current.value = ""
        }
    }

    return (
        <PromptInput
            value={input}
            onValueChange={setInput}
            isLoading={isLoadingInternal} // Use internal loading state
            onSubmit={handleSubmit}
            className="w-full" // Removed max-w for flexibility, parent can control
        >
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                        >
                            <Paperclip className="size-4" />
                            <span className="max-w-[120px] truncate">{file.name}</span>
                            <button
                                onClick={() => handleRemoveFile(index)}
                                className="hover:bg-secondary/50 rounded-full p-1"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <PromptInputTextarea placeholder="Ask me anything..." />

            <PromptInputActions className="relative flex items-center justify-between gap-2 pt-2">
                <PromptInputAction tooltip="Attach files">
                    <label
                        htmlFor="file-upload"
                        className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
                    >
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <Paperclip className="text-primary size-5" />
                    </label>
                </PromptInputAction>

                <PromptInputAction
                    tooltip={isLoadingInternal ? "Stop generation" : "Send message"}
                >
                    <button
                        onClick={handleSubmit}
                        disabled={isLoadingInternal} // Use internal loading state
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoadingInternal ? (
                            <Square className="size-5 fill-current" />
                        ) : (
                            <ArrowUp className="size-5" />
                        )}
                    </button>
                </PromptInputAction>
            </PromptInputActions>
        </PromptInput>
    )
}
