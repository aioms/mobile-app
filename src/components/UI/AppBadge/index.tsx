import React from 'react';

type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'medium' | 'light' | 'dark' | string;

interface AppBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
  variant?: 'solid' | 'outline' | 'soft';
}

const AppBadge: React.FC<AppBadgeProps> = ({ 
  children, 
  color = 'primary', 
  variant = 'soft',
  className = '',
  ...rest 
}) => {
  // If color is a tailwind string (contains space or bg-), use it directly
  const isTailwindClass = typeof color === 'string' && (color.includes('bg-') || color.includes('text-') || color.includes(' '));

  // Mapping for Ionic-like colors to Tailwind classes
  const colorMap: Record<string, { solid: string; outline: string; soft: string }> = {
    primary: { solid: 'bg-blue-600 text-white border-blue-600', outline: 'bg-transparent text-blue-600 border-blue-600', soft: 'bg-blue-100 text-blue-700 border-transparent' },
    secondary: { solid: 'bg-teal-500 text-white border-teal-500', outline: 'bg-transparent text-teal-500 border-teal-500', soft: 'bg-teal-100 text-teal-700 border-transparent' },
    tertiary: { solid: 'bg-purple-600 text-white border-purple-600', outline: 'bg-transparent text-purple-600 border-purple-600', soft: 'bg-purple-100 text-purple-700 border-transparent' },
    success: { solid: 'bg-green-500 text-white border-green-500', outline: 'bg-transparent text-green-500 border-green-500', soft: 'bg-emerald-100/80 text-emerald-700 border-transparent' },
    warning: { solid: 'bg-orange-500 text-white border-orange-500', outline: 'bg-transparent text-orange-500 border-orange-500', soft: 'bg-amber-100 text-amber-800 border-transparent' },
    danger: { solid: 'bg-red-500 text-white border-red-500', outline: 'bg-transparent text-red-500 border-red-500', soft: 'bg-red-100 text-red-700 border-transparent' },
    medium: { solid: 'bg-gray-500 text-white border-gray-500', outline: 'bg-transparent text-gray-500 border-gray-500', soft: 'bg-gray-100 text-gray-700 border-transparent' },
    light: { solid: 'bg-gray-200 text-gray-800 border-gray-200', outline: 'bg-transparent text-gray-400 border-gray-200', soft: 'bg-gray-50 text-gray-600 border-transparent' },
    dark: { solid: 'bg-gray-800 text-white border-gray-800', outline: 'bg-transparent text-gray-800 border-gray-800', soft: 'bg-gray-200 text-gray-800 border-transparent' },
  };

  const colorClass = isTailwindClass 
    ? `${color} border-transparent`
    : (colorMap[color as string] || colorMap.primary)[variant];

  return (
    <span 
      className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full border ${colorClass} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};

export default AppBadge;
