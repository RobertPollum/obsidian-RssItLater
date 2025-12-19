import { Plugin, TFile, TFolder, Menu } from 'obsidian';
import { MetadataLinkParser, parseMetadataLink, parseMetadataLinkAndAppend, parseMetadataLinksInFolder } from './parse-metadata-link';
import { NoteService, getNoteService, isReadItLaterInstalled } from './ReadItLaterStubs';
import { TransformationConfigManager } from './url-transformer/transformation-config';
import { UrlTransformerSettingTab } from './settings/url-transformer-settings';

/**
 * Example Obsidian Plugin that integrates the Metadata Link Parser
 * with the ReadItLater plugin
 */
export default class MetadataLinkParserPlugin extends Plugin {
    private noteService: NoteService;
    private configManager: TransformationConfigManager;

    private createParser(): MetadataLinkParser {
        const parser = new MetadataLinkParser(this.app, this.noteService);
        parser.setTransformationConfig(this.configManager.getConfig());
        return parser;
    }

    async onload() {
        console.log('Loading Metadata Link Parser Plugin');

        // Initialize NoteService - automatically detects and uses ReadItLater plugin if available
        this.noteService = getNoteService(this.app);
        
        // Initialize URL transformation config manager
        this.configManager = new TransformationConfigManager(this.app);
        await this.configManager.loadConfig();
        
        // Add settings tab
        this.addSettingTab(new UrlTransformerSettingTab(this.app, this, this.configManager));
        
        // Log which implementation is being used
        if (isReadItLaterInstalled(this.app)) {
            console.log('Metadata Link Parser: Using ReadItLater plugin');
        } else {
            console.log('Metadata Link Parser: Using built-in stub implementation');
        }

        // Command: Process active file (creates new note)
        this.addCommand({
            id: 'parse-active-file-link',
            name: 'Parse link from active file (create new note)',
            callback: async () => {
                const parser = this.createParser();
                await parser.processActiveFile();
            }
        });

        // Command: Process active file and append
        this.addCommand({
            id: 'parse-active-file-link-append',
            name: 'Parse link and append to active file',
            callback: async () => {
                const parser = this.createParser();
                await parser.processActiveFileAndAppend();
            }
        });

        // Command: Process folder (creates new notes)
        this.addCommand({
            id: 'parse-folder-links',
            name: 'Parse links from folder (create new notes)',
            callback: async () => {
                const folderPath = 'Articles';
                const parser = this.createParser();
                await parser.processFolderFiles(folderPath);
            }
        });

        // Command: Process folder and append
        this.addCommand({
            id: 'parse-folder-links-append',
            name: 'Parse links from folder and append to files',
            callback: async () => {
                const folderPath = 'Articles';
                const parser = this.createParser();
                await parser.processFolderFilesAndAppend(folderPath);
            }
        });

        // Command: Batch process URLs from a file
        this.addCommand({
            id: 'batch-process-urls',
            name: 'Batch process URLs from file',
            callback: async () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    return;
                }
                const parser = this.createParser();
                await parser.processUrlBatch(activeFile);
            }
        });

        // Add ribbon icon for append functionality
        this.addRibbonIcon('link', 'Parse link and append to file', async () => {
            const parser = this.createParser();
            await parser.processActiveFileAndAppend();
        });

        // Register context menu for folders
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file) => {
                // Only show menu item if it's a folder
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Append articles to files in folder')
                            .setIcon('link')
                            .onClick(async () => {
                                const parser = this.createParser();
                                await parser.processFolderFilesAndAppend(file.path);
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle('Create notes from links in folder')
                            .setIcon('file-plus')
                            .onClick(async () => {
                                const parser = this.createParser();
                                await parser.processFolderFiles(file.path);
                            });
                    });
                }

                // Also add context menu for individual files
                if (file instanceof TFile) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Append article to this file')
                            .setIcon('link')
                            .onClick(async () => {
                                const parser = this.createParser();
                                await parser.processFileAndAppend(file);
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle('Create note from link')
                            .setIcon('file-plus')
                            .onClick(async () => {
                                const parser = this.createParser();
                                await parser.processFile(file);
                            });
                    });
                }
            })
        );
    }


    onunload() {
        console.log('Unloading Metadata Link Parser Plugin');
    }
}
