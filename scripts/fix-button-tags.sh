#!/bin/bash

# Remove backup directories first
rm -rf backup-*

# Fix Button closing tags with a more comprehensive regex
find . -type f -name "*.ts*" -not -path "./node_modules/*" -not -path "./.next/*" -exec perl -pi -e 's/<Button([^>]*)>([^<]*)<\/button>/<Button$1>$2<\/Button>/g' {} \;

# Fix multiline Button components
find . -type f -name "*.ts*" -not -path "./node_modules/*" -not -path "./.next/*" -exec perl -pi -0 -e 's/<Button([^>]*)>(.*?)<\/button>/<Button$1>$2<\/Button>/gs' {} \;
