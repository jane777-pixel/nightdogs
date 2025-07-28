#!/bin/bash
# Move all blog posts to content/blog/{author}/{YYYY-MM-DD}/{slug}/index.md

cd content/blog

find . -type f -name "*.md" | while read file; do
  # Extract frontmatter fields
  author=$(grep '^author:' "$file" | head -1 | awk '{print $2}')
  date=$(grep '^date:' "$file" | head -1 | awk '{print $2}')
  slug=$(grep '^permalink:' "$file" | head -1 | sed -E 's|.*/([^/]+)/$|\1|')
  # Fallback: use folder name if no slug
  if [ -z "$slug" ]; then
    slug=$(basename "$(dirname "$file")")
  fi
  # Format date
  ymd=$(echo "$date" | cut -d'T' -f1)
  # Build new path
  newdir="$author/$ymd/$slug"
  mkdir -p "$newdir"
  mv "$file" "$newdir/index.md"
done
