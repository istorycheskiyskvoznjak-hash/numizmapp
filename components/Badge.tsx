import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, className }) => {
    return (
        <span className={`inline-block bg-base-content/10 text-base-content/90 rounded-full px-3 py-1 text-xs font-medium ${className}`}>
            {children}
        </span>
    );
};

export default Badge;