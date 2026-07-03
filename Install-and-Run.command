#!/bin/bash

# MyShop Desk - Automated Installer & Launcher for macOS/Linux

# Clear terminal screen
clear

# Change workspace directory to the folder containing this script file
cd "$(dirname "$0")"

# Colors for elegant terminal styling
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}=======================================================================${NC}"
echo -e "${GREEN}         __  __       ____  _                 _     ____  _____ ____   ${NC}"
echo -e "${GREEN}        |  \/  |    |  _ \| |               | |   |  _ \|  _  | ___|  ${NC}"
echo -e "${GREEN}        | \  / |__ _| |_) | |_  _  __ _ _ _| |_ _| |_) | | | | \___ \  ${NC}"
echo -e "${GREEN}        | |\/| / _\` |  __/| ' \| |/ _\` | ' \| ' \/ _\` |  __| |_| |___) | ${NC}"
echo -e "${GREEN}        |_|  |_\__,_|_|   |_||_|_|\__,_|_||_|_||_|\__,_|_|   |_____|____/  ${NC}"
echo -e "                                                                       "
echo -e "${CYAN}=======================================================================${NC}"
echo -e "          --- AUTOMATED DESKTOP INSTALLER & SERVICE LAUNCHER ---"
echo ""
echo "  This helper script automates the installation and run process for you."
echo "  You do not need to open a terminal or type any commands manually."
echo -e "${CYAN}=======================================================================${NC}"
echo -e "${CYAN}[STEP 1/3]${NC} Checking system prerequisites..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo -e "${RED}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${NC}"
    echo -e "${RED}ERROR: Node.js was not found on your system!${NC}"
    echo ""
    echo "MyShop Desk requires Node.js to be installed on your computer."
    echo ""
    echo "To fix this automatically:"
    echo "  1. Open your web browser and go to: https://nodejs.org"
    echo "  2. Download and install the 'LTS' (Recommended) version."
    echo "  3. Once finished, double-click this 'Install-and-Run.command' file again!"
    echo -e "${RED}!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!${NC}"
    echo ""
    read -p "Press [Enter] to exit..."
    exit 1
fi

NODE_VER=$(node -v)
echo -e "  [${GREEN}OK${NC}] Node.js is installed ($NODE_VER)"
echo ""

# Check if node_modules already exists
echo -e "${CYAN}[STEP 2/3]${NC} Preparing software libraries and packages..."
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${YELLOW}===================================================================${NC}"
    echo -e "  [!] First-time Setup: Installing app dependencies."
    echo "      This might take 1-2 minutes depending on your internet speed."
    echo "      Please keep this window open and do not close it..."
    echo -e "${YELLOW}===================================================================${NC}"
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Dependency installation failed. Please check your internet connection and try again.${NC}"
        read -p "Press [Enter] to exit..."
        exit 1
    fi
    echo ""
    echo -e "  [${GREEN}OK${NC}] Installation completed successfully!"
else
    echo -e "  [${GREEN}OK${NC}] Software libraries are already configured. Skipping install."
fi
echo ""

# Open Standalone Desktop App Mode (Borderless window) or Fallback to default browser
echo -e "${CYAN}[STEP 3/3]${NC} Launching MyShop Desk standalone desktop terminal..."
echo ""
echo -e "${GREEN}===================================================================${NC}"
echo -e "  [SUCCESS] Launching local service..."
echo "  The application is running 100% offline!"
echo "  To close MyShop Desk, simply close this terminal window."
echo -e "${GREEN}===================================================================${NC}"
echo ""

# Pause briefly to let the user read the success message
sleep 2

LAUNCHED=0

if [[ "$OSTYPE" == "darwin"* ]]; then
    # Try opening Google Chrome in borderless App mode on macOS
    if [ -d "/Applications/Google Chrome.app" ]; then
        open -n -a "Google Chrome" --args --app="http://localhost:3000"
        LAUNCHED=1
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Try opening Google Chrome in borderless App mode on Linux
    if command -v google-chrome &> /dev/null; then
        google-chrome --app="http://localhost:3000" &
        LAUNCHED=1
    elif command -v google-chrome-stable &> /dev/null; then
        google-chrome-stable --app="http://localhost:3000" &
        LAUNCHED=1
    fi
fi

if [ $LAUNCHED -eq 0 ]; then
    # Fallback to default browser if App Mode is not available
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:3000"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:3000"
        fi
    fi
fi

# Start the local web server
npm run dev
