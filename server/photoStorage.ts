import chalk from 'chalk'
import { readdir, readFile, unlink, writeFile } from 'fs/promises'
import * as yaml from 'js-yaml'
import path from 'path'

export type PhotoListItem = {
	name: string
	url: string
	video?: { youtube: string }
}

export type PhotoList = {
	matches: PhotoListItem[]
	total: number
}

export type PhotoFrontMatter = {
	title?: string
	description?: string
	takenAt?: string
	license?: string
	geo?: { lat: number; lng: number }
	tags?: string[]
	url?: string
	size?: number
	image?: { width: number; height: number }
	video?: { youtube: string }
	[key: string]: unknown
}

export type Gallery = {
	photos: ParsedFiles
	albums: ParsedFiles
	updatePhoto: (name: string, frontMatter: PhotoFrontMatter) => Promise<void>
	deletePhoto: (name: string) => Promise<void>
	createAlbum: (album: {
		title: string
		photos: string[]
	}) => Promise<{ name: string; title: string; createdAt: string }>
}
type ParsedFile = {
	name: string
	frontMatter: Record<string, any>
	takenAt: Date
}
type ParsedFiles = ParsedFile[]

let photoData: ParsedFiles = []
const albumData: ParsedFiles = []

// Turns an album title into a file name slug, e.g. "10 Jahre Abi '99" -> "10-jahre-abi-99"
const slugify = (title: string): string =>
	title
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '') // strip diacritics (Ä -> A)
		.toLowerCase()
		.replace(/['’]/g, '') // drop apostrophes (' and ’)
		.replace(/[^a-z0-9]+/g, '-') // any other run of non-alphanumerics -> single hyphen
		.replace(/^-+|-+$/g, '') // trim leading/trailing hyphens

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
		createAlbum: async ({ title, photos }) => {
			// Album photo lists reference photos by id (no `.md` extension), while the
			// stash stores file names, so normalize before persisting.
			const photoIds = photos.map((id) => id.replace(/\.md$/, ''))

			// Derive a unique file name slug from the title.
			const baseSlug = slugify(title)
			let slug = baseSlug
			for (
				let i = 2;
				albumData.some(({ name }) => name === `${slug}.md`);
				i++
			) {
				slug = `${baseSlug}-${i}`
			}
			const name = `${slug}.md`

			// Date the album by its most recent photo (falling back to now if none
			// of the ids resolve to a photo with a valid takenAt).
			const takenAts = photoIds
				.map((id) => photoData.find(({ name: n }) => n === `${id}.md`)?.takenAt)
				.filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()))
			const createdAt = (
				takenAts.length > 0
					? new Date(Math.max(...takenAts.map((d) => d.getTime())))
					: new Date()
			).toISOString()
			const frontMatter = {
				title,
				createdAt,
				cover: photoIds[0],
				photos: photoIds,
			}

			const fileName = path.join(aDir, name)
			const markdown = ['---', yaml.dump(frontMatter), '---'].join('\n')
			console.debug(chalk.gray('Writing'), chalk.yellow(fileName))
			console.debug(chalk.white(markdown))
			await writeFile(fileName, markdown)

			albumData.push({
				name,
				frontMatter,
				takenAt: new Date(createdAt),
			})

			return { name, title, createdAt }
		},
		deletePhoto: async (name) => {
			const fileName = path.join(pDir, name)

			console.debug(chalk.gray('Deleting'), chalk.yellow(fileName))
			await unlink(fileName)

			photoData = photoData.filter(({ name: n }) => name !== n)

			const id = name.replace('.md', '')
			for (const album of albumData) {
				if (album.frontMatter.photos.includes(id)) {
					album.frontMatter.photos = album.frontMatter.photos.filter(
						(n: string) => n !== id,
					)
					const fileName = path.join(aDir, album.name)
					console.debug(chalk.gray('Writing'), chalk.yellow(fileName))
					const markdown = ['---', yaml.dump(album.frontMatter), '---'].join(
						'\n',
					)
					await writeFile(fileName, markdown)
				}
			}
		},
	}
}
