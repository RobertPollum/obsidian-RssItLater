import { App, Notice, Editor } from 'obsidian';

/**
 * Stub implementation of NoteService that can be replaced by the actual
 * ReadItLater plugin's NoteService when available.
 * 
 * This provides basic functionality to create notes from URLs without
 * requiring the full ReadItLater plugin to be installed.
 */
export class NoteService {
    constructor(private app: App) {}

    /**
     * Create a note from content (URL or text)
     * This is a simplified implementation - the real ReadItLater plugin
     * provides much more sophisticated parsing and formatting
     */
    async createNote(content: string): Promise<void> {
        try {
            // Check if content is a URL
            const isUrl = content.match(/^https?:\/\//);
            
            if (isUrl) {
                await this.createNoteFromUrl(content);
            } else {
                await this.createNoteFromText(content);
            }
        } catch (error) {
            console.error('Error creating note:', error);
            new Notice('Failed to create note from content');
        }
    }

    /**
     * Create multiple notes from batch content
     * Expects content to be delimited by newlines
     */
    async createNotesFromBatch(contentBatch: string): Promise<void> {
        const items = contentBatch.split('\n').filter(line => line.trim());
        
        for (const item of items) {
            await this.createNote(item.trim());
        }
    }

    /**
     * Insert content at cursor position in editor
     */
    async insertContentAtEditorCursorPosition(content: string, editor: Editor): Promise<void> {
        try {
            const isUrl = content.match(/^https?:\/\//);
            
            if (isUrl) {
                // Fetch and insert article content
                const articleContent = await this.fetchArticleContent(content);
                if (articleContent) {
                    editor.replaceSelection(articleContent);
                } else {
                    editor.replaceSelection(`[Article](${content})\n\nFailed to fetch content.`);
                }
            } else {
                editor.replaceSelection(content);
            }
        } catch (error) {
            console.error('Error inserting content:', error);
            new Notice('Failed to insert content');
        }
    }

    /**
     * Get markdown content from URL without creating a note
     * This is used when we want to append parsed content to existing files
     */
    async getMarkdownContent(content: string): Promise<string | null> {
        try {
            const isUrl = content.match(/^https?:\/\//);
            
            if (isUrl) {
                // Fetch article content as markdown
                return await this.fetchArticleContent(content);
            } else {
                // If it's not a URL, just return the content
                return content;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error getting markdown content:', errorMessage);
            return null;
        }
    }

    /**
     * Create a note from a URL by fetching its content
     */
    private async createNoteFromUrl(url: string): Promise<void> {
        new Notice(`Fetching content from: ${url}`);
        
        const content = await this.fetchArticleContent(url);
        
        if (!content) {
            new Notice('Failed to fetch article content');
            return;
        }

        // Generate filename from URL
        const filename = this.generateFilenameFromUrl(url);
        const notePath = `${filename}.md`;

        // Create the note
        await this.app.vault.create(notePath, content);
        new Notice(`Created note: ${filename}`);
    }

    /**
     * Create a note from plain text
     */
    private async createNoteFromText(text: string): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Note-${timestamp}`;
        const notePath = `${filename}.md`;

        await this.app.vault.create(notePath, text);
        new Notice(`Created note: ${filename}`);
    }

    /**
     * Fetch article content from URL
     */
    private async fetchArticleContent(url: string): Promise<string | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            const plainText = this.extractTextFromHtml(html);
            
            return `# Article from ${url}\n\n**Source:** ${url}\n\n${plainText}`;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error fetching article from ${url}:`, errorMessage);
            return null;
        }
    }

    /**
     * Extract text content from HTML
     */
    private extractTextFromHtml(html: string): string {
        // Remove script and style elements
        let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
        text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
        
        // Remove HTML tags
        text = text.replace(/<[^>]+>/g, ' ');
        
        // Decode HTML entities
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&apos;/g, "'");
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ');
        text = text.trim();
        
        // Limit length to avoid huge notes
        const maxLength = 50000;
        if (text.length > maxLength) {
            text = text.substring(0, maxLength) + '\n\n[Content truncated...]';
        }
        
        return text;
    }

    /**
     * Generate a valid filename from a URL
     */
    private generateFilenameFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            let filename = urlObj.hostname.replace(/^www\./, '') + urlObj.pathname;
            
            // Clean up the filename
            filename = filename
                .replace(/[^a-zA-Z0-9-_]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .substring(0, 100); // Limit length
            
            return filename || 'article';
        } catch {
            return `article-${Date.now()}`;
        }
    }
}

