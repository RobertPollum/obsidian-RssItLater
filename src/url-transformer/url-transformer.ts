import { requestUrl } from 'obsidian';
import { TransformationRule, TransformationResult, ProxyHealthCache } from './transformation-types';

const TEST_URL = 'https://example.com/test';

export class UrlTransformer {
    private healthCache: ProxyHealthCache = {};
    private cacheTtlMs: number;
    private timeoutMs: number;

    constructor(cacheTtlMinutes: number = 5, timeoutMs: number = 5000) {
        this.cacheTtlMs = cacheTtlMinutes * 60 * 1000;
        this.timeoutMs = timeoutMs;
    }

    private matchesPattern(url: string, pattern: string): boolean {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            if (pattern === '*') {
                return true;
            }

            if (pattern.startsWith('*.')) {
                const domain = pattern.substring(2);
                return hostname === domain || hostname.endsWith('.' + domain);
            }

            return hostname === pattern;
        } catch (error) {
            console.error('Error matching pattern:', error);
            return false;
        }
    }

    private matchesRule(url: string, rule: TransformationRule): boolean {
        if (!rule.enabled) {
            return false;
        }

        return rule.matchers.some(matcher => this.matchesPattern(url, matcher));
    }

    private findMatchingRule(url: string, rules: TransformationRule[]): TransformationRule | null {
        const matchingRules = rules.filter(rule => this.matchesRule(url, rule));
        
        if (matchingRules.length === 0) {
            return null;
        }

        matchingRules.sort((a, b) => b.priority - a.priority);
        return matchingRules[0];
    }

    private applyTransformation(url: string, rule: TransformationRule): string {
        const template = rule.template;

        switch (rule.transformationType) {
            case 'prefix':
                return template.replace('{url}', url);
            
            case 'path-extraction':
                try {
                    const urlObj = new URL(url);
                    const path = urlObj.pathname + urlObj.search + urlObj.hash;
                    const domain = urlObj.hostname;
                    
                    return template
                        .replace('{url}', url)
                        .replace('{path}', path)
                        .replace('{domain}', domain);
                } catch (error) {
                    console.error('Error extracting path:', error);
                    return template.replace('{url}', url);
                }
            
            default:
                return template.replace('{url}', url);
        }
    }

    private extractProxyBaseUrl(transformedUrl: string): string {
        try {
            const urlObj = new URL(transformedUrl);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        } catch (error) {
            console.error('Error extracting proxy base URL:', error);
            return transformedUrl;
        }
    }

    private isCacheValid(proxyBaseUrl: string): boolean {
        const cached = this.healthCache[proxyBaseUrl];
        if (!cached) {
            return false;
        }

        const now = Date.now();
        return (now - cached.lastChecked) < this.cacheTtlMs;
    }

    private async checkProxyHealthWithTimeout(url: string): Promise<boolean> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await requestUrl({
                url: url,
                method: 'HEAD',
            });

            clearTimeout(timeoutId);
            return response.status >= 200 && response.status < 400;
        } catch (error) {
            clearTimeout(timeoutId);
            console.warn(`Proxy health check failed for ${url}:`, error);
            return false;
        }
    }

    private async checkProxyHealth(proxyBaseUrl: string, rule: TransformationRule): Promise<boolean> {
        if (this.isCacheValid(proxyBaseUrl)) {
            return this.healthCache[proxyBaseUrl].healthy;
        }

        const testTransformedUrl = this.applyTransformation(TEST_URL, rule);
        let healthy = await this.checkProxyHealthWithTimeout(testTransformedUrl);

        if (!healthy) {
            healthy = await this.checkProxyHealthWithTimeout(proxyBaseUrl);
        }

        this.healthCache[proxyBaseUrl] = {
            healthy,
            lastChecked: Date.now()
        };

        return healthy;
    }

    async transformUrl(url: string, rules: TransformationRule[]): Promise<TransformationResult> {
        const matchingRule = this.findMatchingRule(url, rules);

        if (!matchingRule) {
            return {
                transformedUrl: url,
                originalUrl: url,
                proxyHealthy: true
            };
        }

        const transformedUrl = this.applyTransformation(url, matchingRule);
        const proxyBaseUrl = this.extractProxyBaseUrl(transformedUrl);

        const isHealthy = await this.checkProxyHealth(proxyBaseUrl, matchingRule);

        if (!isHealthy) {
            return {
                transformedUrl: null,
                originalUrl: url,
                appliedRule: matchingRule.name,
                proxyHealthy: false,
                error: `Proxy service "${matchingRule.name}" is currently unavailable`
            };
        }

        return {
            transformedUrl,
            originalUrl: url,
            appliedRule: matchingRule.name,
            proxyHealthy: true
        };
    }

    clearCache(): void {
        this.healthCache = {};
    }

    async testAllProxies(rules: TransformationRule[]): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();
        
        for (const rule of rules) {
            if (!rule.enabled) {
                continue;
            }

            const testUrl = this.applyTransformation(TEST_URL, rule);
            const proxyBaseUrl = this.extractProxyBaseUrl(testUrl);
            
            this.healthCache[proxyBaseUrl] = undefined as any;
            
            const healthy = await this.checkProxyHealth(proxyBaseUrl, rule);
            results.set(rule.name, healthy);
        }

        return results;
    }
}
