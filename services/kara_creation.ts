/**
 * .kara files generation
 */

import logger from '../utils/logger';
import {extname, resolve} from 'path';
import {resolvedPathImport, resolvedPathTemp} from '../utils/config';
import {sanitizeFile, asyncCopy, asyncUnlink, asyncExists, asyncMove, replaceExt, detectSubFileFormat, asyncReadFile, asyncWriteFile} from '../utils/files';
import {
	extractAssInfos, extractVideoSubtitles, extractMediaTechInfos, writeKara, writeKaraV3
} from '../dao/karafile';
import {tagTypes} from '../utils/constants';
import {Kara, NewKara} from '../types/kara';
import {check} from '../utils/validators';
import {getOrAddSerieID} from '../../services/series';
import {editTag, getTag, addTag, getOrAddTagID} from '../../services/tag';
import { webOptimize } from '../utils/ffmpeg';
import uuidV4 from 'uuid/v4';
import {findFPS, convertToASS as toyundaToASS, splitTime} from 'toyunda2ass';
import {convertToASS as ultrastarToASS} from 'ultrastar2ass';
import {convertToASS as karafunToASS} from 'kfn-to-ass';
import { getState } from '../../utils/state';
import { DBKara } from '../types/database/kara';

export async function generateKara(kara: Kara, karaDestDir: string, mediasDestDir: string, lyricsDestDir: string, oldKara?: DBKara) {
	if (kara.singers.length < 1 && kara.series.length < 1) throw 'Series and singers cannot be empty in the same time';
	if (!kara.mediafile) throw 'No media file uploaded';
	const validationErrors = check(kara, {
		year: {integerValidator: true},
		langs: {tagValidator: true},
		misc: {tagValidator: true},
		songtypes: {tagValidator: true},
		series: {tagValidator: true},
		singers: {tagValidator: true},
		authors: {tagValidator: true},
		songwriters: {tagValidator: true},
		creators: {tagValidator: true},
		groups: {tagValidator: true},
		families: {tagValidator: true},
		genres: {tagValidator: true},
		platforms: {tagValidator: true},
		origins: {tagValidator: true},
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
	// Detect which subtitle format we received
	let sourceSubFile = '';
	const sourceMediaFile = resolve(resolvedPathTemp(), kara.mediafile);
	if (kara.subfile) {
		sourceSubFile = resolve(resolvedPathTemp(), kara.subfile);
		const time = await asyncReadFile(sourceSubFile, 'utf8');
		const subFormat = await detectSubFileFormat(time);
		if (subFormat === 'toyunda') {
			try {
				const fps = await findFPS(sourceMediaFile, getState().binPath.ffmpeg);
				const toyundaData = splitTime(time);
				const toyundaConverted = toyundaToASS(toyundaData, fps);
				await asyncWriteFile(sourceSubFile, toyundaConverted, 'utf-8');
			} catch(err) {
				logger.error(`[Karagen] Error converting Toyunda subfile to ASS format : ${err}`);
				throw Error(err);
			}
		} else if (subFormat === 'ultrastar') {
			try {
				await asyncWriteFile(sourceSubFile, ultrastarToASS(time, {
					syllable_precision: true
				}), 'utf-8');
			} catch(err) {
				logger.error(`[Karagen] Error converting Ultrastar subfile to ASS format : ${err}`);
				throw Error(err);
			}
		} else if (subFormat === 'karafun') {
			try {
				await asyncWriteFile(sourceSubFile, karafunToASS(time, {
					offset: 0,
					useFileInstructions: true
				}), 'utf-8');
			} catch(err) {
				logger.error(`[Karagen] Error converting Karafun subfile to ASS format : ${err}`);
				throw Error(err);
			}
		} else if (subFormat === 'unknown') throw 'Unable to determine sub file format';
	}
	// Let's move baby.
	await asyncCopy(resolve(resolvedPathTemp(), kara.mediafile), resolve(resolvedPathImport(), newMediaFile), { overwrite: true });
	if (kara.subfile) await asyncCopy(sourceSubFile, resolve(resolvedPathImport(), newSubFile), { overwrite: true });
	try {
		if (validationErrors) throw JSON.stringify(validationErrors);
		kara.title = kara.title.trim();
		//Trim spaces before and after elements.
		kara.series.forEach((e,i) => kara.series[i] = e.trim());
		kara.langs.forEach((e,i) => kara.langs[i].name = e.name.trim());
		kara.singers.forEach((e,i) => kara.singers[i].name = e.name.trim());
		kara.groups.forEach((e,i) => kara.groups[i].name = e.name.trim());
		kara.songwriters.forEach((e,i) => kara.songwriters[i].name = e.name.trim());
		kara.misc.forEach((e,i) => kara.misc[i].name = e.name.trim());
		kara.creators.forEach((e,i) => kara.creators[i].name = e.name.trim());
		kara.authors.forEach((e,i) => kara.authors[i].name = e.name.trim());
		kara.origins.forEach((e,i) => kara.origins[i].name = e.name.trim());
		kara.platforms.forEach((e,i) => kara.platforms[i].name = e.name.trim());
		kara.genres.forEach((e,i) => kara.genres[i].name = e.name.trim());
		kara.families.forEach((e,i) => kara.families[i].name = e.name.trim());
		// Format dates
		kara.created_at
			? kara.created_at = new Date(kara.created_at)
			: kara.created_at = new Date()
		kara.modified_at = new Date(kara.modified_at);
		// Generate KID if not present
		if (!kara.kid) kara.kid = uuidV4();
		// Default repository for now
		kara.repo = 'kara.moe';
		const newKara = await importKara(newMediaFile, newSubFile, kara, karaDestDir, mediasDestDir, lyricsDestDir, oldKara);
		return newKara;
	} catch(err) {
		logger.error(`[Karagen] Error during generation : ${err}`);
		if (await asyncExists(newMediaFile)) await asyncUnlink(newMediaFile);
		if (newSubFile) if (await asyncExists(newSubFile)) await asyncUnlink(newSubFile);
		throw err;
	}
}

function defineFilename(data: Kara): string {
	// Generate filename according to tags and type.
	if (data) {
		const extraTags = [];
		if (data.platforms.map(t => t.name).includes('Playstation 3')) extraTags.push('PS3');
		if (data.platforms.map(t => t.name).includes('Playstation 2')) extraTags.push('PS2');
		if (data.platforms.map(t => t.name).includes('Playstation')) extraTags.push('PSX');
		if (data.misc.map(t => t.name).includes('Cover')) extraTags.push('COVER');
		if (data.misc.map(t => t.name).includes('Fandub')) extraTags.push('DUB');
		if (data.misc.map(t => t.name).includes('Remix')) extraTags.push('REMIX');
		if (data.origins.map(t => t.name).includes('Special')) extraTags.push('SPECIAL');
		if (data.origins.map(t => t.name).includes('OVA')) extraTags.push('OVA');
		if (data.origins.map(t => t.name).includes('ONA')) extraTags.push('ONA');
		if (data.origins.map(t => t.name).includes('Movie')) extraTags.push('MOVIE');
		if (data.platforms.map(t => t.name).includes('Playstation 4')) extraTags.push('PS4');
		if (data.platforms.map(t => t.name).includes('Playstation Vita')) extraTags.push('PSV');
		if (data.platforms.map(t => t.name).includes('Playstation Portable')) extraTags.push('PSP');
		if (data.platforms.map(t => t.name).includes('XBOX 360')) extraTags.push('XBOX360');
		if (data.platforms.map(t => t.name).includes('XBOX ONE')) extraTags.push('XBOXONE');
		if (data.platforms.map(t => t.name).includes('Gamecube')) extraTags.push('GAMECUBE');
		if (data.platforms.map(t => t.name).includes('N64')) extraTags.push('N64');
		if (data.platforms.map(t => t.name).includes('DS')) extraTags.push('DS');
		if (data.platforms.map(t => t.name).includes('3DS')) extraTags.push('3DS');
		if (data.platforms.map(t => t.name).includes('PC')) extraTags.push('PC');
		if (data.platforms.map(t => t.name).includes('Sega CD')) extraTags.push('SEGACD');
		if (data.platforms.map(t => t.name).includes('Saturn')) extraTags.push('SATURN');
		if (data.platforms.map(t => t.name).includes('Wii')) extraTags.push('WII');
		if (data.platforms.map(t => t.name).includes('Wii U')) extraTags.push('WIIU');
		if (data.platforms.map(t => t.name).includes('Switch')) extraTags.push('SWITCH');
		if (data.families.map(t => t.name).includes('Video Game')) extraTags.push('GAME');
		if (data.misc.map(t => t.name).includes('Audio Only')) extraTags.push('AUDIO');
		let extraType = '';
		if (extraTags.length > 0) extraType = extraTags.join(' ') + ' ';
		const fileLang = data.langs[0].name.toUpperCase();
		return sanitizeFile(`${fileLang} - ${data.series[0] || data.singers.map(t => t.name).join(',')} - ${extraType}${data.songtypes[0].name}${data.order || ''} - ${data.title}`);
	}
}

async function importKara(mediaFile: string, subFile: string, data: Kara, karaDestDir: string, mediasDestDir: string, lyricsDestDir: string, oldKara: DBKara) {
	if (data.platforms.length > 0 && !data.families.map(t => t.name).includes('Video Game')) data.families.push({name: 'Video Game'});
	if (mediaFile.match('^.+\\.(ogg|m4a|mp3)$') && !data.misc.map(t => t.name).includes('Audio Only')) data.misc.push({name: 'Audio Only'});

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

	// Autocreating groups based on song year
	if (+data.year >= 1950 && +data.year <= 1959 && !data.groups.map(t => t.name).includes('50s')) data.groups.push({name: '50s'});
	if (+data.year >= 1960 && +data.year <= 1969 && !data.groups.map(t => t.name).includes('60s')) data.groups.push({name: '60s'});
	if (+data.year >= 1970 && +data.year <= 1979 && !data.groups.map(t => t.name).includes('70s')) data.groups.push({name: '70s'});
	if (+data.year >= 1980 && +data.year <= 1989 && !data.groups.map(t => t.name).includes('80s')) data.groups.push({name: '80s'});
	if (+data.year >= 1990 && +data.year <= 1999 && !data.groups.map(t => t.name).includes('90s')) data.groups.push({name: '90s'});
	if (+data.year >= 2000 && +data.year <= 2009 && !data.groups.map(t => t.name).includes('2000s')) data.groups.push({name: '2000s'});
	if (+data.year >= 2010 && +data.year <= 2019 && !data.groups.map(t => t.name).includes('2010s')) data.groups.push({name: '2010s'});
	if (+data.year >= 2020 && +data.year <= 2029 && !data.groups.map(t => t.name).includes('2010s')) data.groups.push({name: '2020s'});

	try {
		if (subFile) data.subchecksum = await extractAssInfos(subPath);
		data.sids = await processSeries(data);
		data = await processTags(data, oldKara);
		return await generateAndMoveFiles(mediaPath, subPath, data, karaDestDir, mediasDestDir, lyricsDestDir);
	} catch(err) {
		const error = `Error importing ${kara} : ${err}`;
		logger.error(`[KaraGen] ${error}`);
		throw error;
	}
}

/** Replace tags by UUIDs, create them if necessary */
async function processTags(kara: Kara, oldKara?: DBKara): Promise<Kara> {
	const allTags = [];
	for (const type of Object.keys(tagTypes)) {
		if (kara[type]) {
			for (const i in kara[type]) {
				allTags.push({
					name: kara[type][i].name,
					tid: kara[type][i].tid,
					types: [tagTypes[type]],
					karaType: tagTypes[type]
				});
			}
		}
	}
	for (const i in allTags) {
		const tag = allTags[i];
		// TID is not provided. We'll try to find a similar tag
		if (!tag.tid) {
			const y = allTags.findIndex(t => t.name === tag.name && t.karaType !== tag.karaType);
			if (y > -1 && allTags[y].tid) {
				// y has a TID so it's known, we'll use it as reference
				allTags[i].tid = allTags[y].tid;
				// Add type of i to y
				const knownTag = await getTag(allTags[y].tid);
				const types = [].concat(knownTag.types, allTags[i].types);
				allTags[i].types = types;
				allTags[y].types = types;
				await editTag(allTags[y].tid, {
					...knownTag,
					types: allTags[y].types
				}, {refresh: false});
				kara.newTags = true;
			}
			if (y > -1 && !allTags[y].tid) {
				// y has no TID either, we're going to merge them
				const types = [].concat(allTags[y].types, allTags[i].types);
				allTags[y].types = types;
				allTags[i].types = types;
				allTags[i].i18n = { eng: allTags[i].name };
				const knownTag = await addTag(allTags[i], {refresh: false});
				allTags[y].tid = knownTag.tid;
				allTags[i].tid = knownTag.tid;
				kara.newTags = true;
			}
			if (y < 0) {
				// No dupe found
				allTags[i].i18n = { eng: allTags[i].name };
				const knownTag = await getOrAddTagID(allTags[i]);
				allTags[i].tid = knownTag.id;
				if (!kara.newTags) kara.newTags = knownTag.new;
			}
		}
	}
	for (const type of Object.keys(tagTypes)) {
		if (kara[type]) {
			const tids = [];
			allTags.forEach(t => {
				if (t.karaType === tagTypes[type]) {
					tids.push({tid: t.tid, name: t.name});
				}
			})
			kara[type] = tids;
		}
	}
	//If oldKara is provided, it means we're editing a kara.
	//Checking if tags differ so we set the newTags boolean accordingly
	//If a tag in allTags has no tid, then it's new, then we're not even getting in there, newTags has already been set to true
	if (oldKara && !kara.newTags) {
		allTags.forEach(newKaraTag => {
			if (!kara.newTags) kara.newTags = !oldKara.tid.includes(newKaraTag.tid);
		})
	}
	return kara;
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
		serieObj.i18n[kara.langs[0].name] = serie;
		const res = await getOrAddSerieID(serieObj);
		if (!kara.newSeries) kara.newSeries = res.new;
		sids.push(res.id);
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