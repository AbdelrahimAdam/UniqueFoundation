import React from 'react'
import LoadingSpinner from './LoadingSpinner'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  fullWidth = false,
  type = 'button',
  startIcon,
  endIcon,
  ...props 
}) => {
  // Base classes that apply to all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95'
  
  // Variant styles with better visual hierarchy
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-md hover:shadow-lg',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-lg hover:shadow-xl',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800 focus:ring-yellow-500 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500 bg-transparent',
    'outline-secondary': 'border-2 border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white focus:ring-gray-500 bg-transparent',
    ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500 bg-transparent hover:shadow-md',
    link: 'text-blue-600 hover:text-blue-800 underline bg-transparent focus:ring-blue-500 p-0 hover:no-underline'
  }
  
  // Size styles with better proportions
  const sizes = {
    xs: 'px-2 py-1 text-xs rounded-md gap-1',
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
    xl: 'px-8 py-4 text-lg rounded-2xl gap-3'
  }

  // Width control
  const widthClass = fullWidth ? 'w-full' : ''

  // Combine all classes
  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    widthClass,
    // Remove focus ring for link variant
    variant === 'link' ? 'focus:ring-0 focus:ring-offset-0' : '',
    className
  ].filter(Boolean).join(' ')

  // Render icon component if provided
  const renderIcon = (icon, position) => {
    if (!icon) return null
    
    const IconComponent = icon
    const iconSize = {
      xs: 'h-3 w-3',
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6'
    }[size]

    return (
      <IconComponent 
        className={`${iconSize} ${position === 'start' ? 'mr-2' : 'ml-2'}`} 
      />
    )
  }

  return (
    <button 
      type={type}
      className={classes} 
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading state */}
      {loading && (
        <LoadingSpinner 
          size={size}
          className={`${children ? 'mr-2' : ''} ${
            variant.includes('outline') || variant === 'ghost' || variant === 'link' 
              ? 'text-current' 
              : 'text-white'
          }`} 
        />
      )}
      
      {/* Start icon (only show when not loading) */}
      {!loading && startIcon && renderIcon(startIcon, 'start')}
      
      {/* Button content */}
      {children}
      
      {/* End icon (only show when not loading) */}
      {!loading && endIcon && renderIcon(endIcon, 'end')}
    </button>
  )
}

export default React.memo(Button)