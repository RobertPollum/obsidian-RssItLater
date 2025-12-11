# Context Menu Guide

The plugin adds convenient right-click menu items to folders and files in Obsidian's file explorer.

## For Folders

When you **right-click on a folder**, you'll see these new options:

```
📁 My Articles Folder
   │
   ├─ Open in new tab
   ├─ Reveal file in navigation
   ├─────────────────────────────────
   ├─ 🔗 Append articles to files in folder  ⭐ NEW
   ├─ 📄 Create notes from links in folder   ⭐ NEW
   ├─────────────────────────────────
   ├─ Rename
   └─ Delete
```

### "Append articles to files in folder" 🔗

**What it does:**
- Scans all markdown files in the folder
- **Skips files already processed** (have `article_processed: true`)
- Extracts URL from each file's frontmatter or content
- Fetches article content using ReadItLater
- Appends the article content to the original file
- **Marks files as processed** to skip on next run

**Example:**

**Before:**
```
📁 Articles/
   ├─ article1.md (contains URL)
   ├─ article2.md (contains URL)
   └─ article3.md (contains URL)
```

**After right-clicking folder → "Append articles to files in folder":**
```
📁 Articles/
   ├─ article1.md (now has article content appended)
   ├─ article2.md (now has article content appended)
   └─ article3.md (now has article content appended)
```

**Use case:** You have a folder of research notes with URLs in their frontmatter, and you want to fetch all the articles at once.

### "Create notes from links in folder" 📄

**What it does:**
- Scans all markdown files in the folder
- Extracts URL from each file's frontmatter or content
- Fetches article content using ReadItLater
- Creates NEW separate notes for each article

**Example:**

**Before:**
```
📁 Reading List/
   ├─ to-read-1.md (contains URL)
   ├─ to-read-2.md (contains URL)
   └─ to-read-3.md (contains URL)
```

**After right-clicking folder → "Create notes from links in folder":**
```
📁 Reading List/
   ├─ to-read-1.md (unchanged)
   ├─ to-read-2.md (unchanged)
   └─ to-read-3.md (unchanged)

📁 Vault Root/
   ├─ article-from-url-1.md (NEW!)
   ├─ article-from-url-2.md (NEW!)
   └─ article-from-url-3.md (NEW!)
```

**Use case:** You have a reading list with URLs, and you want to create full article notes while keeping your reading list intact.

---

## For Files

When you **right-click on a file**, you'll see these new options:

```
📄 my-note.md
   │
   ├─ Open in new tab
   ├─ Open to the right
   ├─────────────────────────────────
   ├─ 🔗 Append article to this file   ⭐ NEW
   ├─ 📄 Create note from link         ⭐ NEW
   ├─────────────────────────────────
   ├─ Rename
   └─ Delete
```

### "Append article to this file" 🔗

**What it does:**
- Extracts URL from the file's frontmatter or content
- Fetches article content using ReadItLater
- Appends the content to the bottom of the file
- **Ignores processed status** - always runs when you explicitly select a file

**Example:**

**Before:**
```markdown
---
url: https://example.com/article
---

# My Research Notes

Some initial thoughts about this article.
```

**After right-clicking → "Append article to this file":**
```markdown
---
url: https://example.com/article
---

# My Research Notes

Some initial thoughts about this article.

---

## Retrieved Article Content

# The Actual Article Title

**Author:** John Doe
**Published:** 2024-12-10
**Source:** https://example.com/article

Lorem ipsum dolor sit amet... [full article content]
```

**Use case:** You've saved a URL in your notes and now want to fetch the full article without leaving the file.

### "Create note from link" 📄

**What it does:**
- Extracts URL from the file's frontmatter or content
- Fetches article content using ReadItLater
- Creates a NEW separate note with the article

**Example:**

**Before:**
```
📄 interesting-link.md
```
Content:
```markdown
---
url: https://example.com/great-article
---

Found this interesting article!
```

**After right-clicking → "Create note from link":**
```
📄 interesting-link.md (unchanged)
📄 example-com-great-article.md (NEW!)
```

**Use case:** You want to save the full article but keep your original note separate.

---

