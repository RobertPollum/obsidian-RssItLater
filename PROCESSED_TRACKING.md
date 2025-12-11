# Processed File Tracking Guide

## Overview

The plugin includes **smart skip processing** that prevents re-processing files in batch operations while allowing explicit individual processing when needed.

## How It Works

### The `article_processed` Property

After successfully processing a file in a **batch/folder operation**, the plugin adds this to the file's frontmatter:

```yaml
---
article_processed: true
---
```

### When Files Are Marked as Processed

Files are marked as processed **only** when:
- ✅ Processed as part of a folder batch operation
- ✅ Article content was successfully fetched
- ✅ Content was successfully appended to the file

Files are **NOT** marked when:
- ❌ Processing a single file explicitly (via context menu or command)
- ❌ Processing fails or errors occur
- ❌ No URL found in the file

### When Files Are Skipped

In **batch/folder operations**, files are skipped if:
- File has `article_processed: true` in frontmatter
- File was successfully processed in a previous run

Files are **NEVER** skipped when:
- Processing a single file via "Append article to this file" context menu
- Processing active file via command palette
- User explicitly chooses to process that specific file

## Behavior by Operation Type

### Folder Context Menu: "Append articles to files in folder"

```
Folder (5 files):
├─ file1.md (no property) ────────────> ✅ PROCESSED, property added
├─ file2.md (article_processed: true) ⏭️  SKIPPED
├─ file3.md (no property) ────────────> ✅ PROCESSED, property added  
├─ file4.md (article_processed: true) ⏭️  SKIPPED
└─ file5.md (no property) ────────────> ✅ PROCESSED, property added

Result: "Completed: 3 processed, 2 skipped (already processed)"
```

### File Context Menu: "Append article to this file"

```
file1.md (article_processed: true) ───> ✅ PROCESSED ANYWAY

Property is IGNORED for individual files.
User explicitly requested processing, so we process it.
```

### Command Palette: "Parse link and append to active file"

```
active-file.md (article_processed: true) ─> ✅ PROCESSED ANYWAY

Same as file context menu - user explicitly requested it.
```

## Example Workflow

### First Run

**Folder structure:**
```
📁 Articles/
   ├─ article1.md
   │  ---
   │  url: https://example.com/1
   │  ---
   │
   ├─ article2.md
   │  ---
   │  url: https://example.com/2
   │  ---
   │
   └─ article3.md
      ---
      url: https://example.com/3
      ---
```

**Action:** Right-click folder → "Append articles to files in folder"

**Result:**
```
📁 Articles/
   ├─ article1.md ✅ Content appended
   │  ---
   │  url: https://example.com/1
   │  article_processed: true
   │  ---
   │  # My Notes
   │  ---
   │  ## Retrieved Article Content
   │  [article content here]
   │
   ├─ article2.md ✅ Content appended
   │  ---
   │  url: https://example.com/2
   │  article_processed: true
   │  ---
   │  [content...]
   │
   └─ article3.md ✅ Content appended
      ---
      url: https://example.com/3
      article_processed: true
      ---
      [content...]

Notice: "Completed: 3 processed, 0 skipped (already processed)"
```

### Second Run (Same Folder)

**Action:** Right-click folder → "Append articles to files in folder" again

**Result:**
```
📁 Articles/
   ├─ article1.md ⏭️  SKIPPED (already processed)
   ├─ article2.md ⏭️  SKIPPED (already processed)
   └─ article3.md ⏭️  SKIPPED (already processed)

Notice: "Completed: 0 processed, 3 skipped (already processed)"
```

### Adding New File

**Action:** Add new file to folder:
```
📁 Articles/
   ├─ article1.md (article_processed: true)
   ├─ article2.md (article_processed: true)
   ├─ article3.md (article_processed: true)
   └─ article4.md (NEW! - no property)
```

**Action:** Right-click folder → "Append articles to files in folder"

**Result:**
```
📁 Articles/
   ├─ article1.md ⏭️  SKIPPED
   ├─ article2.md ⏭️  SKIPPED
   ├─ article3.md ⏭️  SKIPPED
   └─ article4.md ✅ PROCESSED (property added)

Notice: "Completed: 1 processed, 3 skipped (already processed)"
```

### Re-processing Individual File

**Scenario:** You want to re-fetch article1.md because the website updated

**Action:** Right-click article1.md → "Append article to this file"

**Result:**
```
article1.md ✅ PROCESSED (property ignored)

The article content is appended again.
Property stays as article_processed: true.
```

## Benefits

