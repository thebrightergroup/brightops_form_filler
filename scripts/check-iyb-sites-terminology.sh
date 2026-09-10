#!/usr/bin/env bash
set -euo pipefail

legacy_term="$(printf '%s%s' 'Bright' 'Sites')"
if git grep -n -i -- "$legacy_term" -- ':!scripts/check-iyb-sites-terminology.sh'; then
  printf '%s\n' "Prohibited legacy website terminology detected. Use IYB: Sites or iyb-sites."
  exit 1
fi
printf '%s\n' "IYB: Sites terminology check passed."
