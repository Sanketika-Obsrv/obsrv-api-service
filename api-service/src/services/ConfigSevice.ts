import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';

export class Config {
    private static instance: Config;
    private config: Record<string, any>;
    private readonly ALERTS_CONFIG_FILE = 'alertsConfig.json';

    private constructor() {
        const configDir = process.env.alerts_config_path || path.resolve(process.cwd(), 'src/configs');
        const configPath = path.join(configDir, this.ALERTS_CONFIG_FILE);
        const configContent = fs.readFileSync(configPath, 'utf8');
        this.config = JSON.parse(configContent);
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    public find(path: string): any {
        return _.get(this.config, path.split('.'));
    }
}