/**
 * .kara files generation
 */

import logger from '../utils/logger';
import {extname, resolve} from 'path';
import {resolvedPathImport, resolvedPathTemp} from '../utils/config';
import {sanitizeFile, asyncCopy, asyncUnlink, asyncExists, asyncMove, replaceExt} from '../utils/files';
import {
	extractAssInfos, extractVideoSubtitles, extractMediaTechInfos, writeKara, writeKaraV3
} from '../dao/karafile';
import {getType} from '../utils/constants';
import {Kara, NewKara} from '../types/kara';
import {check} from '../utils/validators';
import {getOrAddSerieID} from '../../services/series';
import { webOptimize } from '../utils/ffmpeg';
import uuidV4 from 'uuid/v4';


export async function generateKara(kara: Kara, karaDestDir: string, mediasDestDir: string, lyricsDestDir: string) {
	if ((kara.type !== 'MV' && kara.type !== 'LIVE') && kara.series.length < 1) throw 'Series cannot be empty if type is not MV or LIVE';
	if (!kara.mediafile) throw 'No media file uploaded';
	const validationErrors = check(kara, {
		year: {integerValidator: true},
		lang: {langValidator: true},
		tags: {tagsValidator: true},
		type: {typeValidator: true},
		series: {arrayNoCommaValidator: true},
		singer: {arrayNoCommaValidator: true},
		author: {arrayNoCommaValidator: true},
		songwriter: {arrayNoCommaValidator: true},
		creator: {arrayNoCommaValidator: true},
		groups: {arrayNoCommaValidator: true},
		title: {presence: true}
	});
	// Move files from temp directory to import, depending on the different cases.
	// First name media files and subfiles according to their extensions
	// Since temp files don't have any extension anymore
	const newMediaFile = `${kara.mediafile}${extname(kara.mediafile_orig)}`;
	let newSubFile: string;
	kara.subfile && kara.subfile_orig
		? newSubFile = `${kara.subfile}${extname(kara.subfile_orig)}`
		: newSubFile = kara.subfile;
	// We don't need these anymore.
	delete kara.subfile_orig;
	delete kara.mediafile_orig;
	// Let's move baby.
	await asyncCopy(resolve(resolvedPathTemp(),kara.mediafile),resolve(resolvedPathImport(),newMediaFile), { overwrite: true });
	if (kara.subfile) await asyncCopy(resolve(resolvedPathTemp(),kara.subfile),resolve(resolvedPathImport(),newSubFile), { overwrite: true });

	try {
		if (validationErrors) throw JSON.stringify(validationErrors);
		kara.title = kara.title.trim();
		kara.songwriter.sort();
		kara.singer.sort();
		kara.groups.sort();
		kara.tags.sort();
		//Trim spaces before and after elements.
		kara.series.forEach((e,i) => kara.series[i] = e.trim());
		kara.lang.forEach((e,i) => kara.lang[i] = e.trim());
		kara.singer.forEach((e,i) => kara.singer[i] = e.trim());
		kara.groups.forEach((e,i) => kara.groups[i] = e.trim());
		kara.songwriter.forEach((e,i) => kara.songwriter[i] = e.trim());
		kara.tags.forEach((e,i) => kara.tags[i] = e.trim());
		kara.creator.forEach((e,i) => kara.creator[i] = e.trim());
		kara.author.forEach((e,i) => kara.author[i] = e.trim());
		// Format dates
		kara.dateadded
			? kara.dateadded = new Date(kara.dateadded)
			: kara.dateadded = new Date()
		kara.datemodif = new Date(kara.datemodif);
		// Generate KID if not present
		if (!kara.kid) kara.kid = uuidV4();
		// Default repository for now
		kara.repo = 'kara.moe';
		const newKara = await importKara(newMediaFile, newSubFile, kara, karaDestDir, mediasDestDir, lyricsDestDir);
		return newKara;
	} catch(err) {
		logger.error(`[Karagen] Error during generation : ${err}`);
		if (await asyncExists(newMediaFile)) await asyncUnlink(newMediaFile);
		if (newSubFile) if (await asyncExists(newSubFile)) await asyncUnlink(newSubFile);
		throw err;
	}
}