### ✅ For Batch Operations
- **Saves time** - Don't re-fetch articles unnecessarily
- **Saves bandwidth** - No redundant HTTP requests
- **Idempotent** - Run batch operation multiple times safely
- **Incremental** - Process only new files in folder

### ✅ For Individual Operations
- **User control** - User can force re-processing
- **Flexibility** - Update outdated articles
- **No confusion** - "I clicked it, it runs"

## Use Cases

### Use Case 1: Daily Import Workflow

```
1. Throughout the day: Save URLs in notes
2. End of day: Right-click folder → Batch append
3. Next day: Add more URLs
4. Right-click folder again → Only new files processed
```

### Use Case 2: Incremental Research

```
1. Create research folder
2. Add 10 articles with URLs
3. Process folder (all 10 processed)
4. Read and annotate articles
5. Add 5 more articles
6. Process folder (only new 5 processed)
7. Existing annotations preserved
```

### Use Case 3: Update Specific Article

```
1. Folder has 100 processed articles
2. One article's source updated
3. Right-click that specific file
4. Re-fetches and appends latest version
5. Other 99 files unchanged
```

## Resetting Processed Status

### Manual Reset (Single File)

Remove the property from frontmatter:

**Before:**
```yaml
---
url: https://example.com
article_processed: true
---
```

**After:**
```yaml
---
url: https://example.com
---
```

Next batch operation will process this file again.

### Batch Reset (All Files in Folder)

Use a search and replace:
1. Search: `article_processed: true\n`
2. Replace with: (empty)
3. Scope: Specific folder

Or use a script:
```bash
# Remove processed property from all files in folder
find ./Articles -name "*.md" -exec sed -i '/article_processed: true/d' {} \;
```

## Technical Details

### Property Storage

The property is stored in YAML frontmatter:
```yaml
---
url: https://example.com
title: My Article
article_processed: true
---
```

### Detection Logic

```typescript
// Check if file has been processed
private async isFileProcessed(file: TFile): Promise<boolean> {
    const frontmatter = parseYaml(content);
    return frontmatter?.article_processed === true;
}
```

### Marking Logic

```typescript
// Mark file as processed
private async markFileAsProcessed(file: TFile): Promise<void> {
    // Adds or updates frontmatter with article_processed: true
}
```

### Processing Logic

```typescript
// Individual file - ignore property
await this.processFileAndAppend(file, false);

// Batch operation - check property
await this.processFileAndAppend(file, true);
```

## Notifications

### Batch Operation Notification

```
"Completed: 5 processed, 3 skipped (already processed)"
```

Shows:
- How many files were newly processed
- How many files were skipped (already had the property)

### Console Logs

```
Skipping already processed file: Articles/article1.md
Skipping already processed file: Articles/article2.md
Processing Articles/article3.md...
```

Check console (View → Toggle Developer Tools) to see detailed processing info.

## Frequently Asked Questions

### Q: Why doesn't individual file processing respect the property?

**A:** When you explicitly select a file to process (right-click or active file command), you're clearly requesting that specific action. The plugin honors your explicit intent rather than silently refusing.

If you run a batch operation, you probably don't want to re-process everything every time - that's when the skip logic helps.

### Q: Can I force re-processing of an entire folder?

**A:** Yes, two options:
1. Remove `article_processed: true` from all files first
2. Or process files individually via context menu

### Q: What if processing fails partway through?

**A:** Files are only marked as processed **after successful completion**. If a file fails to fetch or append, it won't be marked, so next batch run will try again.

### Q: Does this work with "Create new note" mode?

**A:** No, the processed tracking **only applies to append mode**. Creating new notes doesn't modify the original file, so there's no tracking needed.

### Q: Will this interfere with my existing frontmatter?

**A:** No, the plugin preserves all existing frontmatter properties and only adds `article_processed: true`.

### Q: Can I rename the property?

**A:** Currently it's hardcoded as `article_processed`, but you could modify the source code to use a different name.

## Best Practices

### ✅ Do

- Run batch operations on folders with mixed processed/unprocessed files
- Use individual processing when you need to re-fetch updated content
- Keep the `article_processed` property in frontmatter for tracking
- Check notifications to see skip counts

### ❌ Don't

- Don't manually add `article_processed: true` before processing
- Don't assume individual file processing will skip (it won't)
- Don't delete the property if you want to prevent re-processing

## Summary

The processed tracking feature provides:

- 🎯 **Smart batching** - Process only what's needed
- ⚡ **Fast incremental updates** - Add files as you go
- 🔄 **Idempotent operations** - Run safely multiple times
- 👤 **User control** - Override when needed
- 📊 **Clear feedback** - See what was processed vs skipped

**The rule is simple:** Batch operations skip processed files. Individual operations always run.
