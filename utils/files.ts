import {createWriteStream, exists, readFile, readdir, rename, unlink, stat, writeFile} from 'fs';
import {remove, mkdirp, copy, move} from 'fs-extra';
import {promisify} from 'util';
import {resolve} from 'path';
import {mediaFileRegexp, imageFileRegexp} from './constants';
import fileType from 'file-type';
import readChunk from 'read-chunk';
import {createHash, HexBase64Latin1Encoding} from 'crypto';
import sanitizeFilename from 'sanitize-filename';
import deburr from 'lodash.deburr';
import { getState } from '../../utils/state';
import { ComparedDirs } from '../types/files';
import { Stream } from 'stream';

export function sanitizeFile(file: string): string {
	const replaceMap = {
		'·': '.',
		'・': '.',
		'Λ': 'A',
		'Я': 'R',
		'³': '3',
		'²': '2',
		'°': '0',
		'θ': '0',
		'Ø': '0',
		'○': 'O',
		'×': 'x',
		'Φ': 'O',
		'±': '+',
		'∀': 'A'
	};
	const replaceRegExp = new RegExp('[' + Object.keys(replaceMap).join('') + ']', 'ig');
	// Romanizing japanese characters by their romanization
	// Also making some obvious replacements of things we often find in japanese names.
	file = file.replace(/ô/g,'ou')
		.replace(/Ô/g,'Ou')
		.replace(/û/g,'uu')
		.replace(/µ's/g,'Mu\'s')
		.replace(/®/g,'(R)')
		.replace(/∆/g,'Delta')
		.replace(/;/g,' ')
		.replace(/\[/g,' ')
		.replace(/\]/g,' ')
		.replace(/[△:\/☆★†↑½♪＊*∞♥❤♡⇄♬]/g, ' ')
		.replace(/…/,'...')
		.replace(/\+/,' Plus ')
		.replace(/\?\?/,' question_mark 2')
		.replace(/\?/,' question_mark ')
		.replace(/^\./,'')
		.replace(/♭/,' Flat ')
		.replace(replaceRegExp, input => {
			return replaceMap[input];
		})
	;
	// Remove all diacritics and other non-ascii characters we might have left
	// Also, remove useless spaces.
	file = deburr(file)
		.replace(/[^\x00-\xFF]/g, ' ' )
		.replace(/ [ ]+/g,' ')
	;
	// One last go using sanitizeFilename just in case.
	file = sanitizeFilename(file);
	return file;
}

export async function detectFileType(file: string): Promise<string> {
	const buffer = await readChunk(file, 0, 4100);
	const detected = fileType(buffer);
	if (!detected) throw `Unable to detect filetype of ${file}`;
	return detected.ext;
}

const passThroughFunction = (fn: any, args: any) => {
	if(!Array.isArray(args)) args = [args];
	return promisify(fn)(...args);
};

export const asyncExists = (file: string) => passThroughFunction(exists, file);
export const asyncReadFile = (...args: any) => passThroughFunction(readFile, args);
export const asyncReadDir = (...args: any) => passThroughFunction(readdir, args);
export const asyncMkdirp = (...args: any) => passThroughFunction(mkdirp, args);
export const asyncRemove = (...args: any) => passThroughFunction(remove, args);
export const asyncRename = (...args: any) => passThroughFunction(rename, args);
export const asyncUnlink = (...args: any) => passThroughFunction(unlink, args);
export const asyncCopy = (...args: any) => passThroughFunction(copy, args);
export const asyncStat = (...args: any) => passThroughFunction(stat, args);
export const asyncWriteFile = (...args: any) => passThroughFunction(writeFile, args);
export const asyncMove = (...args: any) => passThroughFunction(move, args);

export const isImageFile = (fileName: string) => new RegExp(imageFileRegexp).test(fileName);
export const isMediaFile = (fileName: string) => new RegExp(mediaFileRegexp).test(fileName);

const filterValidFiles = (files: string[]) => files.filter(file => !file.startsWith('.') && isMediaFile(file));
export const filterMedias = (files: string[]) => filterValidFiles(files);
export const filterImages = (files: string[]) => filterValidFiles(files);

export const checksum = (str: string, algorithm = 'md5', encoding: HexBase64Latin1Encoding = 'hex') => createHash(algorithm)
	.update(str, 'utf8')
	.digest(encoding);

/** Function used to verify if a required file exists. It throws an exception if not. */
export async function asyncRequired(file: string) {
	if (!await asyncExists(file)) throw `File "${file}" does not exist`;
}

export async function asyncCheckOrMkdir(...dir: string[]) {
	const resolvedDir = resolve(...dir);
	if (!await asyncExists(resolvedDir)) await asyncMkdirp(resolvedDir);
}

export async function isGitRepo(dir: string): Promise<boolean> {
	const dirContents = await asyncReadDir(dir);
	return dirContents.includes('.git');
}

/**
 * Searching file in a list of folders. If the file is found, we return its complete path with resolve.
 */
export async function resolveFileInDirs(filename: string, dirs: string[]): Promise<string> {
	for (const dir of dirs) {
		const resolved = resolve(getState().appPath, dir, filename);
		if (await asyncExists(resolved)) return resolved;
	}
	throw `File "${filename}" not found in any listed directory: ${dirs}`;
}

/** Replacing extension in filename */
export function replaceExt(filename: string, newExt: string): string {
	return filename.replace(/\.[^.]+$/, newExt);
}

async function compareFiles(file1: string, file2: string): Promise<boolean> {
	if (!await asyncExists(file1) || !await asyncExists(file2)) return false;
	const [file1data, file2data] = await Promise.all([
		asyncReadFile(file1, 'utf-8'),
		asyncReadFile(file2, 'utf-8')
	]);
	return file1data === file2data;
}

async function compareAllFiles(files: string[], dir1: string, dir2: string): Promise<string[]> {
	let updatedFiles = [];
	for (const file of files) {
		if (!await compareFiles(resolve(dir1, file), resolve(dir2, file))) updatedFiles.push(file);
	}
	return updatedFiles;
}

export async function compareDirs(dir1: string, dir2: string): Promise<ComparedDirs> {
	const [dir1List, dir2List] = await Promise.all([
		asyncReadDir(dir1),
		asyncReadDir(dir2)
	]);
	const newFiles = dir2List.map((f: string) => !dir1List.includes(f));
	const removedFiles = dir1List.map((f: string) => !dir2List.includes(f));
	const commonFiles = dir2List.map((f: string) => dir1List.includes(f));
	const updatedFiles = await compareAllFiles(commonFiles, dir1, dir2);
	return {
		updatedFiles: updatedFiles,
		commonFiles: commonFiles,
		removedFiles: removedFiles,
		newFiles: newFiles
	};
}

export async function asyncReadDirFilter(dir: string, ext: string) {
	const dirListing = await asyncReadDir(dir);
	return dirListing.filter((file: string) => file.endsWith(ext) && !file.startsWith('.')).map((file: string) => resolve(dir, file));
}

export function writeStreamToFile(stream: Stream, filePath: string) {
	return new Promise((resolve, reject) => {
		const file = createWriteStream(filePath);
		stream.pipe(file);
		stream.on('end', () => resolve());
		stream.on('error', (err: string) => reject(err));
	});
}
