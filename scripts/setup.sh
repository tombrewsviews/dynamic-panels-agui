#!/usr/bin/env bash
# Installs the dynamic-panels AG-UI kit into a Next.js app.
#
#   scripts/setup.sh <app-dir>                 # no package.json → create a new app with the full kit
#
# Existing app (package.json present): interface layer only, in two steps.
#   scripts/setup.sh <app-dir> --plan          # changes nothing; reports what would be
#                                              # added, files that already exist, missing
#                                              # packages and blockers. Show it to the user.
#   scripts/setup.sh <app-dir>                 # adds the UI files (only if no package is missing)
#   scripts/setup.sh <app-dir> --install-deps  # same, after installing the missing UI packages.
#                                              # Use only once the user has agreed to them.
#
# Existing app: adds components/ui, lib/genui, components/workspace,
# lib/workspace, hooks/use-mobile, lib/utils, library.ts and components.json,
# and never overwrites an existing file. app/ (pages, layouts, globals.css)
# is merged by the agent afterwards, not by this script. API routes, server
# code, env files, next/postcss/ts config and npm scripts are never touched;
# packages are only ever added, never upgraded or removed.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$SKILL_DIR/template"
USAGE="usage: setup.sh <app-dir> [--plan | --install-deps]"
APP="${1:?$USAGE}"
MODE="apply"
case "${2:-}" in
  "") ;;
  --plan) MODE="plan" ;;
  --install-deps) MODE="install" ;;
  *) echo "$USAGE" >&2; exit 1 ;;
esac
[ "$#" -le 2 ] || { echo "$USAGE" >&2; exit 1; }

NEXT_VERSION="16.2.6"

UI_DEPS=(
  "@openuidev/react-lang@0.3.0" "@openuidev/lang-core@0.3.0"
  "@openuidev/react-ui@0.16.3" "@openuidev/react-headless@0.16.3"
  "radix-ui@^1.4.3" "@base-ui/react@^1.8.0" "@shadcn/react@^0.3.1"
  "class-variance-authority@^0.7.1" "clsx@^2.1.1" "tailwind-merge@^3.3.0"
  "lucide-react@^0.575.0" "zod@^4.0.0" "zustand@^4.5.5" "sonner@^2.0.7" "next-themes@^0.4.6"
  "recharts@^3.8.0" "vaul@^1.1.2" "cmdk@^1.1.1" "react-markdown@^10.1.0" "remark-gfm@^4.0.1"
  "react-resizable-panels@^4.14.2" "react-hook-form@^7.89.0" "react-day-picker@^10.0.2"
  "date-fns@^4.1.0" "input-otp@^1.4.2" "embla-carousel-react@^8.6.0" "@tanstack/react-table@^8.21.3"
)
SERVER_DEPS=("openai@^6.22.0")
DEV_DEPS=("@openuidev/cli@0.4.1")

