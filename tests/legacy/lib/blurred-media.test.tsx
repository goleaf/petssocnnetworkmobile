import { render, screen, fireEvent } from '@testing-library/react';
import { BlurredMedia } from '../blurred-media';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('BlurredMedia', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    blurOnWarning: true,
    isFlagged: false,
  };

  it('renders image without blur when not flagged', () => {
    render(<BlurredMedia {...defaultProps} />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img.parentElement).not.toHaveClass('blur-lg');
  });

  it('renders blurred image when flagged and blur enabled', () => {
    render(<BlurredMedia {...defaultProps} isFlagged={true} />);
    const img = screen.getByAltText('Test image');
    expect(img.parentElement).toHaveClass('blur-lg');
  });

  it('shows reveal button when blurred', () => {
    render(<BlurredMedia {...defaultProps} isFlagged={true} />);
    expect(screen.getByText('Reveal Content')).toBeInTheDocument();
  });

  it('reveals content when reveal button is clicked', () => {
    render(<BlurredMedia {...defaultProps} isFlagged={true} />);
    const revealButton = screen.getByText('Reveal Content');
    fireEvent.click(revealButton);
    
    const img = screen.getByAltText('Test image');
    expect(img.parentElement).not.toHaveClass('blur-lg');
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('does not blur when blurOnWarning is false', () => {
    render(<BlurredMedia {...defaultProps} blurOnWarning={false} isFlagged={true} />);
    const img = screen.getByAltText('Test image');
    expect(img.parentElement).not.toHaveClass('blur-lg');
  });

  it('displays moderation reason when provided', () => {
    render(
      <BlurredMedia
        {...defaultProps}
        isFlagged={true}
        moderationReason="graphic_content"
      />
    );
    expect(screen.getByText(/graphic_content/i)).toBeInTheDocument();
  });
});

