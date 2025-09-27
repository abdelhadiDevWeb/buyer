import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfessionalAuctions from './ProfessionalAuctions';
import useAuth from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the AuctionsAPI
jest.mock('@/app/api/auctions', () => ({
  AuctionsAPI: {
    getAuctions: jest.fn(),
  },
}));

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ProfessionalAuctions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render for non-logged in users', () => {
    mockUseAuth.mockReturnValue({
      isLogged: false,
      auth: null,
      isReady: true,
    } as any);

    const { container } = render(<ProfessionalAuctions />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render for non-professional users', () => {
    mockUseAuth.mockReturnValue({
      isLogged: true,
      auth: {
        user: {
          type: 'CLIENT',
        },
      },
      isReady: true,
    } as any);

    const { container } = render(<ProfessionalAuctions />);
    expect(container.firstChild).toBeNull();
  });

  it('should render for professional users', () => {
    mockUseAuth.mockReturnValue({
      isLogged: true,
      auth: {
        user: {
          type: 'PROFESSIONAL',
        },
      },
      isReady: true,
    } as any);

    render(<ProfessionalAuctions />);
    expect(screen.getByText('professionalAuctions.title')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    mockUseAuth.mockReturnValue({
      isLogged: true,
      auth: {
        user: {
          type: 'PROFESSIONAL',
        },
      },
      isReady: true,
    } as any);

    render(<ProfessionalAuctions />);
    // The loading spinner should be present
    expect(document.querySelector('[style*="animation: spin"]')).toBeInTheDocument();
  });
});