function containsVideoGameSupportTag(tags: string[]): boolean {
	return tags.includes('TAG_PS3')
			|| tags.includes('TAG_PS2')
			|| tags.includes('TAG_PSX')
			|| tags.includes('TAG_PS4')
			|| tags.includes('TAG_PSV')
			|| tags.includes('TAG_PSP')
			|| tags.includes('TAG_XBOX360')
			|| tags.includes('TAG_GAMECUBE')
			|| tags.includes('TAG_N64')
			|| tags.includes('TAG_DS')
			|| tags.includes('TAG_3DS')
			|| tags.includes('TAG_PC')
			|| tags.includes('TAG_SEGACD')
			|| tags.includes('TAG_SATURN')
			|| tags.includes('TAG_WII')
			|| tags.includes('TAG_WIIU')
			|| tags.includes('TAG_DREAMCAST')
			|| tags.includes('TAG_SWITCH')
			|| tags.includes('TAG_XBOXONE')
			|| tags.includes('TAG_VN')
			|| tags.includes('TAG_MOBAGE');
}

function defineFilename(data: Kara): string {
	// Generate filename according to tags and type.
	if (data) {
		const extraTags = [];
		if (data.tags.includes('TAG_PS3')) extraTags.push('PS3');
		if (data.tags.includes('TAG_PS2')) extraTags.push('PS2');
		if (data.tags.includes('TAG_PSX')) extraTags.push('PSX');
		if (data.tags.includes('TAG_SPECIAL')) extraTags.push('SPECIAL');
		if (data.tags.includes('TAG_COVER')) extraTags.push('COVER');
		if (data.tags.includes('TAG_DUB')) extraTags.push('DUB');
		if (data.tags.includes('TAG_REMIX')) extraTags.push('REMIX');
		if (data.tags.includes('TAG_OVA')) extraTags.push('OVA');
		if (data.tags.includes('TAG_ONA')) extraTags.push('ONA');
		if (data.tags.includes('TAG_MOVIE')) extraTags.push('MOVIE');
		if (data.tags.includes('TAG_PS4')) extraTags.push('PS4');
		if (data.tags.includes('TAG_PSV')) extraTags.push('PSV');
		if (data.tags.includes('TAG_PSP')) extraTags.push('PSP');
		if (data.tags.includes('TAG_XBOX360')) extraTags.push('XBOX360');
		if (data.tags.includes('TAG_GAMECUBE')) extraTags.push('GAMECUBE');
		if (data.tags.includes('TAG_N64')) extraTags.push('N64');
		if (data.tags.includes('TAG_DS')) extraTags.push('DS');
		if (data.tags.includes('TAG_3DS')) extraTags.push('3DS');
		if (data.tags.includes('TAG_PC')) extraTags.push('PC');
		if (data.tags.includes('TAG_SEGACD')) extraTags.push('SEGACD');
		if (data.tags.includes('TAG_SATURN')) extraTags.push('SATURN');
		if (data.tags.includes('TAG_WII')) extraTags.push('WII');
		if (data.tags.includes('TAG_WIIU')) extraTags.push('WIIU');
		if (data.tags.includes('TAG_SWITCH')) extraTags.push('SWITCH');
		if (data.tags.includes('TAG_VIDEOGAME')) extraTags.push('GAME');
		if (data.tags.includes('TAG_SOUNDONLY')) extraTags.push('AUDIO');
		let extraType = '';
		if (extraTags.length > 0) extraType = extraTags.join(' ') + ' ';
		const fileLang = data.lang[0].toUpperCase();
		return sanitizeFile(`${fileLang} - ${data.series[0] || data.singer} - ${extraType}${getType(data.type)}${data.order || ''} - ${data.title}`);
	}
}

async function importKara(mediaFile: string, subFile: string, data: Kara, karaDestDir: string, mediasDestDir: string, lyricsDestDir: string) {
	const kara = defineFilename(data);
	logger.info(`[KaraGen] Generating kara file for ${kara}`);
	let karaSubFile: string;
	!subFile
		? karaSubFile = subFile
		: karaSubFile = `${kara}${extname(subFile || '.ass')}`;
	data.mediafile = `${kara}${extname(mediaFile)}`;
	data.subfile = karaSubFile;

	// Extract media info, find subfile, and process series before moving files
	const mediaPath = resolve(resolvedPathImport(), mediaFile);
	let subPath: string;
	if (subFile) subPath = await findSubFile(mediaPath, data, subFile);

	if (containsVideoGameSupportTag(data.tags) && !data.tags.includes('TAG_VIDEOGAME')) data.tags.push('TAG_VIDEOGAME');
	if (mediaFile.match('^.+\\.(ogg|m4a|mp3)$') && !data.tags.includes('TAG_SOUNDONLY')) data.tags.push('TAG_SOUNDONLY');

	// Autocreating groups based on song year
	if (+data.year >= 1950 && +data.year <= 1959 && !data.groups.includes('50s')) data.groups.push('50s');
	if (+data.year >= 1960 && +data.year <= 1969 && !data.groups.includes('60s')) data.groups.push('60s');
	if (+data.year >= 1970 && +data.year <= 1979 && !data.groups.includes('70s')) data.groups.push('70s');
	if (+data.year >= 1980 && +data.year <= 1989 && !data.groups.includes('80s')) data.groups.push('80s');
	if (+data.year >= 1990 && +data.year <= 1999 && !data.groups.includes('90s')) data.groups.push('90s');
	if (+data.year >= 2000 && +data.year <= 2009 && !data.groups.includes('2000s')) data.groups.push('2000s');
	if (+data.year >= 2010 && +data.year <= 2019 && !data.groups.includes('2010s')) data.groups.push('2010s');

	try {
		if (subFile) data.subchecksum = await extractAssInfos(subPath);
		data.sids = await processSeries(data);
		return await generateAndMoveFiles(mediaPath, subPath, data, karaDestDir, mediasDestDir, lyricsDestDir);
	} catch(err) {
		const error = `Error importing ${kara} : ${err}`;
		logger.error(`[KaraGen] ${error}`);
		throw error;
	}
}

