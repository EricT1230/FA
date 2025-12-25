import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import Home from '@/app/page'

// Mock the components that might have external dependencies
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick }: any) => (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => <div className={className}>{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-${value}`}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Star: () => <div data-testid="star-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
}))

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />)
    
    // Check if the main heading is present
    expect(screen.getByText('接案彙總評分平台')).toBeInTheDocument()
  })

  it('renders tab navigation', () => {
    render(<Home />)
    
    // Check if tabs are rendered
    expect(screen.getByTestId('tabs')).toBeInTheDocument()
    expect(screen.getByTestId('tab-discover')).toBeInTheDocument()
    expect(screen.getByTestId('tab-jobs')).toBeInTheDocument()
    expect(screen.getByTestId('tab-decisions')).toBeInTheDocument()
    expect(screen.getByTestId('tab-favorites')).toBeInTheDocument()
  })

  it('has correct default tab value', () => {
    render(<Home />)
    
    const tabs = screen.getByTestId('tabs')
    expect(tabs).toHaveAttribute('data-default-value', 'discover')
  })

  it('renders explore section', () => {
    render(<Home />)
    
    // Check for explore section content
    expect(screen.getByText('探索新案件')).toBeInTheDocument()
    expect(screen.getByText('發現符合您技能的最新案件機會')).toBeInTheDocument()
  })

  it('renders team mode toggle', () => {
    render(<Home />)
    
    // Check for team mode section
    expect(screen.getByText('團隊模式')).toBeInTheDocument()
    expect(screen.getByText('切換至專業團隊協作決策模式')).toBeInTheDocument()
  })
})