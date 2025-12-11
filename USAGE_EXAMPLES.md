# Usage Examples

This document provides practical examples of how to use the Metadata Link Parser with the ReadItLater plugin.

## Scenario 1: Process Article from Frontmatter URL (Create New Note)

### Input File: `articles/my-article.md`

```markdown
---
url: https://example.com/great-article
title: A Great Article
tags: [reading, tech]
---

# My Notes

I want to read this article later.
```

### Action

Use the command palette (Ctrl/Cmd + P) and select:
- "Parse link from active file (create new note)"

### Result

A new note will be created with the full article content from the URL, formatted according to your ReadItLater plugin settings.

---

## Scenario 1b: Append Article to Existing File

### Input File: `articles/my-article.md`

```markdown
---
url: https://example.com/great-article
title: A Great Article
tags: [reading, tech]
---

# My Notes

I want to save this article content directly in this file.
```

### Action

Use the command palette (Ctrl/Cmd + P) and select:
- "Parse link and append to active file"

### Result

The file is updated with the article content appended at the bottom:

```markdown
---
url: https://example.com/great-article
title: A Great Article
tags: [reading, tech]
---

# My Notes

I want to save this article content directly in this file.

---

## Retrieved Article Content

**Source:** https://example.com/great-article

[Article content appears here...]
```

---

## Scenario 2: Extract URL from Markdown Content

### Input File: `research/topic.md`

```markdown
# Research Topic

Found this interesting article: [The Future of AI](https://example.com/ai-future)

I should save this for later reading.
```

### Action

Open the file and run: "Parse link from active file"

### Result

The URL is extracted from the markdown link and processed by ReadItLater.

---

## Scenario 3: Batch Process Multiple Files in a Folder (Create New Notes)

### Folder Structure

```
articles/
  ├── article-1.md  (contains url in frontmatter)
  ├── article-2.md  (contains url in frontmatter)
  └── article-3.md  (contains markdown link)
```

### Code Integration

```typescript
import { parseMetadataLinksInFolder } from './parse-metadata-link';

// In your plugin or script
await parseMetadataLinksInFolder(this.app, noteService, 'articles');
```

### Result

All three files are processed, and ReadItLater creates new notes for each URL found.

---

## Scenario 3b: Batch Process and Append to Existing Files

### Folder Structure

```
research/
  ├── topic-1.md  (contains url)
  ├── topic-2.md  (contains url)
  └── topic-3.md  (contains url)
```

### Code Integration

```typescript
import { MetadataLinkParser } from './parse-metadata-link';

const parser = new MetadataLinkParser(this.app, noteService);
await parser.processFolderFilesAndAppend('research');
```

### Result

Each file is updated with the article content appended at the bottom, keeping all original notes intact.

---

## Scenario 4: Batch Process URLs from a List

### Input File: `urls-to-process.md`

```markdown
# URLs to Process

https://example.com/article-1
https://example.com/article-2
https://example.com/article-3
https://another-site.com/blog-post
```

### Code Integration

```typescript
const parser = new MetadataLinkParser(this.app, noteService);
const urlFile = this.app.vault.getAbstractFileByPath('urls-to-process.md') as TFile;
await parser.processUrlBatch(urlFile);
```

### Result

All four URLs are processed in a batch and individual notes are created for each.

---

## Scenario 5: Custom Integration with Your Plugin

### Example: Add to Context Menu

```typescript
import { Plugin, TFile, Menu } from 'obsidian';
import { MetadataLinkParser } from './parse-metadata-link';

export default class YourPlugin extends Plugin {
    async onload() {
        // Register file menu event
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
                if (file.extension === 'md') {
                    menu.addItem((item) => {
                        item
                            .setTitle('Parse URL with ReadItLater')
                            .setIcon('link')
                            .onClick(async () => {
                                const parser = new MetadataLinkParser(
                                    this.app, 
                                    this.noteService
                                );
                                await parser.processFile(file);
                            });
                    });
                }
            })
        );
    }
}
```

---

## Supported URL Field Names

The parser automatically checks these frontmatter fields (in order):

1. `url`
2. `link`
3. `source`
4. `web_url`
5. `article_url`

### Example Frontmatter Variations

All of these will work:

```yaml
---
url: https://example.com/article
---
```

```yaml
---
link: https://example.com/article
---
```

```yaml
---
source: https://example.com/article
title: My Article
author: John Doe
---
```

---

## Error Handling

The parser provides user-friendly notifications for common issues:

- **"No URL found in file"**: The file doesn't contain a URL in frontmatter or content
- **"No markdown files found in folder"**: The specified folder is empty or doesn't exist
- **"Error processing file"**: The ReadItLater plugin encountered an issue

All errors are also logged to the console for debugging.

---

## Tips and Best Practices

1. **Frontmatter Priority**: URLs in frontmatter are processed first, then content links
2. **URL Validation**: Only valid HTTP/HTTPS URLs are processed
3. **Batch Processing**: Use batch processing for large numbers of URLs to avoid overwhelming the API
4. **ReadItLater Settings**: Configure your ReadItLater plugin settings to control how articles are formatted
5. **Notifications**: Watch for Obsidian notices to confirm successful processing

---

## Troubleshooting

### Problem: "ReadItLater plugin not found"

**Solution**: Ensure the ReadItLater plugin is installed and enabled in Obsidian settings.

### Problem: URLs not being extracted

**Solution**: 
- Check that the URL is in frontmatter with a supported field name
- Verify the URL format is correct (starts with http:// or https://)
- Ensure the file is a valid markdown (.md) file

### Problem: Articles not being created

**Solution**:
- Check ReadItLater plugin settings and ensure it's configured correctly
- Verify you have write permissions in your vault
- Check the Obsidian console for detailed error messages

---

## Integration with ReadItLater API

The parser uses these ReadItLater API methods:

- `processContent(url: string)`: Process a single URL
- `processContentBatch(urls: string)`: Process multiple URLs (newline-delimited)

Make sure your NoteService instance is properly configured according to the ReadItLater plugin requirements.
