import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { TransformationConfigManager } from '../url-transformer/transformation-config';
import { TransformationRule } from '../url-transformer/transformation-types';
import { UrlTransformer } from '../url-transformer/url-transformer';

export class UrlTransformerSettingTab extends PluginSettingTab {
    private configManager: TransformationConfigManager;
    private plugin: any;

    constructor(app: App, plugin: any, configManager: TransformationConfigManager) {
        super(app, plugin);
        this.plugin = plugin;
        this.configManager = configManager;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'URL Transformation Settings' });

        this.displayHealthCheckSettings();
        this.displayRulesList();
        this.displayAddRuleButton();
    }

    private displayHealthCheckSettings(): void {
        const { containerEl } = this;
        const config = this.configManager.getConfig();

        containerEl.createEl('h3', { text: 'Proxy Health Check' });

        new Setting(containerEl)
            .setName('Cache TTL (minutes)')
            .setDesc('How long to cache proxy health check results')
            .addSlider(slider => slider
                .setLimits(1, 30, 1)
                .setValue(config.proxyHealthCacheTtlMinutes)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    config.proxyHealthCacheTtlMinutes = value;
                    await this.configManager.saveConfig(config);
                }));

        new Setting(containerEl)
            .setName('Health check timeout (seconds)')
            .setDesc('Maximum time to wait for proxy health check')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(config.proxyHealthTimeoutMs / 1000)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    config.proxyHealthTimeoutMs = value * 1000;
                    await this.configManager.saveConfig(config);
                }));

        new Setting(containerEl)
            .setName('Test all proxies')
            .setDesc('Check the health of all enabled proxy services')
            .addButton(button => button
                .setButtonText('Test Now')
                .onClick(async () => {
                    button.setDisabled(true);
                    button.setButtonText('Testing...');
                    
                    const transformer = new UrlTransformer(
                        config.proxyHealthCacheTtlMinutes,
                        config.proxyHealthTimeoutMs
                    );
                    
                    const results = await transformer.testAllProxies(config.rules);
                    
                    let message = 'Proxy Health Check Results:\n';
                    results.forEach((healthy, name) => {
                        message += `\n${name}: ${healthy ? '✓ Healthy' : '✗ Down'}`;
                    });
                    
                    new Notice(message, 10000);
                    
                    button.setDisabled(false);
                    button.setButtonText('Test Now');
                }));
    }

    private displayRulesList(): void {
        const { containerEl } = this;
        const config = this.configManager.getConfig();

        containerEl.createEl('h3', { text: 'Transformation Rules' });

        const rulesContainer = containerEl.createDiv({ cls: 'url-transformer-rules' });

        if (config.rules.length === 0) {
            rulesContainer.createEl('p', { 
                text: 'No transformation rules configured.',
                cls: 'setting-item-description'
            });
            return;
        }

        const sortedRules = [...config.rules].sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            this.displayRule(rulesContainer, rule);
        }
    }

    private displayRule(container: HTMLElement, rule: TransformationRule): void {
        const ruleSetting = new Setting(container)
            .setName(rule.name)
            .setDesc(this.getRuleDescription(rule));

        ruleSetting.addToggle(toggle => toggle
            .setValue(rule.enabled)
            .onChange(async (value) => {
                await this.configManager.toggleRule(rule.id, value);
                new Notice(`${rule.name} ${value ? 'enabled' : 'disabled'}`);
            }));

        ruleSetting.addButton(button => button
            .setButtonText('Edit')
            .onClick(() => {
                this.showEditRuleModal(rule);
            }));

        const isDefaultRule = ['freedium-medium', '12ft-ladder', 'archive-today'].includes(rule.id);
        if (!isDefaultRule) {
            ruleSetting.addButton(button => button
                .setButtonText('Delete')
                .setWarning()
                .onClick(async () => {
                    await this.configManager.deleteRule(rule.id);
                    new Notice(`Deleted rule: ${rule.name}`);
                    this.display();
                }));
        }
    }

    private getRuleDescription(rule: TransformationRule): string {
        const matchersText = rule.matchers.join(', ');
        const typeText = rule.transformationType === 'prefix' ? 'Prefix' : 'Path Extraction';
        return `Type: ${typeText} | Matches: ${matchersText} | Priority: ${rule.priority}`;
    }

    private displayAddRuleButton(): void {
        const { containerEl } = this;

        new Setting(containerEl)
            .setName('Add custom rule')
            .setDesc('Create a new URL transformation rule')
            .addButton(button => button
                .setButtonText('Add Rule')
                .setCta()
                .onClick(() => {
                    this.showAddRuleModal();
                }));
    }

    private showAddRuleModal(): void {
        const modal = new RuleEditorModal(
            this.app,
            null,
            async (rule) => {
                await this.configManager.addRule(rule);
                new Notice(`Added rule: ${rule.name}`);
                this.display();
            }
        );
        modal.open();
    }

    private showEditRuleModal(rule: TransformationRule): void {
        const modal = new RuleEditorModal(
            this.app,
            rule,
            async (updatedRule) => {
                await this.configManager.updateRule(rule.id, updatedRule);
                new Notice(`Updated rule: ${updatedRule.name}`);
                this.display();
            }
        );
        modal.open();
    }
}

