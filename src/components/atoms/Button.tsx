/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon' | 'iconLg'; // Added icon sizes
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isLoading?: boolean; // For future use
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    className = '',
    isLoading,
    // Destructure all standard HTML drag event props to avoid type conflicts with Framer Motion
    onDrag,
    onDragCapture,
    onDragEnd,
    onDragEndCapture,
    onDragEnter,
    onDragEnterCapture,
    onDragExit,
    onDragExitCapture,
    onDragLeave,
    onDragLeaveCapture,
    onDragOver,
    onDragOverCapture,
    onDragStart,
    onDragStartCapture,
    // Destructure standard HTML animation event props
    onAnimationStart,
    onAnimationStartCapture,
    onAnimationEnd,
    onAnimationEndCapture,
    onAnimationIteration,
    onAnimationIterationCapture,
    ...restProps // Collect remaining props as restProps
}) => {
    const baseStyle = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out flex items-center justify-center";

    let variantStyle = '';
    switch (variant) {
        case 'primary':
            variantStyle = 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500';
            break;
        case 'secondary':
            variantStyle = 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 focus:ring-gray-500';
            break;
        case 'ghost':
            variantStyle = 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-gray-500';
            break;
        case 'outline':
            variantStyle = 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-gray-500';
            break;
    }

    let sizeStyle = '';
    switch (size) {
        case 'sm':
            sizeStyle = 'py-1 px-2 text-sm';
            break;
        case 'md':
            sizeStyle = 'py-2 px-4';
            break;
        case 'lg':
            sizeStyle = 'py-3 px-6 text-lg';
            break;
        case 'icon': // Style for 'icon' size
            sizeStyle = 'p-2'; // Adjust padding as needed for icon buttons
            break;
        case 'iconLg': // Style for 'iconLg' size
            sizeStyle = 'p-3'; // Adjust padding as needed for large icon buttons
            break;
    }

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
            disabled={isLoading || restProps.disabled} // Use restProps here
            {...restProps} // Spread restProps here
        >
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </motion.button>
    );
};

export default React.memo(Button);
