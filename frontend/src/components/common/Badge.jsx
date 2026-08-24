import React from 'react';

function Badge({ children, color = 'var(--color-sage)', variant = 'filled', className = '' }) {
    const baseStyles = "px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300";

    const variantStyles = {
        filled: `bg-[rgba(255,255,255,0.1)] text-white border-[${color}]`,
        outlined: `bg-transparent text-[${color}] border-[${color}]`,
        glow: `bg-[rgba(255,255,255,0.1)] text-white border-[${color}]`
    };

    const glowStyle = variant === 'glow' ? { boxShadow: `0 0 10px ${color}` } : {};

    return (
        <span
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={{ borderColor: color, color: variant === 'outlined' ? color : 'white', ...glowStyle }}
        >
            {children}
        </span>
    );
}

export default Badge;
