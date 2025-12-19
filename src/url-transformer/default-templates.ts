import { TransformationRule } from './transformation-types';

export function getDefaultTransformationRules(): TransformationRule[] {
    return [
        {
            id: 'freedium-medium',
            name: 'Medium via Freedium',
            enabled: false,
            matchers: ['*.medium.com', 'medium.com'],
            transformationType: 'prefix',
            template: 'https://freedium-mirror.cfd/{url}',
            priority: 100
        },
        {
            id: '12ft-ladder',
            name: '12ft Ladder (General Paywall Bypass)',
            enabled: false,
            matchers: ['*'],
            transformationType: 'prefix',
            template: 'https://12ft.io/{url}',
            priority: 10
        },
        {
            id: 'archive-today',
            name: 'Archive.today',
            enabled: false,
            matchers: ['*'],
            transformationType: 'prefix',
            template: 'https://archive.is/{url}',
            priority: 20
        }
    ];
}
