import chalk from 'chalk'
import { readdir, readFile, unlink, writeFile } from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

export type Gallery = {
	photos: ParsedFiles
	albums: ParsedFiles
	updatePhoto: (name: string, frontMatter: Record<string, any>) => Promise<void>
	deletePhoto: (name: string) => Promise<void>
}

type ParsedFiles = {
	name: string
	frontMatter: Record<string, any>
	takenAt: Date
}[]

let photoData: ParsedFiles = []
let albumData: ParsedFiles = []

const loadFile =
	(database: ParsedFiles, baseDir: string) => async (file: string) => {
		const [, frontMatter] = ((await readFile(file, 'utf-8')) + '\n').split(
			'---\n',
		)
		try {
			const parsedFrontMatter = yaml.load(frontMatter, {
				filename: file,
			}) as Record<string, any>
			database.push({
				name: file.replace(baseDir, '').replace(/^\//, ''),
				frontMatter: parsedFrontMatter,
				takenAt: new Date(parsedFrontMatter.takenAt),
			})
		} catch (error) {
			console.error(chalk.red(`Failed to parse`), chalk.yellow(file))
			console.error(chalk.red((error as Error).message))
			console.error(chalk.gray(frontMatter))
		}
	}

export const data = async (photosDir: string): Promise<Gallery> => {
	const pDir = path.join(photosDir, 'data', 'photos')
	const aDir = path.join(photosDir, 'data', 'albums')
	const photos = await readdir(pDir)
	const albums = await readdir(aDir)

	console.debug(
		chalk.gray('Found'),
		chalk.green(albums.length),
		chalk.gray('albums'),
	)

	console.debug(
		chalk.gray('Found'),
		chalk.green(photos.length),
		chalk.gray('photos'),
	)

	// Parse photo files
	const photoFileReader = loadFile(photoData, pDir)
	await photos.reduce(async (p, photo) => {
		await p
		const photoFile = path.join(pDir, photo)
		await photoFileReader(photoFile)
	}, Promise.resolve())

	// Parse album files
	const albumFileReader = loadFile(albumData, aDir)
	await albums.reduce(async (p, album) => {
		await p
		const albumFile = path.join(aDir, album)
		await albumFileReader(albumFile)
	}, Promise.resolve())

	return {
		photos: photoData,
		albums: albumData,
		updatePhoto: async (name, frontMatter) => {
			const fileName = path.join(pDir, name)
			const markdown = ['---', yaml.dump(frontMatter), '---'].join('\n')

			console.debug(chalk.gray('Writing'), chalk.yellow(fileName))
			console.debug(chalk.white(markdown))
			await writeFile(fileName, markdown)

			const photo = photoData.find(({ name: n }) => name === n)
			if (photo !== undefined) {
				photo.frontMatter = frontMatter
			}
		},
		deletePhoto: async (name) => {
			const fileName = path.join(pDir, name)

			console.debug(chalk.gray('Deleting'), chalk.yellow(fileName))
			await unlink(fileName)

			photoData = photoData.filter(({ name: n }) => name !== n)
		},
	}
}
