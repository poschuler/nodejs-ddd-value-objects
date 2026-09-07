#!/usr/bin/env bash

set -euo pipefail

IMAGE="structurizr/structurizr:2026.06.28-playwright"

PINNED_DATE="2030-01-01T00:00:00Z"

if [[ ! -f architecture/workspace.json ]]; then
	echo "error: run this from the repository root ('pnpm run diagrams')." >&2
	exit 1
fi

if ! command -v jq >/dev/null; then
	echo "error: jq is required, and so is the clean filter that also needs it:" >&2
	echo "        git config filter.structurizr.clean \"jq -S 'del(.lastModifiedDate)'\"" >&2
	exit 1
fi

mkdir -p architecture/diagrams/light architecture/diagrams/dark

STAGED="$(mktemp -d)"
trap 'rm -rf "${STAGED}"' EXIT
jq --arg d "${PINNED_DATE}" '.lastModifiedDate = $d' architecture/workspace.json >"${STAGED}/workspace.json"

echo "==> Emptying architecture/diagrams"
rm -f architecture/diagrams/light/*.svg
rm -f architecture/diagrams/dark/*.svg

for MODE in light dark; do
	echo "==> Exporting every view, ${MODE}"
	docker run --rm -u "$(id -u):$(id -g)" \
		-v "${STAGED}:/ws:ro" \
		-v "${PWD}/architecture/diagrams/${MODE}:/out" \
		"${IMAGE}" \
		export -w /ws/workspace.json -f svg -mode "${MODE}" -o /out
done

echo
echo "==> $(ls architecture/diagrams/light/*.svg architecture/diagrams/dark/*.svg | wc -l) files in architecture/diagrams"
echo "==> These are committed and nothing checks them; commit what changed."
