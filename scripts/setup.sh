#!/usr/bin/env bash
# Installs the dynamic-panels AG-UI kit into a Next.js app.
#
#   scripts/setup.sh <app-dir>            # creates the Next.js app if <app-dir> has no package.json
#   scripts/setup.sh <app-dir> --force    # overwrite existing files instead of keeping *.bak copies
#
# Result: shadcn/ui (62 components) in src/components/ui, the OpenUI genui
# library in src/lib/genui, the panel engine in src/components/workspace +
# src/lib/workspace, tokens in src/app/globals.css, the /api/chat agent route,
# and the generated OpenUI spec. Ends with a type check.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$SKILL_DIR/template"
APP="${1:?usage: setup.sh <app-dir> [--force]}"
shift || true
FORCE=0
for a in "$@"; do
  case "$a" in
    --force) FORCE=1 ;;
    *) echo "unknown flag: $a" >&2; exit 1 ;;
  esac
done

NEXT_VERSION="16.2.6"

if [ ! -f "$APP/package.json" ]; then
  echo "→ Creating Next.js $NEXT_VERSION app in $APP"
  npx --yes "create-next-app@$NEXT_VERSION" "$APP" --ts --tailwind --eslint --app --src-dir \
    --import-alias "@/*" --use-npm --yes --disable-git >/dev/null
fi
APP="$(cd "$APP" && pwd)"
cd "$APP"

echo "→ Installing dependencies"
npm install --save --no-audit --no-fund \
  "@openuidev/react-lang@0.3.0" "@openuidev/lang-core@0.3.0" \
  "@openuidev/react-ui@0.16.3" "@openuidev/react-headless@0.16.3" \
  "radix-ui@^1.4.3" "@base-ui/react@^1.8.0" "@shadcn/react@^0.3.1" \
  "class-variance-authority@^0.7.1" "clsx@^2.1.1" "tailwind-merge@^3.3.0" \
  "lucide-react@^0.575.0" "zod@^4.0.0" "zustand@^4.5.5" "sonner@^2.0.7" "next-themes@^0.4.6" \
  "recharts@^3.8.0" "vaul@^1.1.2" "cmdk@^1.1.1" "react-markdown@^10.1.0" "remark-gfm@^4.0.1" \
  "react-resizable-panels@^4.14.2" "react-hook-form@^7.89.0" "react-day-picker@^10.0.2" \
  "date-fns@^4.1.0" "input-otp@^1.4.2" "embla-carousel-react@^8.6.0" "@tanstack/react-table@^8.21.3" \
  "openai@^6.22.0" >/dev/null
npm install --save-dev --no-audit --no-fund "@openuidev/cli@0.4.1" >/dev/null

echo "→ Copying the kit"
copied=0
kept=0
while IFS= read -r -d '' f; do
  rel="${f#"$TEMPLATE"/}"
  dest="$APP/$rel"
  mkdir -p "$(dirname "$dest")"
  if [ -f "$dest" ] && [ "$FORCE" = 0 ] && ! cmp -s "$f" "$dest"; then
    cp "$dest" "$dest.bak"
    kept=$((kept + 1))
  fi
  cp "$f" "$dest"
  copied=$((copied + 1))
done < <(find "$TEMPLATE" -type f ! -name ".DS_Store" -print0)
echo "  $copied files copied, $kept differing files saved as *.bak"

echo "→ Adding npm scripts"
node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.scripts = {
  ...p.scripts,
  generate: "openui generate src/library.ts --spec --out src/generated/spec.json",
  predev: "npm run generate",
  prebuild: "npm run generate",
};
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
'

echo "→ Generating the OpenUI spec"
npm run generate >/dev/null

echo "→ Type check"
npx tsc --noEmit
echo "✓ Done. npm run dev, then open http://localhost:3000"