async function processSeries(kara: Kara): Promise<string[]> {
	//Creates series in kara if they do not exist already.
	let sids = [];
	for (const serie of kara.series) {
		const serieObj = {
			name: serie,
			i18n: {},
			sid: uuidV4()
		};
		serieObj.i18n[kara.lang[0]] = serie;
		sids.push(await getOrAddSerieID(serieObj));
	}
	return sids.sort();
}

async function findSubFile(mediaPath: string, karaData: Kara, subFile: string): Promise<string> {
	// Replacing file extension by .ass in the same directory
	// Default is media + .ass instead of media extension.
	// If subfile exists, assFile becomes that.
	let assFile = replaceExt(mediaPath, '.ass');
	if (subFile) assFile = resolve(resolvedPathImport(), subFile);
	if (await asyncExists(assFile) && subFile) {
		// If a subfile is found, adding it to karaData
		karaData.subfile = replaceExt(karaData.mediafile, '.ass');
		return assFile;
	} else if (mediaPath.endsWith('.mkv')) {
		// In case of a mkv, we're going to extract its subtitles track
		try {
			const extractFile = await extractVideoSubtitles(mediaPath, karaData.kid);
			karaData.subfile = replaceExt(karaData.mediafile, '.ass');
			return extractFile;
		} catch (err) {
			// Non-blocking.
			logger.info('[KaraGen] Could not extract subtitles from video file ' + mediaPath + ' : ' + err);
			return null;
		}
	} else {
		return null;
	}
}

async function generateAndMoveFiles(mediaPath: string, subPath: string, karaData: Kara, karaDestDir: string, mediaDestDir: string, lyricsDestDir: string): Promise<NewKara> {
	// Generating kara file in the first kara folder
	const karaFilename = replaceExt(karaData.mediafile, '.kara');
	const karaPath = resolve(karaDestDir, `${karaFilename}.json`);
	const karaPathV3 = karaDestDir.includes('inbox') ? resolve(karaDestDir, karaFilename) : resolve(karaDestDir, '../karas/', karaFilename);
	if (!subPath) karaData.subfile = null;
	const mediaDest = resolve(mediaDestDir, karaData.mediafile);
	let subDest: string;
	if (subPath && karaData.subfile) subDest = resolve(lyricsDestDir, karaData.subfile);
	try {
		// Moving media in the first media folder.
		if (extname(mediaDest).toLowerCase() === '.mp4' && !karaData.noNewVideo) {
			await webOptimize(mediaPath, mediaDest);
			await asyncUnlink(mediaPath);
			delete karaData.noNewVideo;
		} else {
			await asyncMove(mediaPath, mediaDest, { overwrite: true });
		}
		// Extracting media info here and now because we might have had to weboptimize it earlier.
		const mediainfo = await extractMediaTechInfos(mediaDest, karaData.mediasize);
		karaData.mediagain = mediainfo.gain;
		karaData.mediaduration = mediainfo.duration;
		karaData.mediasize = mediainfo.size;
		// Moving subfile in the first lyrics folder.
		if (subDest) await asyncMove(subPath, subDest, { overwrite: true });
	} catch (err) {
		throw `Error while moving files. (${err})`;
	}
	const karaFileData = await writeKara(karaPath, karaData);
	// Write KaraV3 too
	await writeKaraV3(karaPathV3, karaData);
	return {
		data: karaData,
		file: karaPath,
		fileData: karaFileData
	};
}