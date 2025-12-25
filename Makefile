# ========================================
# Freelancer Aggregator - Development Makefile
# ========================================

.PHONY: help setup dev test build deploy clean

# Default target
help: ## 📖 Show available commands
	@echo "🚀 Freelancer Aggregator - Development Commands"
	@echo "==============================================="
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ 🏗️  Development Setup
setup: ## 🔧 Setup development environment
	@echo "🔧 Setting up development environment..."
	pnpm install
	cp decision-platform/.env.example decision-platform/.env
	chmod +x decision-platform/scripts/deployment/deploy.sh
	chmod +x .husky/pre-commit
	@echo "✅ Development environment ready!"

dev: ## 🚀 Start development servers
	@echo "🚀 Starting development servers..."
	pnpm docker:dev
	@echo "✅ Services started!"
	@echo "📱 App: http://localhost:3000"
	@echo "🔄 N8N: http://localhost:15678"
	@echo "📊 MinIO: http://localhost:9000"

##@ 🧪 Testing & Quality
test: ## 🧪 Run all tests
	@echo "🧪 Running all tests..."
	pnpm test:all

test-watch: ## 👀 Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	cd decision-platform && pnpm test:watch

lint: ## 🔍 Run linting and formatting
	@echo "🔍 Running linting..."
	pnpm lint

type-check: ## 📝 Run TypeScript type checking
	@echo "📝 Running type checks..."
	pnpm type-check

security: ## 🔒 Run security audit
	@echo "🔒 Running security audit..."
	pnpm security:audit:all

ci: ## 🔄 Run complete CI checks
	@echo "🔄 Running complete CI pipeline..."
	pnpm ci:test

##@ 🏗️  Build & Deploy
build: ## 📦 Build application
	@echo "📦 Building application..."
	pnpm build

deploy-staging: ## 🎭 Deploy to staging
	@echo "🎭 Deploying to staging..."
	./decision-platform/scripts/deployment/deploy.sh staging

deploy-prod: ## 🏭 Deploy to production  
	@echo "🏭 Deploying to production..."
	./decision-platform/scripts/deployment/deploy.sh production

##@ 🐳 Docker Management
docker-dev: ## 🐳 Start development Docker services
	@echo "🐳 Starting development services..."
	pnpm docker:dev

docker-staging: ## 🎭 Start staging Docker services  
	@echo "🎭 Starting staging services..."
	pnpm docker:staging

docker-prod: ## 🏭 Start production Docker services
	@echo "🏭 Starting production services..."
	pnpm docker:prod

docker-down: ## ⏹️  Stop all Docker services
	@echo "⏹️ Stopping Docker services..."
	pnpm docker:down

docker-clean: ## 🧹 Clean Docker resources
	@echo "🧹 Cleaning Docker resources..."
	pnpm docker:clean

##@ 📊 Monitoring & Logs
logs: ## 📋 View all service logs
	@echo "📋 Viewing all service logs..."
	pnpm logs:all

logs-app: ## 📱 View app logs
	pnpm logs:app

logs-n8n: ## 🔄 View N8N logs
	pnpm logs:n8n

health: ## 🏥 Check service health
	@echo "🏥 Checking service health..."
	pnpm health:check

##@ 💾 Database Management
backup: ## 💾 Create database backup
	@echo "💾 Creating database backup..."
	pnpm backup:db

restore: ## 🔄 Restore database from backup
	@echo "🔄 Restoring database..."
	@read -p "Enter backup file path: " backup_file; \
	cat "$$backup_file" | pnpm restore:db

##@ 🧹 Cleanup & Maintenance
clean: ## 🧹 Clean all build artifacts
	@echo "🧹 Cleaning build artifacts..."
	pnpm clean

clean-all: ## 🗑️  Complete cleanup (Docker + Node modules)
	@echo "🗑️ Complete cleanup..."
	make docker-clean
	make clean
	rm -rf node_modules decision-platform/node_modules

reset: ## 🔄 Reset development environment
	@echo "🔄 Resetting development environment..."
	make clean-all
	make setup
	make dev

##@ 📚 Documentation & Help
docs: ## 📚 Generate/update documentation
	@echo "📚 Documentation commands:"
	@echo "  📖 CI/CD Guide: ./CICD-GUIDE.md"
	@echo "  🏗️ Architecture: ./README.md"
	@echo "  🔄 N8N Workflows: ./decision-platform/README-N8N.md"

status: ## 📊 Show current environment status
	@echo "📊 Current Environment Status"
	@echo "============================="
	@echo "🔧 Node version: $$(node --version)"
	@echo "📦 pnpm version: $$(pnpm --version)"
	@echo "🐳 Docker status:"
	@docker --version 2>/dev/null || echo "  ❌ Docker not available"
	@echo "🔄 Git status:"
	@git status --porcelain | head -5 || echo "  📝 Working directory clean"
	@echo "🐳 Running containers:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  📭 No containers running"

##@ 🆘 Troubleshooting
fix-permissions: ## 🔧 Fix file permissions
	@echo "🔧 Fixing file permissions..."
	chmod +x decision-platform/scripts/deployment/deploy.sh
	chmod +x .husky/pre-commit

restart-services: ## 🔄 Restart all services
	@echo "🔄 Restarting all services..."
	make docker-down
	sleep 5
	make docker-dev

debug: ## 🐛 Debug mode with verbose logging
	@echo "🐛 Starting debug mode..."
	cd decision-platform && LOG_LEVEL=debug pnpm dev