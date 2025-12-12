# Obsidian Metadata Link Parser with ReadItLater Integration

This script extracts URLs from Obsidian markdown files and processes them using the ReadItLater plugin to fetch article information.

## Quick Start

### Setup

1. **Install dependencies:**
   ```bash
   cd obsidian-scripts
   npm install
   ```

2. **Install ReadItLater plugin** in your Obsidian vault

3. **Copy the plugin files** to your Obsidian plugins directory:
   ```bash
   cp -r . /path/to/your/vault/.obsidian/plugins/metadata-link-parser/
   ```

4. **Enable the plugin** in Obsidian Settings → Community Plugins

### Note on Lint Errors

After running `npm install`, all TypeScript errors should be resolved. The plugin now uses stub implementations that don't require external ReadItLater files.

## Features

- **Extract URLs from frontmatter**: Supports common metadata fields like `url`, `link`, `source`, `web_url`, and `article_url`
- **Extract URLs from content**: Falls back to extracting the first markdown or plain URL from the file content
- **Single file processing**: Process the currently active file
- **Batch processing**: Process all files in a folder or multiple URLs from a single file
- **Smart skip processing**: Automatically skips files that have already been processed in batch operations
  - Adds `article_processed: true` to frontmatter after successful processing
  - Only applies to batch/folder operations
  - Individual file processing always runs (ignores processed status)
- **Context menu integration**: Right-click on folders or files to process them
  - Right-click folder → "Append articles to files in folder"
  - Right-click folder → "Create notes from links in folder"
  - Right-click file → "Append article to this file"
  - Right-click file → "Create note from link"
- **Two processing modes**:
  - **Create new note**: Uses ReadItLater plugin to create a separate note with article content
  - **Append to existing file**: Fetches article content and appends it to the file containing the URL
  - 📖 See [MODES_COMPARISON.md](./MODES_COMPARISON.md) for a detailed comparison
- **Integration with ReadItLater plugin**: Uses the ReadItLater API to fetch and format article content

## Installation

1. Copy all TypeScript files to your Obsidian plugin project:
   - `parse-metadata-link.ts`
   - `ReadItLaterStubs.ts`
   - `plugin-main.ts`
2. Run `npm install` to install dependencies
3. Build your plugin with `npm run build`
4. Copy to your vault's plugins folder
5. (Optional) Install ReadItLater plugin for enhanced article parsing

### About ReadItLater Integration

This plugin includes **stub implementations** of ReadItLater's API that provide basic functionality out of the box. If you have the ReadItLater plugin installed, it will automatically detect and use it for better article extraction. Otherwise, it falls back to the built-in implementation.

**No external dependencies required!** The plugin works standalone.

## Usage

### Using Context Menus (Easiest!) 🎯

The plugin adds convenient context menu items to your file explorer:

#### For Folders
1. **Right-click any folder** in the file explorer
2. Choose from:
   - **"Append articles to files in folder"** - Process all files and append content to each
   - **"Create notes from links in folder"** - Process all files and create new notes

#### For Files
1. **Right-click any file** in the file explorer
2. Choose from:
   - **"Append article to this file"** - Append article content to the file
   - **"Create note from link"** - Create a new note with the article

### Using Commands

#### Process Active File (Create New Note)

Add a command to your plugin that calls:

```typescript
await parseMetadataLink(this.app, noteService);
```

This will:
1. Extract the URL from the active file's frontmatter or content
2. Process it with ReadItLater to fetch article information
3. Create a new note with the article content

### Process Active File (Append to Existing File)

To append article content to the existing file instead of creating a new note:

```typescript
await parseMetadataLinkAndAppend(this.app, noteService);
```

This will:
1. Extract the URL from the active file's frontmatter or content
2. Fetch the article content from the URL
3. Append the article content to the bottom of the existing file with a separator

### Process Folder (Create New Notes)

Process all markdown files in a specific folder and create new notes:

```typescript
await parseMetadataLinksInFolder(this.app, noteService, 'Articles');
```

### Process Folder (Append to Files)

Process all files in a folder and append content to each:

```typescript
const parser = new MetadataLinkParser(this.app, noteService);
await parser.processFolderFilesAndAppend('Articles');
```

### Batch Process URLs

Create a file with multiple URLs (one per line) and process them all:

```typescript
const parser = new MetadataLinkParser(this.app, noteService);
const urlFile = this.app.vault.getAbstractFileByPath('urls.md') as TFile;
await parser.processUrlBatch(urlFile);
```

## Example File Format

### With Frontmatter

```markdown
---
url: https://example.com/article
title: My Article
---

# Article Notes

This file contains my notes about the article.
```

### Without Frontmatter

```markdown
# Article Notes

Source: [Article Title](https://example.com/article)

This file contains my notes about the article.
```

### URL Batch File

```markdown
https://example.com/article1
https://example.com/article2
https://example.com/article3
```

## Dependencies

### Required
- `obsidian` - Obsidian API (installed via npm)

### Optional
- **ReadItLater plugin** - If installed in your vault, the plugin will automatically use it for enhanced article parsing. Otherwise, uses built-in stub implementation.

### How It Works

The plugin includes `ReadItLaterStubs.ts` which provides:
1. **Stub implementations** of `ReadItLaterApi` and `NoteService`
2. **Automatic detection** via `isReadItLaterInstalled()`
3. **Smart fallback** via `getNoteService()` helper

When the plugin loads:
- ✅ **ReadItLater installed**: Uses the real plugin's superior parsing
- ✅ **ReadItLater not installed**: Uses built-in basic HTML parsing

Either way, your plugin works!

## API Methods

### `MetadataLinkParser`

#### Create New Note Methods
- `processFile(file: TFile)` - Process a single file and create a new note
- `processFolderFiles(folderPath: string)` - Process all files in a folder and create new notes
- `processActiveFile()` - Process the currently active file and create a new note
- `processUrlBatch(file: TFile)` - Batch process multiple URLs from a file

#### Append to Existing File Methods
- `processFileAndAppend(file: TFile)` - Process a file and append content to it
- `processActiveFileAndAppend()` - Process the active file and append content to it
- `processFolderFilesAndAppend(folderPath: string)` - Process all files in folder and append content to each

## TypeScript Configuration

The project includes proper TypeScript configuration:

1. `tsconfig.json` - TypeScript compiler settings
2. `package.json` - Dependencies and build scripts
3. All type definitions included in stubs

Simply run:
```bash
npm install
npm run build
```

## Notes

- The ReadItLater plugin must be installed and enabled for this to work
- URLs are validated before processing
- User notifications are shown for success/failure states
- All errors are logged to the console for debugging
