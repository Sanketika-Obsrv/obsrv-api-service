import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';

export class Config {
    private static instance: Config;
    private config: Record<string, any>;

    private constructor() {
        const configPath = process.env.CONFIG_PATH || path.resolve(process.cwd(), 'src/configs/AlertConfig.json');
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