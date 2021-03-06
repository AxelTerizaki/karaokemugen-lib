import { promises as fs } from 'fs';
import i18n from 'i18next';
import i18nextBackend from 'i18next-node-fs-backend';
import {dump as yamlDump, load as yamlLoad} from 'js-yaml';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import osLocale from 'os-locale';
import {resolve} from 'path';
import { v4 as uuidV4 } from 'uuid';

import { Config } from '../../types/config';
import { getState, setState } from '../../utils/state';
import { RecursivePartial } from '../types';
import { RepositoryType } from '../types/repo';
import { asyncExists } from './files';
import logger from './logger';
import { clearEmpties, difference } from './objectHelpers';
import { on } from './pubsub';
import { check,testJSON } from './validators';

let configReady = false;
let config: Config;
let configFile = 'config.yml';
let configConstraints = {};
let configDefaults: Config;

on('configReady', () => {
	configReady = true;
});

export function setConfigConstraints(constraints: any) {
	configConstraints = constraints;
}

/**
 * We return a copy of the configuration data so the original one can't be modified
 * without passing by this module's functions.
 */
export function getConfig(): Config {
	return {...config};
}

export function configureIDs() {
	if (config.App.JwtSecret === 'Change me') setConfig({App: {JwtSecret: uuidV4() }});
}

export function verifyConfig(conf: Config) {
	const validationErrors = check(conf, configConstraints);
	if (validationErrors) {
		throw new Error(`Config is not valid: ${JSON.stringify(validationErrors)}`);
	}
}

export async function loadConfigFiles(dataPath: string, file: string, defaults: Config, appPath: string) {
	if (file) configFile = file;
	configDefaults = cloneDeep(defaults);
	config = merge(config, defaults);
	const dataConfigFile = resolve(dataPath, configFile);
	const appConfigFile = resolve(appPath, configFile);
	const databaseConfigFile = resolve(dataPath, 'database.json');
	if (await asyncExists(appConfigFile)) {
		configFile = appConfigFile;
	} else if (await asyncExists(dataConfigFile)) {
		configFile = dataConfigFile;
	} else if (file) {
		// If a custom file name is provided but we were unable to load it from app or data dirs, we're throwing here :
		throw new Error(`File ${file} not found in either app or data folders`);
	} else {
		// No custom file specified, we're going to use dataDir by default
		configFile = dataConfigFile;
	}
	if (await asyncExists(configFile)) await loadConfig(configFile);
	//Delete this after 5.1 hits.
	if (await asyncExists(databaseConfigFile)) {
		const dbConfig = await loadDBConfig(databaseConfigFile);
		const dbConfigObj = {
			username: dbConfig.prod.user,
			password: dbConfig.prod.password,
			host: dbConfig.prod.host,
			port: dbConfig.prod.port,
			database: dbConfig.prod.database,
			superuser: dbConfig.prod.superuser,
			superuserPassword: dbConfig.prod.superuserPassword,
			bundledPostgresBinary: dbConfig.prod.bundledPostgresBinary
		};
		config.System.Database = merge(config.System.Database, dbConfigObj);
		await fs.unlink(databaseConfigFile);
		await updateConfig(config);
	}

}

export async function loadDBConfig(configFile: string) {
	const configData = await fs.readFile(configFile, 'utf-8');
	if (!testJSON(configData)) {
		logger.error('Database config file is not valid JSON', {service: 'Config'});
		throw new Error('Syntax error in database.json');
	}
	return JSON.parse(configData);
}

export async function loadConfig(configFile: string) {
	try {
		logger.debug(`Reading configuration file ${configFile}`, {service: 'Config'});
		const content = await fs.readFile(configFile, 'utf-8');
		const parsedContent = yamlLoad(content);
		clearEmpties(parsedContent);
		const newConfig = merge(config, parsedContent);
		verifyConfig(newConfig);
		config = newConfig;
	} catch(err) {
		logger.error(`Unable to read config file ${configFile}`, {service: 'Config', obj: err});
		throw err;
	}
}

export async function configureLocale() {
	let detectedLocale = await osLocale();
	detectedLocale = detectedLocale.substring(0, 2);
	await i18n.use(i18nextBackend).init({
		fallbackLng: 'en',
		lng: detectedLocale,
		backend: {
			loadPath: resolve(getState().resourcePath, 'locales/{{lng}}.json')
		}
	});
	setState( {defaultLocale: detectedLocale });
}

export function setConfig(configPart: RecursivePartial<Config>) {
	config = merge(config, configPart);
	if (configReady) updateConfig(config);
	return getConfig();
}

export function resolvedPathSponsors() {
	return config.System.Path.Sponsors.map(path => resolve(getState().dataPath, path));
}

export function resolvedPathRepos(type: RepositoryType, repo?: string): string[] {
	const paths = [];
	let repos = cloneDeep(config.System.Repositories);
	// If a repo is supplied, we get only that repo. If not only the enabled ones
	repos = repo
		? repos.filter(r => r.Name === repo)
		: repos.filter(r => r.Enabled);
	if (type === 'Medias') {
		repos.forEach(repo => repo.Path.Medias.map(path => paths.push(resolve(getState().dataPath, path))));
	} else {
		repos.forEach(repo => paths.push(resolve(getState().dataPath, repo.BaseDir, type.toLowerCase())));
	}
	return paths;
}

export function resolvedPathIntros() {
	return config.System.Path.Intros.map(path => resolve(getState().dataPath, path));
}

export function resolvedPathOutros() {
	return config.System.Path.Outros.map(path => resolve(getState().dataPath, path));
}

export function resolvedPathEncores() {
	return config.System.Path.Encores.map(path => resolve(getState().dataPath, path));
}

export function resolvedPathJingles() {
	return config.System.Path.Jingles.map(path => resolve(getState().dataPath, path));
}

export function resolvedPathBundledBackgrounds() {
	return resolve(getState().dataPath, 'bundledBackgrounds');
}

export function resolvedPathBackgrounds() {
	return config.System.Path.Backgrounds.map(path => resolve(getState().dataPath, path));
}

export function resolvedPathImport() {
	return resolve(getState().dataPath, config.System.Path.Import);
}

export function resolvedPathTemp() {
	return resolve(getState().dataPath, config.System.Path.Temp);
}

export function resolvedPathSessionExports() {
	return resolve(getState().dataPath, config.System.Path.SessionExports);
}

export function resolvedPathPreviews() {
	return resolve(getState().dataPath, config.System.Path.Previews);
}

export function resolvedPathAvatars() {
	return resolve(getState().dataPath, config.System.Path.Avatars);
}

export function resolvedPathStreamFiles() {
	return resolve(getState().dataPath, config.System.Path.StreamFiles);
}

export async function updateConfig(newConfig: Config) {
	const filteredConfig: RecursivePartial<Config> = difference(newConfig, configDefaults);
	clearEmpties(filteredConfig);
	await fs.writeFile(configFile, yamlDump(filteredConfig), 'utf-8');
}
