import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';
import logger from '../logger';
import { config } from '../configs/Config';

class AlertsConfig {
    private config: Record<string, any>;
    private readonly ALERTS_CONFIG_FILE = 'alertsConfig.json';

    constructor() {
        const configDir = config.alerts_rules.config_path || path.resolve(process.cwd(), 'src/configs');
        const configPath = path.join(configDir, this.ALERTS_CONFIG_FILE);
        const configContent = fs.readFileSync(configPath, 'utf8');
        this.config = JSON.parse(configContent);
        logger.info(`Alerts config loaded from: ${configPath}`);
    }

    find(path: string): any {
        return _.get(this.config, path.split('.'));
    }
}

export const alertConfig = new AlertsConfig();