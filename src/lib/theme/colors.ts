// Color Theme Configuration
export const theme = {
  colors: {
    // Primary Colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main primary color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Secondary Colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b', // Main secondary color
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Accent Colors
    accent: {
      50: '#fef2f2',
      100: '#fdede8',
      200: '#fbd5d5',
      300: '#f7b2a7',
      400: '#f59e0b',
      500: '#f97316', // Main accent color
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    
    // Neutral Colors
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373', // Main neutral color
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    
    // Success Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main success color
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Warning Colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Main warning color
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error Colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main error color
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Custom Theme Colors
    custom: {
      // From provided hex codes
      '2db247': '#2db247', // Green
      '32b044': '#32b044', // Dark Green
      '8f1e22': '#8f1e22', // Dark Red
      'a4e0b3': '#a4e0b3', // Orange
      '2596be': '#2596be', // Blue
    }
  },
  
  // Semantic Color Mappings
  semantic: {
    background: '#ffffff',
    foreground: '#171717',
    muted: '#f5f5f5',
    'muted-foreground': '#737373',
    border: '#e5e5e5',
    input: '#ffffff',
    ring: '#0ea5e9',
    card: '#ffffff',
    'card-foreground': '#171717',
    popover: '#ffffff',
    'popover-foreground': '#171717',
    destructive: '#ef4444',
    'destructive-foreground': '#f8fafc',
  }
}

// Utility functions for theme colors
export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.')
  let value: any = theme.colors
  
  for (const key of keys) {
    value = value[key]
  }
  
  return value
}

export const getCustomColor = (hexCode: string) => {
  return theme.colors.custom[hexCode as keyof typeof theme.colors.custom] || hexCode
}

// Tailwind CSS custom colors for the theme
export const tailwindColors = {
  primary: {
    50: 'rgb(240, 249, 255)',
    100: 'rgb(224, 242, 254)',
    200: 'rgb(186, 230, 253)',
    300: 'rgb(125, 211, 252)',
    400: 'rgb(56, 189, 248)',
    500: 'rgb(14, 165, 233)',
    600: 'rgb(2, 132, 199)',
    700: 'rgb(3, 105, 161)',
    800: 'rgb(7, 89, 133)',
    900: 'rgb(12, 74, 110)',
  },
  custom: {
    '2db247': 'rgb(45, 178, 71)',
    '32b044': 'rgb(50, 176, 68)',
    '8f1e22': 'rgb(143, 30, 34)',
    'a4e0b3': 'rgb(164, 224, 179)',
    '2596be': 'rgb(37, 150, 190)',
  }
}
