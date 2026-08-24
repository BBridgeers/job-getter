import React from 'react';

function Button({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    className = '',
    icon: Icon,
    ...props
}) {
    const baseStyles = "font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2";

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const variantStyles = {
        primary: 'bg-sage text-linen hover:bg-sage-deep shadow-sm',
        secondary: 'bg-transparent border border-hairline-strong text-vintageblue-deep hover:bg-vintageblue-mist/50 hover:border-vintageblue',
        success: 'bg-olive text-linen hover:brightness-110 shadow-sm',
        danger: 'bg-rust text-linen hover:bg-rust-deep',
        ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-parchment'
    };

    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
            {children}
        </button>
    );
}

export default Button;
