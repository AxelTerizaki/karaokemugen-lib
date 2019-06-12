import {asyncUnlink, sanitizeFile, asyncWriteFile, asyncReadFile, resolveFileInDirs, } from '../utils/files';
import testJSON from 'is-valid-json';
import {resolvedPathSeries} from '../../lib/utils/config';
import {basename, resolve} from 'path';
import { check, initValidators } from '../utils/validators';
import {uuidRegexp} from '../utils/constants';
import { Series, SeriesFile } from '../types/series';

const header = {
	version: 3,
	description: 'Karaoke Mugen Series File'
};

const seriesConstraintsV3 = {
	name: {presence: {allowEmpty: false}},
	aliases: {seriesAliasesValidator: true},
	sid: {presence: true, format: uuidRegexp},
	i18n: {seriesi18nValidator: true}
};

export async function readSeriesFile(seriesFile: string): Promise<Series> {
	let file: string;
	try {
		file = await resolveFileInDirs(seriesFile, resolvedPathSeries());
	} catch(err) {
		throw `No series file found (${seriesFile})`;
	}
	return await getDataFromSeriesFile(file);
}

export async function getDataFromSeriesFile(file: string): Promise<Series> {
	const seriesFileData = await asyncReadFile(file, 'utf-8');
	if (!testJSON(seriesFileData)) throw `Syntax error in file ${file}`;
	const seriesData = JSON.parse(seriesFileData);
	if (header.version > +seriesData.header.version) throw `Series file is too old (version found: ${seriesData.header.version}, expected version: ${header.version})`;
	const validationErrors = seriesDataValidationErrors(seriesData.series);
	if (validationErrors) {
		throw `Series data is not valid: ${JSON.stringify(validationErrors)}`;
	}
	seriesData.series.seriefile = basename(file);
	return seriesData.series;
}

export function seriesDataValidationErrors(seriesData: Series): {} {
	initValidators();
	return check(seriesData, seriesConstraintsV3);
}

export function findSeries(name: string, series: Series[]): Series {
	return series.find(s => s.name === name);
}

export async function writeSeriesFile(series: Series, destDir: string) {
	const seriesFile = resolve(destDir, `${sanitizeFile(series.name)}.series.json`);
	const seriesData = formatSeriesFile(series);
	await asyncWriteFile(seriesFile, JSON.stringify(seriesData, null, 2), {encoding: 'utf8'});
}

export function formatSeriesFile(series: Series): SeriesFile {
	const seriesData = {
		header: header,
		series: series
	};
	//Remove useless data
	if ((series.aliases && series.aliases.length === 0) || series.aliases === null) delete seriesData.series.aliases;
	delete seriesData.series.serie_id;
	delete seriesData.series.i18n_name;
	delete seriesData.series.seriefile;
	return seriesData;
}

export async function removeSeriesFile(name: string) {
	try {
		const filename = await resolveFileInDirs(`${sanitizeFile(name)}.series.json`, resolvedPathSeries());
		await asyncUnlink(filename);
	} catch(err) {
		throw `Could not remove series file ${name} : ${err}`;
	}
}

