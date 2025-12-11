# Processing Modes Comparison

This document explains the differences between the two processing modes available in the Metadata Link Parser.

## Mode 1: Create New Note

**Use this mode when:** You want to keep article content separate from your notes.

### How it works:
1. Extracts URL from your note
2. Processes it through ReadItLater plugin
3. Creates a **new separate note** with the article content
4. Formats according to ReadItLater settings

### Commands:
- `Parse link from active file (create new note)`
- `Parse links from folder (create new notes)`

### Code Example:
```typescript
import { parseMetadataLink } from './parse-metadata-link';
await parseMetadataLink(this.app, noteService);
```

### Result Structure:
```
Your Vault/
├── my-notes.md          (Original file with URL)
└── Article Title.md     (NEW file with article content)
```

### Pros:
- ✅ Keeps notes and articles separate
- ✅ Uses ReadItLater's full parsing capabilities
- ✅ Better formatting and structure
- ✅ Easier to manage individual articles

### Cons:
- ❌ Creates multiple files
- ❌ Content is not in the same file as your notes

---

## Mode 2: Append to Existing File

**Use this mode when:** You want article content directly in your note file.

### How it works:
1. Extracts URL from your note
2. Fetches article content via HTTP
3. Strips HTML and extracts plain text
4. **Appends content** to the bottom of the existing file

### Commands:
- `Parse link and append to active file`
- `Parse links from folder and append to files`

### Code Example:
```typescript
import { parseMetadataLinkAndAppend } from './parse-metadata-link';
await parseMetadataLinkAndAppend(this.app, noteService);
```

### Result Structure:
```
Your Vault/
└── my-notes.md          (Original file + appended article content)
```

The file is updated with:
```markdown
[Your original content]

---

## Retrieved Article Content

**Source:** https://example.com/article

[Article content here...]
```

### Pros:
- ✅ Everything in one file
- ✅ No additional files created
- ✅ Easy to reference while taking notes
- ✅ Better for research notes

### Cons:
- ❌ Files can become very long
- ❌ Basic HTML parsing (less sophisticated than ReadItLater)
- ❌ May include unwanted content from web page

---

## Quick Comparison Table

| Feature | Create New Note | Append to File |
|---------|----------------|----------------|
| **Separate files** | Yes | No |
| **Uses ReadItLater parser** | Yes | No |
| **Content quality** | High | Medium |
| **File organization** | Multiple files | Single file |
| **Best for** | Article library | Research notes |
| **Dependencies** | ReadItLater plugin | Only Obsidian API |

---

## Choosing the Right Mode

### Choose **Create New Note** if you:
- Want to build an article library
- Prefer organized, separate articles
- Need the best possible content extraction
- Are okay with managing multiple files

### Choose **Append to File** if you:
- Are doing research and want sources with notes
- Prefer everything in one place
- Want to avoid file clutter
- Need quick reference to source material

---

## Switching Between Modes

You can use both modes! For example:

1. Use **Append** for quick research notes
2. Use **Create New Note** for articles you want to save permanently

Both modes work with the same frontmatter format and URL extraction methods, so you can easily switch based on your needs.

---

## API Methods by Mode

### Create New Note Methods:
```typescript
// Single file
parser.processFile(file)
parser.processActiveFile()

// Batch
parser.processFolderFiles(folderPath)
parser.processUrlBatch(file)
```

### Append to File Methods:
```typescript
// Single file
parser.processFileAndAppend(file)
parser.processActiveFileAndAppend()

// Batch
parser.processFolderFilesAndAppend(folderPath)
```

---

## Tips

1. **Test both modes** on a few files to see which workflow you prefer
2. **Use append for drafts**, create new notes for final articles
3. **Combine modes** in different folders based on content type
4. **Configure ReadItLater** settings to optimize the "Create New Note" mode
5. For append mode, consider **editing the separator** in the code to match your preferred format
