#!/bin/bash

# AKIOR Build Verification Script
# Ensures the application builds without errors

set -e

echo "🔍 AKIOR Build Verification"
echo "============================"
echo ""

# Check Node version
echo "📦 Checking Node.js version..."
node --version
echo ""

# Check dependencies
echo "📚 Verifying dependencies..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules not found. Run 'npm install' first."
  exit 1
fi
echo "✅ Dependencies OK"
echo ""

# TypeScript check
echo "🔧 Running TypeScript check..."
npx tsc --noEmit
echo "✅ TypeScript check passed"
echo ""

# Linting
echo "🧹 Running ESLint..."
npm run lint
echo "✅ Linting passed"
echo ""

# Build
echo "🏗️  Building application..."
npm run build
echo "✅ Build successful"
echo ""

# Run tests
echo "🧪 Running tests..."
npm run test
echo "✅ Tests passed"
echo ""

echo "✅ All checks passed!"
echo ""
echo "🚀 Application is ready for deployment"