# ─── Existing app: interface layer only ──────────────────────────────────────
if [ -f "$APP/package.json" ]; then
  APP="$(cd "$APP" && pwd)"
  cd "$APP"

  # Blockers: things the kit needs that only the user can approve (config).
  blockers=()
  while IFS= read -r line; do [ -n "$line" ] && blockers+=("$line"); done < <(node -e '
const fs = require("fs");
const p = require("./package.json");
const deps = { ...p.dependencies, ...p.devDependencies };
if (!deps.next) console.log("Not a Next.js app: porting the kit to another framework is a manual job.");
const tw = String(deps.tailwindcss || "").replace(/^[^0-9]*/, "");
if (!tw.startsWith("4")) console.log("Tailwind v4 is required (found " + (deps.tailwindcss || "none") + "): upgrading it changes build config.");
const ts = fs.existsSync("tsconfig.json") ? fs.readFileSync("tsconfig.json", "utf8") : "";
if (!/"@\/\*"/.test(ts)) console.log("tsconfig.json needs a \"@/*\" path alias: adding one changes config.");
')

  missing=()
  while IFS= read -r line; do [ -n "$line" ] && missing+=("$line"); done < <(node -e '
const p = require("./package.json");
const have = { ...p.dependencies, ...p.devDependencies };
for (const spec of process.argv.slice(1)) {
  const name = spec.slice(0, spec.lastIndexOf("@"));
  if (!have[name]) console.log(spec);
}' "${UI_DEPS[@]}")

  # src/ layout or root layout; "@/*" points at whichever the app uses.
  if [ -d "$APP/src" ]; then BASE="$APP/src"; else BASE="$APP"; fi
  UI_PATHS=(
    src/components/ui src/lib/genui src/components/workspace src/lib/workspace
    src/hooks/use-mobile.ts src/lib/utils.ts src/library.ts
  )
  to_add=()
  collisions=()
  for p in "${UI_PATHS[@]}"; do
    while IFS= read -r -d '' f; do
      dest="$BASE/${f#"$TEMPLATE"/src/}"
      if [ ! -e "$dest" ]; then to_add+=("$f")
      elif ! cmp -s "$f" "$dest"; then collisions+=("${dest#"$APP"/}"); fi
    done < <(find "$TEMPLATE/$p" -type f ! -name ".DS_Store" -print0)
  done

  report() {
    echo "Files to add: ${#to_add[@]} (new files only)"
    if [ "${#collisions[@]}" -gt 0 ]; then
      echo "Already exist and differ (never overwritten; the agent extends them only with consent):"
      printf '  %s\n' "${collisions[@]}"
    fi
    if [ "${#missing[@]}" -gt 0 ]; then
      echo "Missing UI packages (install only with the user's consent):"
      printf '  %s\n' "${missing[@]}"
    else
      echo "Missing UI packages: none"
    fi
    if [ "${#blockers[@]}" -gt 0 ]; then
      echo "Blockers (need the user's decision before anything is installed):"
      printf '  %s\n' "${blockers[@]}"
    fi
    echo "Merged afterwards by the agent: app/ global CSS, root or route layout providers, the page that mounts the shell."
    echo "Never touched: API routes, server code, data layer, auth, env files, next/postcss/ts config, npm scripts."
  }

  if [ "$MODE" = plan ]; then
    echo "→ Plan for $APP (no changes made)"
    report
    exit 0
  fi
  if [ "${#blockers[@]}" -gt 0 ]; then
    echo "✗ Stopped: resolve these with the user first:" >&2
    printf '  %s\n' "${blockers[@]}" >&2
    exit 1
  fi
  if [ "${#missing[@]}" -gt 0 ]; then
    if [ "$MODE" != install ]; then
      echo "✗ Stopped: the kit needs UI packages the app doesn't have. Ask the user, then re-run with --install-deps:" >&2
      printf '  %s\n' "${missing[@]}" >&2
      exit 1
    fi
    echo "→ Installing missing UI packages (existing versions are left as they are)"
    npm install --save --no-audit --no-fund "${missing[@]}" >/dev/null
    printf '  added %s\n' "${missing[@]}"
  fi

  echo "→ Adding interface files"
  for f in ${to_add[@]+"${to_add[@]}"}; do
    dest="$BASE/${f#"$TEMPLATE"/src/}"
    mkdir -p "$(dirname "$dest")"
    cp "$f" "$dest"
  done
  added=${#to_add[@]}
  if [ ! -e "$APP/components.json" ]; then
    css="src/app/globals.css"; [ "$BASE" = "$APP" ] && css="app/globals.css"
    sed "s|src/app/globals.css|$css|" "$TEMPLATE/components.json" > "$APP/components.json"
    added=$((added + 1))
  fi
  echo "  $added files added"
  if [ "${#collisions[@]}" -gt 0 ]; then
    echo "⚠ Left untouched (compare with $TEMPLATE/src/<same path>):"
    printf '    %s\n' "${collisions[@]}"
  fi
  echo "Next: merge app/ styles, providers and the mounting page (SKILL.md, 'Existing project')."
  echo
  echo "→ Type check (reported, not fatal: the app may have errors of its own)"
  if out="$(npx tsc --noEmit 2>&1)"; then
    echo "  clean"
  else
    echo "⚠ Type errors per file (fix the ones in kit files or caused by the files left untouched):"
    printf '%s\n' "$out" | grep -oE '^[^( ]+\.tsx?' | sort | uniq -c | sort -rn | head -20
    echo "  Full list: npx tsc --noEmit"
  fi
  exit 0
fi

# ─── New app: full kit ───────────────────────────────────────────────────────
[ "$MODE" = apply ] || { echo "$2 applies to existing apps only; $APP has no package.json." >&2; exit 1; }
echo "→ Creating Next.js $NEXT_VERSION app in $APP"
npx --yes "create-next-app@$NEXT_VERSION" "$APP" --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --yes --disable-git >/dev/null
APP="$(cd "$APP" && pwd)"
cd "$APP"

echo "→ Installing dependencies"
npm install --save --no-audit --no-fund "${UI_DEPS[@]}" "${SERVER_DEPS[@]}" >/dev/null
npm install --save-dev --no-audit --no-fund "${DEV_DEPS[@]}" >/dev/null

echo "→ Copying the kit (replaces the create-next-app boilerplate)"
copied=0
while IFS= read -r -d '' f; do
  dest="$APP/${f#"$TEMPLATE"/}"
  mkdir -p "$(dirname "$dest")"
  cp "$f" "$dest"
  copied=$((copied + 1))
done < <(find "$TEMPLATE" -type f ! -name ".DS_Store" -print0)
echo "  $copied files copied"

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
