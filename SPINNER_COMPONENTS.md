# Modern Spinner Components

This document describes the modern, animated spinner components created for the MazadClick buyer application.

## Components Overview

### 1. ModernSpinner
A highly customizable spinner component with multiple animation variants and styling options.

### 2. GlobalLoader
A full-screen loading overlay that appears during page refreshes and navigation.

### 3. PageLoader
A flexible loading component that can be used for individual page loading states.

## ModernSpinner Component

### Props
```typescript
interface ModernSpinnerProps {
  variant?: 'orbit' | 'pulse' | 'wave' | 'dots' | 'ripple' | 'cube' | 'flower';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
  text?: string;
  className?: string;
}
```

### Animation Variants

#### 1. Orbit (Default)
- **Description**: Dual rotating circles with opposite directions
- **Animation**: Two concentric circles rotating in opposite directions
- **Best for**: General loading states

#### 2. Pulse
- **Description**: Multi-layered pulsing circles with staggered timing
- **Animation**: Three circles pulsing with different delays
- **Best for**: Data loading, form submissions

#### 3. Wave
- **Description**: Animated wave bars
- **Animation**: Five vertical bars with wave-like motion
- **Best for**: Content loading, list rendering

#### 4. Dots
- **Description**: Bouncing dots
- **Animation**: Three dots bouncing with sequential delays
- **Best for**: Lightweight loading states

#### 5. Ripple
- **Description**: Expanding ripple effect with center pulse
- **Animation**: Expanding circles with a pulsing center
- **Best for**: File uploads, processing states

#### 6. Cube
- **Description**: 3D rotating cube
- **Animation**: Three-dimensional cube rotation
- **Best for**: Heavy processing, data analysis

#### 7. Flower
- **Description**: Flower petal animation
- **Animation**: Eight petals rotating around a center with pulsing effect
- **Best for**: Creative loading states, brand moments

### Sizes
- `sm`: 24px × 24px
- `md`: 40px × 40px (default)
- `lg`: 60px × 60px
- `xl`: 80px × 80px

### Colors
- `primary`: #0063b1 (brand blue)
- `secondary`: #6b7280 (gray)
- `success`: #10b981 (green)
- `warning`: #f59e0b (yellow)
- `error`: #ef4444 (red)
- `white`: #ffffff (white)

### Usage Examples

```tsx
// Basic usage
<ModernSpinner />

// Custom variant and size
<ModernSpinner variant="flower" size="xl" />

// With custom text
<ModernSpinner 
  variant="ripple" 
  color="success" 
  text="Processing your request..." 
/>

// Error state
<ModernSpinner 
  variant="pulse" 
  color="error" 
  text="Something went wrong" 
/>
```

## GlobalLoader Component

### Features
- **Automatic Detection**: Shows during page refreshes and navigation
- **Full-Screen Overlay**: Covers the entire viewport with blur effect
- **Modern UI**: Glassmorphism design with smooth animations
- **Customizable Text**: Different messages for different loading states

### Usage
The GlobalLoader is automatically included in the root layout and doesn't require manual implementation.

### Loading States
- **Page Refresh**: "Refreshing..."
- **Navigation**: "Loading page..."
- **Default**: "Loading..."

## PageLoader Component

### Props
```typescript
interface PageLoaderProps {
  text?: string;
  variant?: 'orbit' | 'pulse' | 'wave' | 'dots' | 'ripple' | 'cube' | 'flower';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
  fullScreen?: boolean;
}
```

### Usage Examples

```tsx
// Inline page loader
<PageLoader 
  variant="wave" 
  text="Loading categories..." 
/>

// Full-screen page loader
<PageLoader 
  variant="flower" 
  size="xl" 
  color="primary" 
  text="Preparing your dashboard..." 
  fullScreen={true} 
/>
```

## Integration Examples

### 1. Category Loading Page
```tsx
// buyer/src/app/category/loading.tsx
import PageLoader from "@/components/common/PageLoader";

export default function Loading() {
  return (
    <div className="category-page-loading">
      <PageLoader
        variant="ripple"
        size="xl"
        color="primary"
        text="Nous préparons la liste complète des catégories pour vous."
      />
    </div>
  );
}
```

### 2. Custom Loading State
```tsx
import { useState } from 'react';
import ModernSpinner from '@/components/common/ModernSpinner';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await submitData();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading && (
        <ModernSpinner 
          variant="pulse" 
          text="Submitting your data..." 
        />
      )}
      <button onClick={handleSubmit} disabled={isLoading}>
        Submit
      </button>
    </div>
  );
}
```

## Demo Page

Visit `/spinner-demo` to see all spinner variants in action with interactive controls.

## CSS Animations

All animations are defined using CSS keyframes and are optimized for performance:

- **Hardware Acceleration**: Uses `transform` and `opacity` for smooth animations
- **Efficient Timing**: Carefully tuned animation durations and easing functions
- **Responsive Design**: Works seamlessly across all device sizes
- **Accessibility**: Maintains good contrast ratios and doesn't cause motion sickness

## Browser Support

- **Modern Browsers**: Full support for all features
- **CSS Grid**: Used for responsive layouts
- **CSS Custom Properties**: Used for dynamic theming
- **Backdrop Filter**: Used for glassmorphism effects (with fallbacks)

## Performance Considerations

- **Lightweight**: Minimal JavaScript, CSS-based animations
- **Efficient**: Uses CSS transforms instead of layout-triggering properties
- **Optimized**: Animations are GPU-accelerated where possible
- **Memory Efficient**: No unnecessary re-renders or state updates

## Customization

### Adding New Variants
To add a new spinner variant:

1. Add the variant to the `ModernSpinnerProps` interface
2. Implement the rendering logic in the `renderSpinner` function
3. Add corresponding CSS animations
4. Update the demo page and documentation

### Theming
Colors can be customized by modifying the `colorStyles` object in `ModernSpinner.tsx`.

### Animation Timing
Animation durations and easing functions can be adjusted in the CSS keyframes definitions.
