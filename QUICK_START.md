# Quick Start Guide

## ✅ Your Plugin is Ready to Build!

All lint errors have been resolved. The plugin now works **standalone** without requiring external ReadItLater files.

## What Changed?

### Before (Broken)
```typescript
import { ReadItLaterApi } from './ReadItLaterApi';     // ❌ File doesn't exist
import { NoteService } from './NoteService';           // ❌ File doesn't exist
```

### After (Fixed)
```typescript
import { ReadItLaterApi, NoteService } from './ReadItLaterStubs';  // ✅ Works!
```

## How It Works Now

```
┌─────────────────────────────────────────┐
│  Your Plugin (Metadata Link Parser)    │
├─────────────────────────────────────────┤
│  Uses: ReadItLaterStubs.ts              │
│  ├─ Built-in NoteService                │
│  ├─ Built-in ReadItLaterApi             │
│  └─ Auto-detects real ReadItLater       │
└─────────────────────────────────────────┘
           ↓
    ┌─────┴─────┐
    ↓           ↓
ReadItLater     No ReadItLater
Installed?      Installed?
    ↓               ↓
Uses real       Uses built-in
plugin          stubs
(better)        (works fine)
```

## Build Your Plugin

### Step 1: Verify Installation
```bash
cd /home/rpollum@retailcapital.com/workspace/convenience/obsidian-scripts
npm install  # ✅ Already done!
```

### Step 2: Build
```bash
npm run build
```

### Step 3: Copy to Obsidian
```bash
# Replace with your vault path
cp -r . /path/to/your/vault/.obsidian/plugins/metadata-link-parser/
```

### Step 4: Enable in Obsidian
1. Open Obsidian
2. Settings → Community Plugins
3. Reload plugins
4. Enable "Metadata Link Parser"

## Test It!

### Test 1: Create a Test File
Create a file in your vault:

```markdown
---
url: https://example.com
---

# Test Note

This is a test.
```

### Test 2: Use Context Menu (Recommended)
1. **Right-click the file** in the file explorer
2. Click **"Append article to this file"**
3. Watch as the article content is appended!

**Or use command palette:**
1. Open the file
2. Open command palette (Ctrl/Cmd + P)
3. Search: "Parse link and append to active file"
4. Run it!

### Expected Result
The article content from example.com will be appended to your file!

## How to Use

### Context Menus (Easiest!) 🎯

Once enabled, you can right-click on folders and files:

**Right-click on a folder:**
- **"Append articles to files in folder"** - Process all files and append content ⭐
  - Automatically skips files already processed
  - Shows count: "5 processed, 2 skipped"
- **"Create notes from links in folder"** - Create new notes from all files

**Right-click on a file:**
- **"Append article to this file"** - Append article to the file ⭐
  - Always processes (ignores processed status)
  - Perfect for re-fetching updated articles
- **"Create note from link"** - Create a new note

### Command Palette

You can also use these commands (Ctrl/Cmd + P):

1. **Parse link from active file (create new note)**
   - Extracts URL and creates a new note

2. **Parse link and append to active file** ⭐ 
   - Extracts URL and appends content to current file

3. **Parse links from folder (create new notes)**
   - Batch process all files in a folder

4. **Parse links from folder and append to files**
   - Batch process and append to each file

5. **Batch process URLs from file**
   - Process a file containing multiple URLs

## Optional: Install ReadItLater

For better article parsing quality:

1. Settings → Community Plugins → Browse
2. Search "ReadItLater"
3. Install and enable

Your plugin will automatically detect and use it!

## Smart Batch Processing

The plugin automatically tracks processed files:

### First run on a folder:
```
"Completed: 5 processed, 0 skipped"
✅ All files processed
✅ Marked with article_processed: true
```

### Second run on same folder:
```
"Completed: 0 processed, 5 skipped (already processed)"
⏭️ All files skipped
⚡ Super fast!
```

### After adding new files:
```
"Completed: 2 processed, 5 skipped (already processed)"
✅ Only new files processed
⏭️ Old files skipped
```

**Individual files always process** - the skip logic only applies to batch operations!

See [PROCESSED_TRACKING.md](./PROCESSED_TRACKING.md) for details.

## Files in This Project

### Core Files (Required)
- `parse-metadata-link.ts` - Main functionality
- `ReadItLaterStubs.ts` - Stub implementations
- `example-plugin-main.ts` - Plugin entry point (rename to `main.ts` for production)

### Configuration Files (Required)
- `manifest.json` - Plugin metadata
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config

### Documentation Files (Optional)
- `README.md` - Full documentation
- `USAGE_EXAMPLES.md` - Usage examples
- `MODES_COMPARISON.md` - Compare create vs append modes
- `STUBS_EXPLAINED.md` - Understanding the stub system
- `PROJECT_SUMMARY.md` - Project overview
- `QUICK_START.md` - This file

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf node_modules
npm install
npm run build
```

### Plugin Doesn't Appear in Obsidian
1. Check the folder name: should be in `.obsidian/plugins/metadata-link-parser/`
2. Must contain: `manifest.json` and `main.js` (built file)
3. Try: Settings → Community Plugins → Reload

### Commands Don't Work
1. Check Obsidian console: View → Toggle Developer Tools
2. Look for error messages
3. Verify the plugin is enabled

### No Content Fetched
1. Check internet connection
2. Verify URL is accessible
3. Some sites block automated requests
4. Try with ReadItLater plugin installed for better results

## Next Steps

1. ✅ Build the plugin: `npm run build`
2. ✅ Copy to your vault
3. ✅ Test the commands
4. 📖 Read `MODES_COMPARISON.md` to choose create vs append mode
5. 📖 Check `USAGE_EXAMPLES.md` for advanced usage
6. 🎨 Customize the stubs in `ReadItLaterStubs.ts` if needed

## Support

- Check the console for errors
- Review the documentation files
- Modify `ReadItLaterStubs.ts` for custom behavior
- Install ReadItLater plugin for enhanced parsing

---

**Your plugin is ready to use! Happy note-taking! 📝**
