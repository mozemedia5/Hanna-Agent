# Connector Icon Research

**Snapshot:** 14 September 2026, GMT+3.

## Inventory findings

The repository's `manus_connector_inventory.txt` declares 390 connectors and contains exactly 390 connector records after excluding the non-record header. There are 388 unique connector names because `Apify` and `Typeform` each appear twice as separate records. The existing repository contains only a partial `ProviderIcons.tsx` component and no dedicated connector icon asset directory.

## Icon-source decision

Use the current `simple-icons` package already declared by the repository, resolved during this task as version `15.22.0`. Simple Icons describes itself as a CC0 project and publishes brand SVGs through its official site and GitHub repository. The generated assets will preserve the Simple Icons source title, slug, hex color, package version, and source URL in a manifest. Where a current Simple Icons mark is not available, the implementation will use the provider's own current favicon or official logo endpoint discovered from the connector's canonical URL, and record that URL and retrieval date. No AI-generated or invented brand marks will be used.

## Source references

- Simple Icons official site: https://simpleicons.org/
- Simple Icons repository: https://github.com/simple-icons/simple-icons
- Simple Icons package: https://www.npmjs.com/package/simple-icons

## Completeness policy

Every one of the 390 connector records gets a manifest entry and an icon path. Duplicate provider records share the same provider icon file. The asset directory may contain one normalized SVG per unique provider name; the manifest remains record-complete.
