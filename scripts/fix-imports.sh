#!/bin/bash

# Make script exit on error
set -e

# Default to dry run mode
DRY_RUN=false
VERBOSE=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true ;;
        --verbose) VERBOSE=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "Starting import fixes..."
if [ "$DRY_RUN" = true ]; then
    echo "Running in dry-run mode. No changes will be made."
fi

# Create backup directory with timestamp
backup_dir="./import-fixes-backup-$(date +%Y%m%d_%H%M%S)"
if [ "$DRY_RUN" = false ]; then
    mkdir -p "$backup_dir"
    echo "Created backup directory: $backup_dir"
fi

# Function to log verbose messages
log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo "$1"
    fi
}

# Function to process a single file
fix_imports() {
    local file=$1
    echo "Processing $file..."
    
    # Create backup
    if [ "$DRY_RUN" = false ]; then
        local relative_path=${file#./}
        local backup_path="$backup_dir/$relative_path"
        mkdir -p "$(dirname "$backup_path")"
        cp "$file" "$backup_path"
        log_verbose "Created backup: $backup_path"
    fi
    
    # Create a temporary file
    local temp_file
    temp_file=$(mktemp)
    
    # Fix common import patterns
    sed -E '
        # Handle both single and double quotes
        
        # Remove @/app prefix from path aliases
        s/from (['\''"])@\/app\/([^'\''"]+)\1/from \1@\/\2\1/g;
        
        # Fix component imports case sensitivity
        s/from (['\''"])@\/components\/ui\/([A-Z][a-zA-Z]+)\1/from \1@\/components\/ui\/\L\2\1/g;
        
        # Fix test helper imports
        s/from (['\''"])\.\.\/\.\.\/\.\.\/helpers\/([^'\''"]+)\1/from \1@\/test\/\2\1/g;
        s/from (['\''"])@\/test\/helpers\/([^'\''"]+)\1/from \1@\/test\/\2\1/g;
        
        # Fix relative auth action imports to use relative paths
        s/from (['\''"])@\/app\/\(auth\)\/actions\1/from \1\.\.\/\.\.\/\(auth\)\/actions\1/g;
        
        # Fix React imports
        s/import \* as React from (['\''"])react\1/import React from \1react\1/g;
        
        # Fix database type imports
        s/from (['\''"])@\/types\/supabase\/Database\1/from \1@\/types\/supabase\/database\1/g;
        s/from (['\''"])@\/types\/database\1/from \1@\/types\/supabase\/database\1/g;
        
        # Fix calendar component imports
        s/from (['\''"])@\/components\/calendar\/([^'\''"]+)\1/from \1@\/components\/ui\/calendar\1/g;
        
        # Fix auth imports
        s/from (['\''"])@\/providers\/supabase-provider\1/from \1@\/lib\/supabase\/client\1/g;
        s/from (['\''"])@\/app\/lib\/auth\/([^'\''"]+)\1/from \1@\/lib\/auth\/\2\1/g;
        
        # Fix theme provider imports
        s/from (['\''"])@\/providers\/theme-provider\1/from \1@\/components\/ui\/theme-provider\1/g;
        
        # Fix scheduling types
        s/from (['\''"])@\/types\/scheduling\1/from \1@\/types\/models\/scheduling\1/g;
        s/from (['\''"])@\/app\/types\/scheduling\1/from \1@\/types\/models\/scheduling\1/g;
        
        # Fix time-off types
        s/from (['\''"])@\/types\/time-off\1/from \1@\/types\/models\/time-off\1/g;
        s/from (['\''"])@\/app\/types\/time-off\1/from \1@\/types\/models\/time-off\1/g;
        
        # Fix lib imports
        s/from (['\''"])@\/lib\/scheduling\/([^'\''"]+)\1/from \1@\/lib\/scheduling\/\2\1/g;
        s/from (['\''"])@\/app\/lib\/scheduling\/([^'\''"]+)\1/from \1@\/lib\/scheduling\/\2\1/g;
        
        # Fix test helper imports
        s/from (['\''"])@\/test\/helpers\/([^'\''"]+)\1/from \1@\/test\/\2\1/g;
        
        # Fix utils imports
        s/from (['\''"])@\/lib\/utils\1/from \1@\/lib\/utils\/index\1/g;
        s/from (['\''"])@\/app\/lib\/utils\1/from \1@\/lib\/utils\/index\1/g;
        
        # Fix supabase service/client/server imports
        s/from (['\''"])@\/lib\/supabase\/service\1/from \1@\/lib\/supabase\/server\1/g;
        s/from (['\''"])@\/app\/lib\/supabase\/([^'\''"]+)\1/from \1@\/lib\/supabase\/\2\1/g;
        
        # Fix test utils imports
        s/from (['\''"])@\/test\/utils\/test-utils\1/from \1@\/test\/test-utils\1/g;
        
        # Fix mock data imports
        s/from (['\''"])@\/test\/mocks\/data\1/from \1@\/test\/mock-data\1/g;
        
        # Fix middleware imports
        s/from (['\''"])@\/middleware\/([^'\''"]+)\1/from \1@\/lib\/middleware\/\2\1/g;
        s/from (['\''"])@\/app\/middleware\/([^'\''"]+)\1/from \1@\/lib\/middleware\/\2\1/g;
        
        # Fix validation imports
        s/from (['\''"])@\/app\/lib\/validations\/([^'\''"]+)\1/from \1@\/lib\/validations\/\2\1/g;
        
        # Fix hooks imports
        s/from (['\''"])@\/app\/hooks\/([^'\''"]+)\1/from \1@\/lib\/hooks\/\2\1/g;
        
        # Fix type imports
        s/from (['\''"])@\/app\/types\/([^'\''"]+)\1/from \1@\/types\/\2\1/g;
        
        # Fix component imports
        s/from (['\''"])@\/app\/components\/([^'\''"]+)\1/from \1@\/components\/\2\1/g;
        
        # Fix provider imports
        s/from (['\''"])@\/app\/providers\/([^'\''"]+)\1/from \1@\/providers\/\2\1/g;
        
        # Fix action imports
        s/from (['\''"])@\/app\/actions\/([^'\''"]+)\1/from \1@\/actions\/\2\1/g;
        
        # Fix API imports
        s/from (['\''"])@\/app\/api\/([^'\''"]+)\1/from \1@\/api\/\2\1/g;

        # Fix relative imports in tests to use aliases
        s/from (['\''"])\.\.\/\.\.\/\.\.\/\.\.\/lib\/([^'\''"]+)\1/from \1@\/lib\/\2\1/g;
        s/from (['\''"])\.\.\/\.\.\/\.\.\/\.\.\/components\/([^'\''"]+)\1/from \1@\/components\/\2\1/g;
        s/from (['\''"])\.\.\/\.\.\/\.\.\/\.\.\/types\/([^'\''"]+)\1/from \1@\/types\/\2\1/g;
        
        # Fix shadcn component imports
        s/from (['\''"])@\/components\/ui\/([A-Z][^'\''"]+)\1/from \1@\/components\/ui\/\L\2\1/g;
        
        # Fix middleware imports in tests
        s/from (['\''"])@\/app\/api\/admin\/middleware\1/from \1@\/lib\/middleware\/admin\1/g;
        
    ' "$file" > "$temp_file"
    
    # Only update if changes were made and not in dry run mode
    if ! cmp -s "$file" "$temp_file"; then
        if [ "$DRY_RUN" = false ]; then
            mv "$temp_file" "$file"
            echo "Fixed imports in $file"
        else
            echo "Would fix imports in $file (dry run)"
            if [ "$VERBOSE" = true ]; then
                echo "Differences:"
                diff "$file" "$temp_file" || true
            fi
        fi
    else
        echo "No changes needed in $file"
    fi
    rm -f "$temp_file"
}

# Track statistics
total_files=0
fixed_files=0

# Find all TypeScript/JavaScript files excluding node_modules, .next, and build directories
while IFS= read -r -d '' file; do
    ((total_files++))
    if fix_imports "$file"; then
        ((fixed_files++))
    fi
done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/build/*" \
    -not -path "*/dist/*" \
    -not -path "*/import-fixes-backup-*/*" \
    -print0)

echo "Import fixes completed!"
echo "Total files processed: $total_files"
echo "Files with fixes: $fixed_files"

if [ "$DRY_RUN" = false ]; then
    echo "Backup created in $backup_dir"
    echo "To revert changes, run: cp -r $backup_dir/* ./"
else
    echo "Dry run completed. No changes were made."
fi
