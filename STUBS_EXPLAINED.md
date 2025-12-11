# ReadItLater Stubs Explained

## What Are Stubs?

This plugin uses **stub implementations** to provide standalone functionality without requiring the ReadItLater plugin to be installed. However, if ReadItLater IS installed, the plugin automatically uses it for better results.

## Why Use Stubs?

### The Problem
- ReadItLater is an Obsidian plugin, not an npm package
- Can't install it via `npm install`
- Your plugin would break if ReadItLater isn't installed
- Users would be forced to install another plugin

### The Solution
- Provide basic implementations that work standalone
- Automatically detect if ReadItLater is available
- Use the real plugin if found, fallback to stubs if not
- **Best of both worlds!**

## How It Works

### Architecture

```
Your Plugin
    ↓
getNoteService(app)
    ↓
Is ReadItLater installed?
    ├─ YES → Use real ReadItLater NoteService (better quality)
    └─ NO  → Use stub NoteService (basic but works)
```

### Code Flow

```typescript
// 1. Plugin loads
async onload() {
    // 2. Get NoteService (automatically detects ReadItLater)
    this.noteService = getNoteService(this.app);
    
    // 3. Use it - works either way!
    await this.noteService.createNote(url);
}
```

## The Stub Implementation

### What's Included in `ReadItLaterStubs.ts`

1. **`NoteService` class**
   - `createNote(content)` - Create note from URL or text
   - `createNotesFromBatch(batch)` - Create multiple notes
   - `insertContentAtEditorCursorPosition(content, editor)` - Insert at cursor
   - Basic HTML parsing
   - Simple filename generation

2. **`ReadItLaterApi` class**
   - Wraps NoteService with the same API as real ReadItLater
   - `processContent(content)`
   - `processContentBatch(batch)`
   - `insertContentAtEditorCursorPosition(content, editor)`

3. **Helper Functions**
   - `isReadItLaterInstalled(app)` - Check if plugin exists
   - `getNoteService(app)` - Get real or stub NoteService

## Quality Comparison

### Stub Implementation (Built-in)
✅ Works without any dependencies  
✅ Simple and reliable  
✅ Basic HTML text extraction  
❌ Less sophisticated parsing  
❌ May include page headers/footers  
❌ No special handling for different sites  

### Real ReadItLater Plugin
✅ Superior article extraction  
✅ Cleans headers, footers, ads  
✅ Site-specific parsers  
✅ Better formatting  
✅ More configuration options  
❌ Requires additional plugin installation  

## Usage Examples

### Basic Usage (Works Always)

```typescript
import { getNoteService } from './ReadItLaterStubs';

const noteService = getNoteService(this.app);
await noteService.createNote('https://example.com/article');
```

### Checking Which Implementation

```typescript
import { getNoteService, isReadItLaterInstalled } from './ReadItLaterStubs';

const noteService = getNoteService(this.app);

if (isReadItLaterInstalled(this.app)) {
    console.log('Using ReadItLater plugin - high quality parsing');
    new Notice('ReadItLater detected - using enhanced parsing');
} else {
    console.log('Using stub implementation - basic parsing');
    new Notice('Using built-in parser');
}
```

### Recommending ReadItLater to Users

```typescript
async onload() {
    this.noteService = getNoteService(this.app);
    
    // Show a one-time suggestion
    if (!isReadItLaterInstalled(this.app)) {
        setTimeout(() => {
            new Notice(
                'Tip: Install ReadItLater plugin for better article parsing!',
                10000
            );
        }, 5000);
    }
}
```

## Benefits of This Approach

### For Plugin Developers
1. ✅ **No external dependencies** to manage
2. ✅ **Type safety** - all interfaces defined
3. ✅ **Works immediately** after npm install
4. ✅ **Optional enhancement** via ReadItLater
5. ✅ **No breaking changes** if ReadItLater updates

### For Users
1. ✅ **Plugin works out of the box** - no setup required
2. ✅ **Optional enhancement** - install ReadItLater for better results
3. ✅ **Graceful degradation** - if ReadItLater breaks, stub takes over
4. ✅ **No forced dependencies** - users choose what to install

## Technical Details

### Detection Method

```typescript
export function isReadItLaterInstalled(app: App): boolean {
    // @ts-ignore - accessing internal plugin structure
    return app.plugins?.plugins?.['obsidian-read-it-later'] !== undefined;
}
```

### Fallback Logic

```typescript
export function getNoteService(app: App): NoteService {
    if (isReadItLaterInstalled(app)) {
        try {
            // @ts-ignore
            const plugin = app.plugins.plugins['obsidian-read-it-later'];
            if (plugin.noteService) {
                return plugin.noteService;
            }
        } catch (error) {
            console.warn('Could not access ReadItLater NoteService:', error);
        }
    }
    
    // Fallback to stub
    return new NoteService(app);
}
```

## Customizing the Stubs

You can modify `ReadItLaterStubs.ts` to:

1. **Improve HTML parsing**
   ```typescript
   private extractTextFromHtml(html: string): string {
       // Add your custom parsing logic
       // Use libraries like cheerio, jsdom, etc.
   }
   ```

2. **Change filename generation**
   ```typescript
   private generateFilenameFromUrl(url: string): string {
       // Your custom filename logic
   }
   ```

3. **Add custom note templates**
   ```typescript
   private createNoteFromUrl(url: string): Promise<void> {
       const content = await this.fetchArticleContent(url);
       const template = `# ${title}\n\nSource: ${url}\n\n${content}`;
       // ...
   }
   ```

## Common Questions

### Q: Will this break if ReadItLater updates its API?
**A:** No. If ReadItLater changes, the detection will fail gracefully and fall back to stubs. Your plugin keeps working.

### Q: Can I force using stubs even if ReadItLater is installed?
**A:** Yes, just use `new NoteService(app)` directly instead of `getNoteService(app)`.

### Q: How do I add more features to the stubs?
**A:** Edit `ReadItLaterStubs.ts` and add methods to the `NoteService` class. They'll work regardless of ReadItLater installation.

### Q: Can I use this pattern for other plugins?
**A:** Absolutely! This stub pattern works for any Obsidian plugin integration.

## Summary

The stub system allows your plugin to:
- ✅ Work immediately without extra setup
- ✅ Automatically use ReadItLater when available
- ✅ Fall back gracefully when it's not
- ✅ Give users choice and flexibility
- ✅ Maintain compatibility over time

**It's the best way to integrate with another plugin without creating hard dependencies!**
