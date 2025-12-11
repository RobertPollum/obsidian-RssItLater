import { App, TFile, Notice, getFrontMatterInfo, parseYaml } from 'obsidian';
import { ReadItLaterApi, NoteService } from './ReadItLaterStubs';

/**
 * Script to extract metadata link from an Obsidian markdown file
 * and parse it using the ReadItLater plugin
 */
export class MetadataLinkParser {
    private app: App;
    private readItLaterApi: ReadItLaterApi;

    constructor(app: App, noteService: NoteService) {
        this.app = app;
        this.readItLaterApi = new ReadItLaterApi(noteService);
    }

    /**
     * Check if a file has already been processed
     * Looks for 'article_processed: true' in frontmatter
     */
    private async isFileProcessed(file: TFile): Promise<boolean> {
        try {
            const content = await this.app.vault.read(file);
            const frontMatterInfo = getFrontMatterInfo(content);
            
            if (!frontMatterInfo.exists) {
                return false;
            }

            const frontmatterText = content.substring(
                frontMatterInfo.from,
                frontMatterInfo.to
            );

            const frontmatter = parseYaml(frontmatterText);
            return frontmatter?.article_processed === true;
        } catch (error) {
            console.error('Error checking if file is processed:', error);
            return false;
        }
    }

    /**
     * Mark a file as processed by adding 'article_processed: true' to frontmatter
     */
    private async markFileAsProcessed(file: TFile): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            const frontMatterInfo = getFrontMatterInfo(content);
            
