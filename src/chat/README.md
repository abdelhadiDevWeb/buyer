# Responsive Chat Component

## Overview
This is a fully responsive chat component that adapts to different screen sizes, providing an optimal user experience on both desktop and mobile devices.

## Features

### Desktop Experience
- **Side-by-side layout**: Chat list and conversation view displayed simultaneously
- **Wide sidebar**: 300px-350px chat list with search functionality
- **Full conversation view**: Dedicated space for messages and input
- **Hover effects**: Interactive elements with smooth transitions

### Mobile Experience
- **Two-step navigation**: 
  1. **Step 1**: Shows only chat list with search functionality
  2. **Step 2**: Tap conversation → Full-screen chat view with messages
- **Full-screen layouts**: Each view utilizes entire viewport for maximum space efficiency
- **Touch-optimized**: Large touch targets and smooth scrolling
- **Mobile headers**: 
  - Chat list: "Messages" title with close button
  - Chat view: Back button, user info, and close button
- **Responsive breakpoints**: Adapts at 768px, 1024px, and 1200px

## Responsive Breakpoints

### Mobile (≤ 768px)
- **Initial view**: Full-screen chat list with search
- **Navigation**: Tap conversation → Full-screen chat view
- **Chat list header**: "Messages" title with close button
- **Chat view header**: Back button, user info, and close button
- **Message bubbles**: Optimized for mobile (85% max width)
- **Input area**: Touch-friendly with compact design

### Tablet (769px - 1024px)
- Sidebar width: 280px
- Balanced layout for medium screens
- Maintains desktop functionality

### Desktop (≥ 1025px)
- Sidebar width: 300px-350px
- Full desktop experience
- Hover effects and animations

### Large Desktop (≥ 1200px)
- Sidebar width: 350px
- Optimal spacing for large screens
- Enhanced visual hierarchy

## Key Components

### Chat Container
- `responsive-chat-container`: Main wrapper with mobile/desktop classes
- Handles full-screen vs. windowed display

### Mobile Header
- `mobile-chat-header`: Navigation bar for mobile chat view
- Back button, user info, and close button
- Only visible when in conversation view on mobile

### Chat Sidebar
- `chat-sidebar`: List of conversations with search
- Responsive width based on screen size
- Hidden on mobile when in conversation view

### Chat Main Area
- `chat-main`: Conversation view with messages and input
- Adapts layout based on screen size
- Empty state when no conversation selected

### Messages
- `message`: Individual message with sender/receiver styling
- `message-bubble`: Styled message content with timestamps
- Responsive max-width for optimal readability

## Usage

```tsx
import Chat from './Chat';

// Basic usage
<Chat setShow={setShowChat} />

// With additional props
<Chat 
  setShow={setShowChat}
  check={isMinimized}
  setCheck={setIsMinimized}
/>
```

## Props

- `setShow?: (show: boolean) => void` - Function to control chat visibility
- `check?: boolean` - Whether chat is minimized (legacy support)
- `setCheck?: (check: boolean) => void` - Function to control minimized state

## Styling

The component uses CSS classes with responsive design principles:
- Mobile-first approach
- Flexible layouts with CSS Grid and Flexbox
- Smooth transitions and hover effects
- Custom scrollbars for better UX
- Focus states for accessibility

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)
- Responsive design works on all screen sizes
- Touch-friendly interface for mobile devices

## Performance

- Efficient re-renders with React hooks
- Optimized scroll behavior
- Lazy loading of conversation data
- Smooth animations with CSS transitions
