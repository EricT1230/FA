#!/bin/bash

# ========================================
# Freelancer Aggregator - Development Setup
# ========================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 20.x or later."
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        error "Node.js version must be 20.x or later. Current: $(node --version)"
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        error "pnpm is not installed. Install with: npm install -g pnpm"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker Desktop."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker Desktop."
    fi
    
    success "All prerequisites satisfied"
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    # Install dependencies
    log "Installing dependencies..."
    pnpm install
    
    # Setup environment files
    if [ ! -f "decision-platform/.env" ]; then
        log "Creating environment file..."
        cp decision-platform/.env.example decision-platform/.env
        warning "Please update decision-platform/.env with your configuration"
    fi
    
    # Make scripts executable
    chmod +x decision-platform/scripts/deployment/deploy.sh
    chmod +x .husky/pre-commit 2>/dev/null || true
    
    success "Environment setup completed"
}

# Setup Docker services
setup_docker() {
    log "Setting up Docker services..."
    
    cd decision-platform
    
    # Start infrastructure services
    log "Starting infrastructure services..."
    docker-compose -f docker-compose.minimal.yml up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    if curl -f http://localhost:15678 &> /dev/null; then
        success "N8N is running on http://localhost:15678"
    else
        warning "N8N may not be ready yet. Please check: docker-compose logs n8n"
    fi
    
    if curl -f http://localhost:9000 &> /dev/null; then
        success "MinIO is running on http://localhost:9000"
    else
        warning "MinIO may not be ready yet."
    fi
    
    cd ..
}

# Run initial tests
run_tests() {
    log "Running initial tests..."
    
    cd decision-platform
    
    # Run basic tests
    if pnpm test src/__tests__/utils.test.ts &> /dev/null; then
        success "Tests are working correctly"
    else
        warning "Some tests failed. Run 'pnpm test' to see details."
    fi
    
    cd ..
}

# Display final instructions
show_final_instructions() {
    echo ""
    echo "🎉 Development environment setup completed!"
    echo "=========================================="
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Register N8N admin account: http://localhost:15678"
    echo "  2. Configure OAuth providers in decision-platform/.env"
    echo "  3. Start development: make dev"
    echo ""
    echo "📖 Available commands:"
    echo "  make help              # Show all available commands"
    echo "  make dev               # Start development servers"
    echo "  make test              # Run tests"
    echo "  make ci                # Run complete CI checks"
    echo "  make deploy-staging    # Deploy to staging"
    echo ""
    echo "📚 Documentation:"
    echo "  📋 CI/CD Guide: ./CICD-GUIDE.md"
    echo "  🏗️ Architecture: ./README.md"
    echo "  🔄 N8N Workflows: ./decision-platform/README-N8N.md"
    echo ""
    echo "🐛 Troubleshooting:"
    echo "  make status            # Check environment status"
    echo "  make logs              # View service logs"
    echo "  make restart-services  # Restart all services"
    echo ""
}

# Main execution
main() {
    echo "🚀 Setting up Freelancer Aggregator development environment..."
    echo ""
    
    check_prerequisites
    setup_environment
    setup_docker
    run_tests
    show_final_instructions
}

# Run main function
main "$@"