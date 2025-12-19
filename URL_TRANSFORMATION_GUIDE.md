# URL Transformation System

## Overview

The URL Transformation system allows you to automatically transform URLs through proxy services (like Freedium for Medium articles) before passing them to ReadItLater. This enables you to bypass paywalls and access reader-friendly versions of articles.

## Features

- **Automatic URL Transformation**: URLs are transformed based on configurable rules before being processed
- **Proxy Health Checking**: System checks if proxy services are available before attempting transformation
- **Smart Caching**: Health check results are cached to avoid repeated requests
- **Metadata Preservation**: Original URLs are preserved in frontmatter alongside proxied URLs
- **Batch Processing**: Handles multiple URLs efficiently, skipping articles when proxies are down
- **Extensible**: Easy to add custom proxy services

## Configuration

### Accessing Settings

1. Open Obsidian Settings
2. Navigate to the "URL Transformation Settings" tab
3. Configure your transformation rules

### Pre-configured Proxy Services

The plugin comes with three pre-configured proxy services (all disabled by default):

1. **Medium via Freedium** - Transforms Medium articles through Freedium mirror
   - Matches: `*.medium.com`, `medium.com`
   - Template: `https://freedium-mirror.cfd/{url}`
   
2. **12ft Ladder** - General paywall bypass service
   - Matches: All URLs (`*`)
   - Template: `https://12ft.io/{url}`
   
3. **Archive.today** - Archive service
   - Matches: All URLs (`*`)
   - Template: `https://archive.is/{url}`

### Settings Options

#### Proxy Health Check
- **Cache TTL**: How long to cache proxy health check results (1-30 minutes)
- **Timeout**: Maximum time to wait for proxy health check (1-10 seconds)
- **Test All Proxies**: Manually test all enabled proxy services

#### Managing Rules

Each transformation rule has:
- **Name**: Display name for the rule
- **Enabled/Disabled**: Toggle to activate/deactivate
- **Matchers**: Domain patterns to match (supports wildcards)
- **Type**: Transformation type (Prefix or Path Extraction)
- **Template**: URL template with placeholders
- **Priority**: Higher priority rules are applied first

### Adding Custom Rules

1. Click "Add Rule" in the settings
2. Fill in the form:
   - **Rule name**: e.g., "NYTimes via Archive"
   - **URL matchers**: One per line, e.g.:
     ```
     *.nytimes.com
     nytimes.com
     ```
   - **Transformation type**: Choose "Prefix" or "Path Extraction"
   - **Template**: e.g., `https://archive.is/{url}`
   - **Priority**: Higher numbers = higher priority (default: 100)
3. Click "Save"

### URL Matcher Patterns

- `*` - Matches all URLs (use with low priority)
- `example.com` - Matches exact domain
- `*.example.com` - Matches all subdomains (e.g., `blog.example.com`, `news.example.com`)

### Template Placeholders

- `{url}` - Full original URL
- `{domain}` - Domain only (for path extraction)
- `{path}` - Path only (for path extraction)

## How It Works

### Transformation Flow

1. **URL Extraction**: Plugin extracts URL from file frontmatter or content
2. **Rule Matching**: Finds the highest priority enabled rule that matches the URL
3. **Health Check**: Checks if the proxy service is available (cached for TTL duration)
4. **Transformation**: If proxy is healthy, transforms the URL using the template
5. **Processing**: Passes transformed URL to ReadItLater
6. **Metadata Update**: Stores both original and proxied URLs in frontmatter

### Proxy Health Checking

The system performs two-level health checks:

1. **Primary**: Transforms a test URL (`https://example.com/test`) and checks if proxy responds
2. **Fallback**: If primary fails, checks the proxy root URL directly

Results are cached in-memory for the configured TTL (default: 5 minutes).

### Batch Processing Behavior

