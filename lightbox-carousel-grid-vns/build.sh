#!/bin/bash

# VNS.Gallery Build Script
# Dette script bygger projektet og forbereder det til distribution

set -e

# Get current version from package.json
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')

echo "🔨 Building VNS.Gallery..."
echo "Current version: $CURRENT_VERSION"
echo ""
read -p "Enter new version (or press Enter to keep $CURRENT_VERSION): " NEW_VERSION

# Update version if provided
if [ ! -z "$NEW_VERSION" ]; then
    # Validate semantic version format
    if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Error: Version must be in semantic version format (e.g., 1.0.1)"
        exit 1
    fi

    echo "🔄 Updating version to $NEW_VERSION..."

    # Update package.json
    if command -v jq &> /dev/null; then
        jq --arg ver "$NEW_VERSION" '.version = $ver' package.json > package.json.tmp && mv package.json.tmp package.json
    else
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
    fi

    # Update package-lock.json
    echo "🔄 Updating package-lock.json..."
    npm install --package-lock-only

    # Update version in license notice
    echo "🔄 Updating version in license-notice.txt..."
    sed -i '' "s/@version [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*/@version $NEW_VERSION/" src/license-notice.txt

    # Update version in vns-gallery.js
    echo "🔄 Updating version in vns-gallery.js..."
    sed -i '' "s/Version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*/Version: $NEW_VERSION/" src/vns-gallery.js

    # Update version in vns-gallery.css
    echo "🔄 Updating version in vns-gallery.css..."
    sed -i '' "s/Version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*/Version: $NEW_VERSION/" src/vns-gallery.css

    echo "✅ Version updated to $NEW_VERSION"
    CURRENT_VERSION=$NEW_VERSION
    echo ""
fi

# Clean previous build
if [ -d "dist" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf dist
    mkdir -p dist
fi

# Build project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    # Convert dist files to LF line endings
    echo "🔧 Converting line endings to LF..."
    find dist -type f \( -name "*.js" -o -name "*.css" \) -exec sed -i '' $'s/\r$//' {} \;

    # Update demo/index.html with new version
    echo "📝 Updating demo/index.html..."
    # No version replacement needed - files have static names

    echo ""
    echo "✅ Build completed successfully!"
    echo "📁 Distribution files are in: dist/"
    echo ""
    echo "Files ready for deployment:"
    ls -lh dist/

    # Ask about git commit if version was updated
    if [ ! -z "$NEW_VERSION" ]; then
        echo ""
        read -p "Create git tag for version $NEW_VERSION? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[YyJj]$ ]]; then
            # Check if there are changes to commit
            if [ -n "$(git status --porcelain)" ]; then
                echo "📝 Committing changes..."
                git add package.json package-lock.json src/license-notice.txt dist/ demo/index.html
                git commit -m "Release version $NEW_VERSION"
            fi

            echo "🏷️  Creating git tag..."
            git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

            echo ""
            read -p "Push to remote? (y/n): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[YyJj]$ ]]; then
                echo "📤 Pushing to remote..."
                git push && git push --tags

                # Create GitHub release if gh CLI is available
                if command -v gh &> /dev/null; then
                    echo ""
                    read -p "Create GitHub release? (y/n): " -n 1 -r
                    echo ""
                    if [[ $REPLY =~ ^[YyJj]$ ]]; then
                        echo "📦 Creating GitHub release..."
                        gh release create "v$NEW_VERSION" \
                            --title "v$NEW_VERSION" \
                            --notes "Release version $NEW_VERSION" \
                            --latest \
                            dist/vns-gallery.js \
                            dist/vns-gallery.min.js \
                            dist/vns-gallery.css \
                            dist/vns-gallery.min.css \
                            dist/vns-gallery.min.css.map

                        if [ $? -eq 0 ]; then
                            echo "✅ GitHub release created successfully!"
                        else
                            echo "❌ Failed to create GitHub release"
                        fi
                    fi
                else
                    echo "ℹ️  GitHub CLI (gh) not installed. Skipping release creation."
                    echo "   Install with: brew install gh"
                fi

                echo ""
                echo "🎉 Release $NEW_VERSION completed and pushed!"
            else
                echo "ℹ️  Remember to push later with: git push && git push --tags"
            fi
        fi
    fi
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