            if (!frontMatterInfo.exists) {
                // Add new frontmatter
                const newContent = `---\narticle_processed: true\n---\n\n${content}`;
                await this.app.vault.modify(file, newContent);
            } else {
                // Update existing frontmatter
                const frontmatterText = content.substring(
                    frontMatterInfo.from,
                    frontMatterInfo.to
                );
                const frontmatter = parseYaml(frontmatterText);
                
                // Only add if not already present
                if (frontmatter?.article_processed !== true) {
                    const updatedFrontmatter = { ...frontmatter, article_processed: true };
                    const yamlLines = Object.entries(updatedFrontmatter)
                        .map(([key, value]) => `${key}: ${value}`);
                    const newFrontmatter = `---\n${yamlLines.join('\n')}\n---`;
                    
                    const beforeFrontmatter = content.substring(0, frontMatterInfo.from);
                    const afterFrontmatter = content.substring(frontMatterInfo.to);
                    const newContent = beforeFrontmatter + newFrontmatter + afterFrontmatter;
                    
                    await this.app.vault.modify(file, newContent);
                }
            }
        } catch (error) {
            console.error('Error marking file as processed:', error);
        }
    }

    /**
     * Extract URL from file's frontmatter metadata
     * Supports both 'url', 'link', and 'source' fields
     */
    private extractUrlFromFrontmatter(fileContent: string): string | null {
        const frontMatterInfo = getFrontMatterInfo(fileContent);
        
        if (!frontMatterInfo.exists) {
            return null;
        }

        const frontmatterText = fileContent.substring(
            frontMatterInfo.from,
            frontMatterInfo.to
        );

        try {
            const frontmatter = parseYaml(frontmatterText);
            
            // Check common URL field names
            const urlFields = ['url', 'link', 'source', 'web_url', 'article_url'];
            for (const field of urlFields) {
                if (frontmatter && frontmatter[field]) {
                    return frontmatter[field];
                }
            }
        } catch (error) {
            console.error('Error parsing frontmatter:', error);
        }

        return null;
    }

    /**
     * Extract URL from markdown content (first link found)
     */
    private extractUrlFromContent(content: string): string | null {
        // Match markdown links [text](url)
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
        const match = content.match(markdownLinkRegex);
        
        if (match && match[2]) {
            return match[2];
        }

        // Match plain URLs
        const urlRegex = /(https?:\/\/[^\s]+)/;
        const urlMatch = content.match(urlRegex);
        
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1];
        }

        return null;
    }

    /**
     * Process a file: extract URL and fetch article information via ReadItLater
     * Creates a new note with the article content
     */
    async processFile(file: TFile): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            
            // Try to extract URL from frontmatter first
            let url = this.extractUrlFromFrontmatter(content);
            
            // If not found in frontmatter, try content
            if (!url) {
                url = this.extractUrlFromContent(content);
            }

            if (!url) {
                new Notice(`No URL found in file: ${file.name}`);
                console.warn(`No URL found in file: ${file.path}`);
                return;
            }

            new Notice(`Processing URL: ${url}`);
            console.log(`Extracted URL from ${file.path}: ${url}`);

            // Use ReadItLater API to process the URL
            await this.readItLaterApi.processContent(url);
            
            new Notice(`Successfully processed article from: ${url}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`Error processing file: ${errorMessage}`);
            console.error(`Error processing file ${file.path}:`, error);
        }
    }

    /**
     * Process a file and append the retrieved article content to the existing file
     * instead of creating a new note.
     * Uses ReadItLater plugin's parser if available for better markdown generation.
     * 
     * @param file - The file to process
     * @param checkProcessed - If true, checks if file was already processed (for batch operations)
     */
    async processFileAndAppend(file: TFile, checkProcessed: boolean = false): Promise<void> {
        try {
            // Check if already processed (only in batch mode)
            if (checkProcessed && await this.isFileProcessed(file)) {
                console.log(`Skipping already processed file: ${file.path}`);
                return;
            }

            const content = await this.app.vault.read(file);
            
            // Try to extract URL from frontmatter first
            let url = this.extractUrlFromFrontmatter(content);
            
            // If not found in frontmatter, try content
            if (!url) {
                url = this.extractUrlFromContent(content);
            }

            if (!url) {
                new Notice(`No URL found in file: ${file.name}`);
                console.warn(`No URL found in file: ${file.path}`);
                return;
            }

            new Notice(`Fetching and parsing article from: ${url}`);
            console.log(`Extracted URL from ${file.path}: ${url}`);

            // Use ReadItLater API to get parsed markdown content
            // This will use ReadItLater's sophisticated parser if available,
            // or fall back to basic HTML parsing if not
            const articleMarkdown = await this.readItLaterApi.getMarkdownContent(url);
            
            if (!articleMarkdown) {
                new Notice(`Failed to fetch content from: ${url}`);
                return;
            }

            // Append content to the existing file
            const separator = '\n\n---\n\n## Retrieved Article Content\n\n';
            const contentToAppend = separator + articleMarkdown;
            
            await this.app.vault.append(file, contentToAppend);
            
            // Mark as processed (only in batch mode)
            if (checkProcessed) {
                await this.markFileAsProcessed(file);
            }
            
            new Notice(`Successfully appended article content to: ${file.name}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`Error processing file: ${errorMessage}`);
            console.error(`Error processing file ${file.path}:`, error);
        }
    }


    /**
     * Process all files in a folder
     */
    async processFolderFiles(folderPath: string): Promise<void> {
        const files = this.app.vault.getMarkdownFiles().filter(
            (file: TFile) => file.path.startsWith(folderPath)
        );

        if (files.length === 0) {
            new Notice(`No markdown files found in: ${folderPath}`);
            return;
        }

        new Notice(`Processing ${files.length} files...`);

        for (const file of files) {
            await this.processFile(file);
        }

        new Notice(`Completed processing ${files.length} files`);
    }

    /**
     * Process current active file and create a new note
     */
    async processActiveFile(): Promise<void> {
        const activeFile = this.app.workspace.getActiveFile();
        
        if (!activeFile) {
            new Notice('No active file found');
            return;
        }

        await this.processFile(activeFile);
    }

    /**
     * Process current active file and append content to it
     */
    async processActiveFileAndAppend(): Promise<void> {
        const activeFile = this.app.workspace.getActiveFile();
        
        if (!activeFile) {
            new Notice('No active file found');
            return;
        }

        await this.processFileAndAppend(activeFile);
    }

    /**
     * Process all files in a folder and append content to each
     * Skips files that have already been processed (have article_processed: true)
     */
    async processFolderFilesAndAppend(folderPath: string): Promise<void> {
        const files = this.app.vault.getMarkdownFiles().filter(
            (file: TFile) => file.path.startsWith(folderPath)
        );

        if (files.length === 0) {
            new Notice(`No markdown files found in: ${folderPath}`);
            return;
        }

        new Notice(`Processing ${files.length} files...`);

        let processedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const wasProcessed = await this.isFileProcessed(file);
            if (wasProcessed) {
                skippedCount++;
            } else {
                processedCount++;
            }
            // Pass checkProcessed: true to enable tracking
            await this.processFileAndAppend(file, true);
        }

        new Notice(`Completed: ${processedCount} processed, ${skippedCount} skipped (already processed)`);
    }

    /**
     * Batch process multiple URLs from a file
     * Expects URLs to be separated by newlines
     */
    async processUrlBatch(file: TFile): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            const urls = content
                .split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line.match(/^https?:\/\//));

            if (urls.length === 0) {
                new Notice('No URLs found in file');
                return;
            }

            new Notice(`Processing ${urls.length} URLs...`);

            // Join URLs with delimiter and process as batch
            const urlBatch = urls.join('\n');
            await this.readItLaterApi.processContentBatch(urlBatch);

            new Notice(`Successfully processed ${urls.length} URLs`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`Error processing URL batch: ${errorMessage}`);
            console.error('Error processing URL batch:', error);
        }
    }
}

/**
 * Example usage function - can be called from Obsidian command palette
 * Creates a new note with the article content
 */
export async function parseMetadataLink(app: App, noteService: NoteService) {
    const parser = new MetadataLinkParser(app, noteService);
    await parser.processActiveFile();
}

/**
 * Parse metadata link and append to the existing file
 */
export async function parseMetadataLinkAndAppend(app: App, noteService: NoteService) {
    const parser = new MetadataLinkParser(app, noteService);
    await parser.processActiveFileAndAppend();
}

/**
 * Example usage for batch processing
 */
export async function parseMetadataLinksInFolder(
    app: App, 
    noteService: NoteService, 
    folderPath: string
) {
    const parser = new MetadataLinkParser(app, noteService);
    await parser.processFolderFiles(folderPath);
}
