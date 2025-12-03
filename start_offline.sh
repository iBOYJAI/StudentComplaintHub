#!/bin/bash

echo "========================================"
echo "Student Complaint Hub - Offline Mode"
echo "========================================"
echo ""

cd backend

echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed or not in PATH"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo ""
echo "Auto-configuring database..."
python3 auto_detect_db.py

echo ""
echo "Starting server..."
echo ""
python3 main.py