class RuleEditorModal extends Modal {
    private rule: TransformationRule | null;
    private onSave: (rule: TransformationRule) => void;
    
    private nameInput: HTMLInputElement;
    private matchersInput: HTMLTextAreaElement;
    private typeSelect: HTMLSelectElement;
    private templateInput: HTMLInputElement;
    private priorityInput: HTMLInputElement;

    constructor(app: App, rule: TransformationRule | null, onSave: (rule: TransformationRule) => void) {
        super(app);
        this.rule = rule;
        this.onSave = onSave;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.rule ? 'Edit Rule' : 'Add New Rule' });

        new Setting(contentEl)
            .setName('Rule name')
            .setDesc('Display name for this transformation rule')
            .addText(text => {
                this.nameInput = text.inputEl;
                text.setValue(this.rule?.name || '')
                    .setPlaceholder('e.g., Medium via Freedium');
            });

        new Setting(contentEl)
            .setName('URL matchers')
            .setDesc('Domain patterns to match (one per line). Use * for wildcard, *.domain.com for subdomains')
            .addTextArea(text => {
                this.matchersInput = text.inputEl;
                text.setValue(this.rule?.matchers.join('\n') || '')
                    .setPlaceholder('*.medium.com\nmedium.com');
                text.inputEl.rows = 4;
            });

        new Setting(contentEl)
            .setName('Transformation type')
            .setDesc('How to transform the URL')
            .addDropdown(dropdown => {
                this.typeSelect = dropdown.selectEl;
                dropdown
                    .addOption('prefix', 'Prefix (prepend proxy URL)')
                    .addOption('path-extraction', 'Path Extraction (extract and remap path)')
                    .setValue(this.rule?.transformationType || 'prefix');
            });

        new Setting(contentEl)
            .setName('Template')
            .setDesc('URL template. Use {url} for full URL, {path} for path, {domain} for domain')
            .addText(text => {
                this.templateInput = text.inputEl;
                text.setValue(this.rule?.template || '')
                    .setPlaceholder('https://proxy.com/{url}');
            });

        new Setting(contentEl)
            .setName('Priority')
            .setDesc('Higher priority rules are applied first (1-1000)')
            .addText(text => {
                this.priorityInput = text.inputEl;
                text.setValue(String(this.rule?.priority || 100))
                    .setPlaceholder('100');
                text.inputEl.type = 'number';
            });

        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Cancel')
                .onClick(() => this.close()))
            .addButton(button => button
                .setButtonText('Save')
                .setCta()
                .onClick(() => this.handleSave()));
    }

    private handleSave(): void {
        const name = this.nameInput.value.trim();
        const matchersText = this.matchersInput.value.trim();
        const template = this.templateInput.value.trim();
        const priority = parseInt(this.priorityInput.value) || 100;

        if (!name || !matchersText || !template) {
            new Notice('Please fill in all required fields');
            return;
        }

        const matchers = matchersText.split('\n').map(m => m.trim()).filter(m => m.length > 0);

        if (matchers.length === 0) {
            new Notice('Please provide at least one URL matcher');
            return;
        }

        const rule: TransformationRule = {
            id: this.rule?.id || `custom-${Date.now()}`,
            name,
            enabled: this.rule?.enabled ?? true,
            matchers,
            transformationType: this.typeSelect.value as any,
            template,
            priority
        };

        this.onSave(rule);
        this.close();
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

import { Modal } from 'obsidian';
