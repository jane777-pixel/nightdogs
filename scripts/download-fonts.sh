#!/usr/bin/env bash
set -e

FONT_DIR="public/fonts"
CSS_FILE="public/fonts/fonts.css"
mkdir -p "$FONT_DIR"
> "$CSS_FILE"

# List your fonts and weights/styles here (only Google Fonts!)
declare -A FONTS
FONTS["ibm-plex-sans"]="100,200,300,400,500,600,700,100italic,200italic,300italic,400italic,500italic,600italic,700italic"
FONTS["ibm-plex-mono"]="100,200,300,400,500,600,700,100italic,200italic,300italic,400italic,500italic,600italic,700italic"
FONTS["jacquard-12"]="regular"
FONTS["bellefair"]="regular"
FONTS["montserrat"]="400,700"
FONTS["fira-sans"]="400,700"
FONTS["quicksand"]="400,700"
FONTS["eb-garamond"]="400,700"

for SLUG in "${!FONTS[@]}"; do
  WEIGHTS=${FONTS[$SLUG]}
  TMP=$(mktemp -d)
  curl -sL "https://gwfh.mranftl.com/api/fonts/$SLUG?download=zip&subsets=latin&formats=woff2&variants=$WEIGHTS" -o "$TMP/font.zip"
  unzip -q "$TMP/font.zip" -d "$TMP"
  # Move all woff2 files found anywhere in the zip
  find "$TMP" -name "*.woff2" -exec mv {} "$FONT_DIR/" \;
  # Append CSS, fix paths if CSS exists
  CSS_PATH=$(find "$TMP" -name "*.css" | head -n 1)
  if [ -f "$CSS_PATH" ]; then
    sed "s|url('\\(.*.woff2\\)')|url('/fonts/\\1')|g" "$CSS_PATH" >> "$CSS_FILE"
    echo "" >> "$CSS_FILE"
  else
    echo "Warning: No CSS file found for $SLUG, skipping CSS append."
  fi
  rm -rf "$TMP"
done

echo "All fonts downloaded to $FONT_DIR and CSS generated at $CSS_FILE"
