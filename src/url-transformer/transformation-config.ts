import { App } from 'obsidian';
import { TransformationConfig, TransformationRule } from './transformation-types';
import { getDefaultTransformationRules } from './default-templates';

const CONFIG_FILE_PATH = '.obsidian/url-transformations.json';

export class TransformationConfigManager {
    private app: App;
    private config: TransformationConfig | null = null;

    constructor(app: App) {
        this.app = app;
    }

    getDefaultConfig(): TransformationConfig {
        return {
            rules: getDefaultTransformationRules(),
            proxyHealthCacheTtlMinutes: 5,
            proxyHealthTimeoutMs: 5000
        };
    }

    async loadConfig(): Promise<TransformationConfig> {
        try {
            const configFile = this.app.vault.getAbstractFileByPath(CONFIG_FILE_PATH);
            
            if (!configFile) {
                const defaultConfig = this.getDefaultConfig();
                await this.saveConfig(defaultConfig);
                this.config = defaultConfig;
                return defaultConfig;
            }

            const content = await this.app.vault.read(configFile as any);
            const loadedConfig = JSON.parse(content) as TransformationConfig;

            const mergedConfig = this.mergeWithDefaults(loadedConfig);
            this.config = mergedConfig;
            return mergedConfig;
        } catch (error) {
            console.error('Error loading transformation config:', error);
            const defaultConfig = this.getDefaultConfig();
            this.config = defaultConfig;
            return defaultConfig;
        }
    }

    private mergeWithDefaults(loadedConfig: TransformationConfig): TransformationConfig {
        const defaultRules = getDefaultTransformationRules();
        const loadedRuleIds = new Set(loadedConfig.rules.map(r => r.id));

        const newDefaultRules = defaultRules.filter(dr => !loadedRuleIds.has(dr.id));

        return {
            rules: [...loadedConfig.rules, ...newDefaultRules],
            proxyHealthCacheTtlMinutes: loadedConfig.proxyHealthCacheTtlMinutes ?? 5,
            proxyHealthTimeoutMs: loadedConfig.proxyHealthTimeoutMs ?? 5000
        };
    }

    async saveConfig(config: TransformationConfig): Promise<void> {
        try {
            const configJson = JSON.stringify(config, null, 2);
            
            const configFile = this.app.vault.getAbstractFileByPath(CONFIG_FILE_PATH);
            
            if (configFile) {
                await this.app.vault.modify(configFile as any, configJson);
            } else {
                await this.app.vault.create(CONFIG_FILE_PATH, configJson);
            }

            this.config = config;
        } catch (error) {
            console.error('Error saving transformation config:', error);
            throw error;
        }
    }

    getConfig(): TransformationConfig {
        if (!this.config) {
            throw new Error('Config not loaded. Call loadConfig() first.');
        }
        return this.config;
    }

    async addRule(rule: TransformationRule): Promise<void> {
        const config = this.getConfig();
        config.rules.push(rule);
        await this.saveConfig(config);
    }

    async updateRule(ruleId: string, updates: Partial<TransformationRule>): Promise<void> {
        const config = this.getConfig();
        const ruleIndex = config.rules.findIndex(r => r.id === ruleId);
        
        if (ruleIndex === -1) {
            throw new Error(`Rule with id ${ruleId} not found`);
        }

        config.rules[ruleIndex] = { ...config.rules[ruleIndex], ...updates };
        await this.saveConfig(config);
    }

    async deleteRule(ruleId: string): Promise<void> {
        const config = this.getConfig();
        config.rules = config.rules.filter(r => r.id !== ruleId);
        await this.saveConfig(config);
    }

    async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
        await this.updateRule(ruleId, { enabled });
    }

    async reorderRules(ruleIds: string[]): Promise<void> {
        const config = this.getConfig();
        const ruleMap = new Map(config.rules.map(r => [r.id, r]));
        
        const reorderedRules = ruleIds
            .map(id => ruleMap.get(id))
            .filter((r): r is TransformationRule => r !== undefined);

        const missingRules = config.rules.filter(r => !ruleIds.includes(r.id));
        
        config.rules = [...reorderedRules, ...missingRules];
        await this.saveConfig(config);
    }
}