When processing multiple URLs:
- If a proxy is detected as down, all subsequent URLs using that proxy are skipped
- Articles using different proxies (or no proxy) continue processing
- Files are NOT marked as processed if skipped due to proxy issues
- Summary shows how many URLs were processed vs. skipped

## Frontmatter Metadata

When a URL is transformed, the plugin adds metadata to the file:

```yaml
---
original_url: https://medium.com/@author/article
proxied_url: https://freedium-mirror.cfd/https://medium.com/@author/article
proxy_rule: "Medium via Freedium"
---
```

## Configuration File

Settings are stored in `.obsidian/url-transformations.json`:

```json
{
  "rules": [
    {
      "id": "freedium-medium",
      "name": "Medium via Freedium",
      "enabled": true,
      "matchers": ["*.medium.com", "medium.com"],
      "transformationType": "prefix",
      "template": "https://freedium-mirror.cfd/{url}",
      "priority": 100
    }
  ],
  "proxyHealthCacheTtlMinutes": 5,
  "proxyHealthTimeoutMs": 5000
}
```

## Usage Examples

### Example 1: Enable Freedium for Medium

1. Go to Settings → URL Transformation Settings
2. Find "Medium via Freedium" in the rules list
3. Toggle it to **Enabled**
4. Process any file with a Medium URL - it will automatically use Freedium

### Example 2: Add Custom Domain to Existing Rule

1. Click "Edit" on the "Medium via Freedium" rule
2. Add your custom Medium domain to the matchers:
   ```
   *.medium.com
   medium.com
   blog.mycompany.com
   ```
3. Click "Save"

### Example 3: Create Rule for Multiple Sources → One Proxy

Many Medium-like platforms can use the same proxy:

1. Click "Add Rule"
2. Name: "Substack via 12ft"
3. Matchers:
   ```
   *.substack.com
   substack.com
   ```
4. Type: Prefix
5. Template: `https://12ft.io/{url}`
6. Priority: 100

## Troubleshooting

### URLs Not Being Transformed

- Check if the rule is **enabled**
- Verify the URL matcher pattern matches your URL
- Check console logs for transformation details

### Proxy Health Check Failing

- Test manually by clicking "Test All Proxies"
- Increase the timeout in settings
- Verify the proxy service is actually accessible from your network

### Articles Being Skipped

- Check Obsidian notices for proxy unavailability messages
- Files are not marked as processed when skipped - you can retry later
- Clear the health check cache by restarting Obsidian

### Multiple Rules Matching

- The **highest priority** enabled rule is used
- Adjust priority values to control which rule applies
- Default rules have priorities: Freedium (100), Archive (20), 12ft (10)

## Best Practices

1. **Start with one rule**: Enable only the proxy you need most
2. **Test before batch processing**: Use "Test All Proxies" to verify connectivity
3. **Use specific matchers**: Avoid using `*` matcher unless necessary
4. **Set appropriate priorities**: Give specific rules higher priority than general ones
5. **Monitor the cache TTL**: Shorter TTL = more checks, longer TTL = faster but less responsive to outages

## Technical Details

### Architecture

```
src/
├── url-transformer/
│   ├── transformation-types.ts      # TypeScript interfaces
│   ├── default-templates.ts         # Pre-configured templates
│   ├── url-transformer.ts           # Core transformation logic
│   └── transformation-config.ts     # Config management
├── settings/
│   └── url-transformer-settings.ts  # Obsidian settings UI
└── parse-metadata-link.ts           # Integration point
```

### Performance Considerations

- Health checks use HEAD requests when possible (faster than GET)
- Results are cached in-memory (session-scoped)
- Batch processing checks each proxy only once per batch
- Timeout prevents hanging on slow/dead proxies

## Future Enhancements (Stubbed)

The following features are planned but not yet implemented:

- **Rate Limiting**: Configurable delays between requests
- **URL Validation**: Pre-validate transformed URLs before processing
- **Persistent Cache**: Save health check results across sessions
- **Proxy Rotation**: Automatically try alternative proxies if one fails
