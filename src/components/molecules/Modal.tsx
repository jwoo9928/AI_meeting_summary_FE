import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../atoms/Icon';
import { X } from 'lucide-react';
import Button from '../atoms/Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode; // Optional footer for action buttons
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm p-4" // Changed opacity to 50
                    onClick={onClose} // Close on overlay click
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        // Forcing a light theme for this modal, overriding any global dark mode
                        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Explicitly light theme */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:bg-gray-100" aria-label="Close modal">
                                <Icon icon={X} size={20} />
                            </Button>
                        </div>

                        {/* Body - Standard padding, will inherit white background */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {children}
                        </div>

                        {/* Footer - Explicitly light theme footer */}
                        {footer && (
                            <div className="bg-gray-50 p-4 border-t border-gray-200">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(Modal);
