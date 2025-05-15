#!/bin/bash

# Build script for Windows application

echo "Building Tower Defense for Windows..."

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Step 2: Build the application
echo "Building the application..."
npm run build

# Step 3: Build the Electron application for Windows
echo "Building Electron application for Windows..."
npm run electron:build

echo "Build complete! Check the electron-dist directory for the Windows installer."