import React from 'react';
import { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
    icon: React.ElementType; // Expect a lucide icon component
    size?: number | string;
    color?: string;
    className?: string;
}

const Icon: React.FC<IconProps> = ({
    icon: IconComponent,
    size = 24,
    color,
    className = '',
    ...props
}) => {
    return <IconComponent size={size} color={color} className={`inline-block ${className}`} {...props} />;
};

export default React.memo(Icon);
