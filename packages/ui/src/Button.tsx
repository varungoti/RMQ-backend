import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
  // Add other props like size, isLoading, etc.
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((
  { children, variant = 'primary', className, ...props }, 
  ref
) => {
  // Basic styling - enhance with Tailwind later
  const baseStyle = 'px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button'; 