/**
 * Stub implementation of ReadItLaterApi that wraps NoteService
 * This matches the interface of the real ReadItLater plugin's API
 */
export class ReadItLaterApi {
    constructor(private noteService: NoteService) {}

    /**
     * Create single note from provided input (URL or text)
     */
    public async processContent(content: string): Promise<void> {
        await this.noteService.createNote(content);
    }

    /**
     * Create multiple notes from provided input delimited by newlines
     */
    public async processContentBatch(contentBatch: string): Promise<void> {
        await this.noteService.createNotesFromBatch(contentBatch);
    }

    /**
     * Insert processed content from input at current position in editor
     */
    public async insertContentAtEditorCursorPosition(content: string, editor: Editor): Promise<void> {
        await this.noteService.insertContentAtEditorCursorPosition(content, editor);
    }

    /**
     * Get parsed markdown content from URL without creating a note
     * This is used for appending to existing files
     */
    public async getMarkdownContent(content: string): Promise<string | null> {
        return await this.noteService.getMarkdownContent(content);
    }
}

/**
 * Helper function to check if the real ReadItLater plugin is installed
 */
export function isReadItLaterInstalled(app: App): boolean {
    // @ts-ignore - accessing internal plugin structure
    return app.plugins?.plugins?.['obsidian-read-it-later'] !== undefined;
}

/**
 * Enhanced NoteService wrapper that uses ReadItLater's parser when available
 */
class EnhancedNoteService extends NoteService {
    private readItLaterNoteService: any;
    
    constructor(app: App, readItLaterNoteService?: any) {
        super(app);
        this.readItLaterNoteService = readItLaterNoteService;
    }
    
    /**
     * Override getMarkdownContent to use ReadItLater's parser when available
     */
    async getMarkdownContent(content: string): Promise<string | null> {
        // If ReadItLater NoteService is available, use it to get better parsed content
        if (this.readItLaterNoteService) {
            try {
                // Access ReadItLater's internal makeNote method
                // @ts-ignore - accessing private method
                if (this.readItLaterNoteService.makeNote) {
                    // @ts-ignore
                    const note = await this.readItLaterNoteService.makeNote(content);
                    if (note && note.content) {
                        console.log('Using ReadItLater parser for markdown generation');
                        return note.content;
                    }
                }
            } catch (error) {
                console.warn('Failed to use ReadItLater parser, falling back to basic parsing:', error);
            }
        }
        
        // Fall back to basic HTML parsing
        console.log('Using basic HTML parser for markdown generation');
        return await super.getMarkdownContent(content);
    }
    
    /**
     * Use ReadItLater's createNote if available
     */
    async createNote(content: string): Promise<void> {
        if (this.readItLaterNoteService) {
            try {
                await this.readItLaterNoteService.createNote(content);
                return;
            } catch (error) {
                console.warn('Failed to use ReadItLater createNote:', error);
            }
        }
        await super.createNote(content);
    }
    
    /**
     * Use ReadItLater's batch processing if available
     */
    async createNotesFromBatch(contentBatch: string): Promise<void> {
        if (this.readItLaterNoteService) {
            try {
                await this.readItLaterNoteService.createNotesFromBatch(contentBatch);
                return;
            } catch (error) {
                console.warn('Failed to use ReadItLater batch processing:', error);
            }
        }
        await super.createNotesFromBatch(contentBatch);
    }
}

/**
 * Get NoteService - either from ReadItLater plugin or use stub
 */
export function getNoteService(app: App): NoteService {
    // Try to get the real ReadItLater plugin's NoteService
    if (isReadItLaterInstalled(app)) {
        try {
            // @ts-ignore - accessing internal plugin structure
            const readItLaterPlugin = app.plugins.plugins['obsidian-read-it-later'];
            
            // If the plugin exposes a NoteService, use enhanced wrapper
            if (readItLaterPlugin.noteService) {
                console.log('Using ReadItLater plugin with enhanced wrapper');
                return new EnhancedNoteService(app, readItLaterPlugin.noteService);
            }
        } catch (error) {
            console.warn('ReadItLater plugin found but could not access NoteService:', error);
        }
    }
    
    // Fall back to stub implementation
    console.log('Using stub NoteService implementation');
    return new NoteService(app);
}
