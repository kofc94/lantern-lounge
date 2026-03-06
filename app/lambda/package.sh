#!/bin/bash

# Package Lambda functions into a zip file for deployment

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Remove old zip if exists
rm -f calendar-api.zip

# Create zip with all Python files
zip calendar-api.zip get_items.py create_item.py update_item.py delete_item.py

echo "Lambda functions packaged successfully: calendar-api.zip"
