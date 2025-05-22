import React from 'react';

// Define types for the HTML element and styling variants
type HtmlElementTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label';
type StyleVariant = HtmlElementTag | 'body1' | 'body2' | 'caption' | 'subtitle1' | 'subtitle2';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
    as?: HtmlElementTag; // The HTML tag to render
    variant?: StyleVariant; // The styling variant to apply
    className?: string;
    children: React.ReactNode;
}

const Text: React.FC<TextProps> = ({
    as: Tag = 'p', // Default to 'p' tag
    variant,
    className = '',
    children,
    ...props
}) => {
    let variantClass = '';

    // Determine the styling key.
    // If a variant is explicitly provided, use it.
    // Otherwise, infer from the tag: 'p' and 'span' default to 'body1' style,
    // headings and labels use their own tag name as style key.
    let styleLookupKey: StyleVariant;
    if (variant) {
        styleLookupKey = variant;
    } else {
        if (Tag === 'p' || Tag === 'span') {
            styleLookupKey = 'body1';
        } else {
            styleLookupKey = Tag; // 'h1'-'h6', 'label'
        }
    }

    // Map style variants to Tailwind classes
    switch (styleLookupKey) {
        case 'h1':
            variantClass = 'text-4xl font-bold';
            break;
        case 'h2':
            variantClass = 'text-3xl font-semibold';
            break;
        case 'h3':
            variantClass = 'text-2xl font-semibold';
            break;
        case 'h4':
            variantClass = 'text-xl font-semibold';
            break;
        case 'h5':
            variantClass = 'text-lg font-semibold';
            break;
        case 'h6':
            variantClass = 'text-base font-semibold';
            break;
        case 'subtitle1': // Custom style variant
            variantClass = 'text-lg';
            break;
        case 'subtitle2': // Custom style variant
            variantClass = 'text-md';
            break;
        case 'body1': // Custom style variant (or default for p/span)
            variantClass = 'text-base';
            break;
        case 'body2': // Custom style variant
            variantClass = 'text-sm';
            break;
        case 'caption': // Custom style variant
            variantClass = 'text-xs text-gray-500 dark:text-gray-400';
            break;
        case 'label':
            variantClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';
            break;
        // No default case needed as styleLookupKey is constrained
    }

    return (
        // Tag is now guaranteed to be a valid HtmlElementTag
        <Tag className={`${variantClass} ${className}`.trim()} {...props}>
            {children}
        </Tag>
    );
};

export default React.memo(Text);
