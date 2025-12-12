# Obsidian Metadata Link Parser - Project Summary

## Overview

This project provides a TypeScript script/plugin that integrates with Obsidian's Markdown API and the ReadItLater plugin to extract URLs from markdown files and automatically fetch article content. It supports two modes: creating new notes with article content, or appending the content to the existing file.

## Created Files

### Core Implementation
- **`parse-metadata-link.ts`** - Main parser class with all functionality
  - Extracts URLs from frontmatter or markdown content
  - Integrates with ReadItLater API
  - Supports single file and batch processing
- **`ReadItLaterStubs.ts`** - Stub implementations and automatic detection
  - Provides standalone NoteService and ReadItLaterApi
  - Auto-detects and uses real ReadItLater plugin if available
  - Falls back to built-in implementation if not

### Plugin Integration
- **`plugin-main.ts`** - Example Obsidian plugin implementation
  - Shows how to register commands
  - Demonstrates ribbon icon integration
  - Provides template for accessing ReadItLater's NoteService
  - **Context menu integration** for folders and files
    - Right-click folders to batch process
    - Right-click files to process individually

### Configuration Files
- **`package.json`** - Node.js dependencies and build scripts
- **`tsconfig.json`** - TypeScript compiler configuration
- **`manifest.json`** - Obsidian plugin manifest
- **`.gitignore`** - Git ignore rules for node_modules and build artifacts

### Documentation Files
- **`README.md`** - Comprehensive usage guide
- **`USAGE_EXAMPLES.md`** - Practical usage scenarios
- **`PROJECT_SUMMARY.md`** - This file, project overview
- **`MODES_COMPARISON.md`** - Detailed comparison of create vs append modes
- **`CONTEXT_MENU_GUIDE.md`** - Guide to using context menu features
- **`READITLATER_INTEGRATION.md`** - How ReadItLater integration works
- **`STUBS_EXPLAINED.md`** - Understanding the stub system
- **`QUICK_START.md`** - Quick start guide
- **`PROCESSED_TRACKING.md`** - Guide to processed file tracking

## Key Features

1. **Multiple URL Extraction Methods**
   - Frontmatter fields: `url`, `link`, `source`, `web_url`, `article_url`
   - Markdown links: `[text](url)`
   - Plain URLs in content

2. **Two Processing Modes**
   - **Create New Note**: Uses ReadItLater plugin to create a separate note
   - **Append to File**: Fetches content and appends it to the existing file

3. **Processing Options**
   - Single file processing (both modes)
   - Folder batch processing (both modes)
   - URL list batch processing (creates new notes)
   - **Smart skip processing** - Tracks and skips already-processed files in batch operations

4. **User Experience**
   - Obsidian command palette integration
   - **Context menu integration** (right-click on folders/files)
   - User-friendly notifications
   - Detailed error logging
   - Console debugging support
   - Separator and formatting for appended content
   - Ribbon icon for quick access

5. **ReadItLater Integration**
   - Uses `ReadItLaterApi.processContent()` for single URLs (new note mode)
   - Uses `ReadItLaterApi.processContentBatch()` for multiple URLs
   - Direct HTTP fetching with HTML parsing for append mode
   - Requires `NoteService` instance for article formatting

## Architecture

```
MetadataLinkParser
├── extractUrlFromFrontmatter()      - Parse YAML frontmatter
├── extractUrlFromContent()          - Parse markdown/plain URLs
├── fetchArticleContent()            - Fetch content via HTTP
├── extractTextFromHtml()            - Strip HTML tags
│
├── processFile()                    - Single file handler (new note)
├── processFileAndAppend()           - Single file handler (append)
├── processFolderFiles()             - Batch folder handler (new notes)
├── processFolderFilesAndAppend()    - Batch folder handler (append)
├── processActiveFile()              - Active file shortcut (new note)
├── processActiveFileAndAppend()     - Active file shortcut (append)
└── processUrlBatch()                - URL list processor
```

## Installation Steps

1. Navigate to the directory:
   ```bash
   cd /home/rpollum@retailcapital.com/workspace/convenience/obsidian-scripts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy to Obsidian plugins folder:
   ```bash
   cp -r . /path/to/vault/.obsidian/plugins/metadata-link-parser/
   ```

4. Enable in Obsidian Settings → Community Plugins

## Dependencies

### Runtime
- `obsidian` - Obsidian API
- ReadItLater plugin (must be installed separately)

### Development
- TypeScript 4.7.4
- @types/node
- esbuild (for building)
- ESLint + TypeScript ESLint

## Lint Status

✅ **All lint errors resolved!**

The plugin now uses stub implementations (`ReadItLaterStubs.ts`) instead of trying to import from external ReadItLater plugin files. After running `npm install`, all TypeScript errors should be gone.

## Integration Requirements

### Required
1. **Obsidian** installed
2. **Node.js and npm** for building

### Optional
1. **ReadItLater plugin** - Enhances article parsing quality
   - Plugin automatically detects if installed
   - Falls back to built-in parsing if not available

No manual integration needed - the `getNoteService()` helper automatically handles detection and fallback!

## Usage Pattern

```typescript
import { MetadataLinkParser, parseMetadataLinkAndAppend } from './parse-metadata-link';

// Initialize with app and noteService
const parser = new MetadataLinkParser(app, noteService);

// Create new note from URL
await parser.processActiveFile();

// Append to existing file
await parser.processActiveFileAndAppend();

// Or use helper functions
await parseMetadataLinkAndAppend(app, noteService);

// Process specific file and append
const file = app.vault.getAbstractFileByPath('path/to/file.md');
await parser.processFileAndAppend(file);

// Process folder and append to all files
await parser.processFolderFilesAndAppend('articles');
```

## Next Steps

1. ✅ Dependencies installed (`npm install` completed)
2. Build the plugin: `npm run build`
3. Copy to your Obsidian vault's plugins folder
4. Enable in Obsidian settings
5. Test with and without ReadItLater plugin installed

## API Reference

See `README.md` for full API documentation and `USAGE_EXAMPLES.md` for practical examples.

## License

MIT (Update as needed)
