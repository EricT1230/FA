#!/bin/bash

# ========================================
# Freelancer Aggregator Deployment Script
# ========================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." &> /dev/null && pwd)"
LOG_DIR="/var/log/fa-deployment"
BACKUP_DIR="/backup/fa"

# Default values
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Validate environment
validate_environment() {
    log "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        staging|production)
            log "Environment '$ENVIRONMENT' is valid"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
            ;;
    esac
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required environment files exist
    if [[ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
        error "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running"
    fi
    
    # Check available disk space (minimum 10GB)
    AVAILABLE_SPACE=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $AVAILABLE_SPACE -lt 10 ]]; then
        error "Insufficient disk space. Available: ${AVAILABLE_SPACE}GB, Required: 10GB"
    fi
    
    success "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        warning "Skipping tests as requested"
        return
    fi
    
    log "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run main app tests
    log "Running main application tests..."
    cd decision-platform && pnpm test:ci
    
    # Run auth service tests  
    log "Running auth service tests..."
    cd services/auth && pnpm test
    
    # Run security audit
    log "Running security audit..."
    cd "$PROJECT_ROOT" && pnpm security:audit:all
    
    success "All tests passed"
}

# Create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        warning "Skipping backup as requested"
        return
    fi
    
    if [[ "$ENVIRONMENT" != "production" ]]; then
        log "Skipping backup for non-production environment"
        return
    fi
    
    log "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Database backup
    docker-compose -f docker-compose.production.yml exec -T db-primary pg_dump \
        -U fa_prod_user freelancer_aggregator > "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    
    success "Backup created: ${BACKUP_FILE}.gz"
}

# Deploy application
deploy() {
    log "Starting deployment to $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT/decision-platform"
    
    # Load environment variables
    source ".env.$ENVIRONMENT"
    export IMAGE_TAG="$IMAGE_TAG"
    
    # Pull latest images
    log "Pulling Docker images..."
    docker-compose -f "docker-compose.$ENVIRONMENT.yml" pull
    
    # Deploy with zero downtime
    log "Deploying services..."
    docker-compose -f "docker-compose.$ENVIRONMENT.yml" up -d --force-recreate --remove-orphans
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    timeout 300 bash -c "
        while ! docker-compose -f docker-compose.$ENVIRONMENT.yml ps | grep -q 'healthy'; do
            echo 'Waiting for services to start...'
            sleep 10
        done
    "
    
    success "Deployment completed successfully"
}

# Post-deployment checks
post_deployment_checks() {
    log "Running post-deployment health checks..."
    
    cd "$PROJECT_ROOT/decision-platform"
    
    # Check service health
    SERVICES=("app" "auth" "n8n")
    
    for service in "${SERVICES[@]}"; do
        log "Checking $service service..."
        
        case $service in
            app)
                curl -f "http://localhost:3000/api/health" > /dev/null
                ;;
            auth)
                curl -f "http://localhost:4000/health" > /dev/null
                ;;
            n8n)
                curl -f "http://localhost:15678" > /dev/null
                ;;
        esac
        
        success "$service service is healthy"
    done
    
    # Check database connectivity
    log "Checking database connectivity..."
    docker-compose -f "docker-compose.$ENVIRONMENT.yml" exec -T db-primary pg_isready -U fa_user
    
    success "All post-deployment checks passed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker resources..."
    
    # Remove unused images older than 24 hours
    docker image prune -af --filter "until=24h"
    
    # Remove unused volumes (be careful!)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        docker volume prune -f
    fi
    
    success "Cleanup completed"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    cd "$PROJECT_ROOT/decision-platform"
    
    # Get previous image tags
    PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo "previous")
    
    # Rollback to previous version
    IMAGE_TAG="$PREVIOUS_TAG" docker-compose -f "docker-compose.$ENVIRONMENT.yml" up -d --force-recreate
    
    success "Rollback completed"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 FA Deployment [$ENVIRONMENT]: $status - $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🚀 FA Deployment [$ENVIRONMENT]: $status - $message\"}" \
            "$DISCORD_WEBHOOK_URL"
    fi
}

# Main execution
main() {
    log "🚀 Starting Freelancer Aggregator deployment"
    log "Environment: $ENVIRONMENT"
    log "Image Tag: $IMAGE_TAG"
    
    mkdir -p "$LOG_DIR"
    
    # Redirect all output to log file
    exec > >(tee -a "$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log")
    exec 2>&1
    
    trap 'error "Deployment failed"; send_notification "FAILED" "Deployment failed"' ERR
    
    validate_environment
    pre_deployment_checks
    run_tests
    create_backup
    deploy
    post_deployment_checks
    cleanup
    
    success "🎉 Deployment completed successfully!"
    send_notification "SUCCESS" "Deployment completed successfully"
}

# Handle arguments
case "${1:-}" in
    --rollback)
        rollback
        ;;
    --help|-h)
        echo "Usage: $0 [staging|production] [image_tag]"
        echo "Options:"
        echo "  --rollback    Rollback to previous version"
        echo "  --help        Show this help"
        echo ""
        echo "Environment variables:"
        echo "  SKIP_TESTS=true    Skip running tests"
        echo "  SKIP_BACKUP=true   Skip creating backup"
        exit 0
        ;;
    *)
        main
        ;;
esac