## Common Workflows

### Workflow 1: Research Folder → Batch Append

1. Create a folder: `Research/`
2. Add files with URLs in frontmatter:
   ```markdown
   ---
   url: https://paper1.com
   ---
   ```
3. **Right-click folder** → "Append articles to files in folder"
4. ☕ Wait while all articles are fetched
5. ✅ All files now have full article content

### Workflow 2: Reading List → New Notes

1. Create a file: `reading-list.md`
   ```markdown
   https://article1.com
   https://article2.com
   https://article3.com
   ```
2. **Right-click file** → "Batch process URLs from file" (use command)
3. ✅ Three new notes created with article content

### Workflow 3: Individual File Processing

1. Have a note with URL in frontmatter
2. **Right-click file** → "Append article to this file"
3. ✅ Article content appended immediately

### Workflow 4: Organize Later

1. Collect URLs in notes throughout the day
2. End of day: **Right-click folder** → "Append articles to files in folder"
3. ✅ All articles fetched in one batch

---

## Processed File Tracking

### How It Works

The plugin automatically tracks which files have been processed:

**In batch operations (folders):**
- ✅ Skips files with `article_processed: true`
- ✅ Shows count: "3 processed, 2 skipped"
- ✅ Only processes new/unprocessed files

**In individual operations (single files):**
- ✅ Always processes (ignores the property)
- ✅ User explicitly requested it
- ✅ Useful for re-fetching updated articles

**Example:**
```yaml
---
url: https://example.com
article_processed: true  ← Added after processing
---
```

See [PROCESSED_TRACKING.md](./PROCESSED_TRACKING.md) for complete details.

## Tips

### ✅ Best Practices

1. **Use frontmatter for better organization**
   ```yaml
   ---
   url: https://example.com
   title: Article Title
   tags: [research, ai]
   ---
   ```

2. **Create folders by topic**
   ```
   📁 Research/
      ├─ 📁 AI/
      ├─ 📁 Design/
      └─ 📁 Business/
   ```
   Right-click each folder to batch process

3. **Check console for progress**
   - View → Toggle Developer Tools
   - Watch articles being fetched

4. **Install ReadItLater for better quality**
   - Cleaner markdown
   - Better formatting
   - Metadata extraction

### ⚠️ Things to Know

1. **Network required** - Articles are fetched from the web
2. **Processing time** - Large folders may take a while
3. **URL format** - Must be valid HTTP/HTTPS URLs
4. **Duplicate content** - Running append twice will append twice
5. **Notifications** - Plugin shows progress via Obsidian notices

---

## Keyboard Shortcuts

You can assign keyboard shortcuts to these actions:

1. Settings → Hotkeys
2. Search for "Metadata Link Parser"
3. Assign shortcuts to:
   - "Parse link and append to active file"
   - "Parse link from active file"
   - etc.

---

## Comparison: Context Menu vs Commands

| Feature | Context Menu | Command Palette |
|---------|--------------|-----------------|
| **Folders** | ✅ Right-click | ❌ Must specify path in code |
| **Files** | ✅ Right-click | ✅ Works on active file only |
| **Speed** | ⚡ One click | 🔍 Type to search |
| **Discovery** | 👁️ Visible in menu | 🤔 Must know it exists |
| **Convenience** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recommendation:** Use context menus for most tasks - they're faster and more intuitive!

---

## Troubleshooting

### Menu items don't appear

1. Check plugin is enabled
2. Reload Obsidian
3. Check console for errors

### Menu appears but nothing happens

1. Check file has a valid URL
2. Open console (View → Toggle Developer Tools)
3. Look for error messages
4. Verify internet connection

### Articles don't fetch

1. Check URL is accessible in browser
2. Some sites block automated requests
3. Install ReadItLater plugin for better results
4. Check console for specific errors

---

## Summary

The context menu integration makes it incredibly easy to:
- 📁 **Batch process folders** - Right-click, done!
- 📄 **Process individual files** - No need to open them
- ⚡ **Work faster** - One click instead of multiple steps
- 🎯 **Stay in flow** - No need to switch to command palette

**Just right-click and go!** 🚀
