import chalk from 'chalk'
import type { IncomingMessage, ServerResponse } from 'http'
import http from 'http'
import { URL } from 'url'
import { photosByDate } from './photosByDate.ts'
import type { Gallery } from './photoStorage.ts'
import { searchPhotos } from './searchPhotos.ts'

const readJSONBody = async (
	req: IncomingMessage,
): Promise<Record<string, unknown>> =>
	new Promise((resolve) => {
		let body = ''
		req.on('data', (data: Buffer) => {
			body = `${body}${data.toString()}`
		})
		req.on('end', () => {
			resolve(JSON.parse(body))
		})
	})

const requestListener =
	(gallery: Gallery) => async (req: IncomingMessage, res: ServerResponse) => {
		const resource = `${req.method} ${req.url}`
		console.debug(
			chalk.magenta('[server]'),
			chalk.blue(req.method),
			chalk.yellow(req.url),
		)
		res.setHeader('Access-Control-Expose-Headers', 'Link')
		res.setHeader('Access-Control-Allow-Origin', '*')

		const sendJSON = (data: unknown, headers?: Record<string, string>) => {
			const encodedJSON = JSON.stringify(data)
			const effectiveHeaders = {
				'Content-Type': 'application/json; charset=utf-8',
				...(headers ?? {}),
			}
			for (const [header, value] of Object.entries(effectiveHeaders)) {
				res.setHeader(header, value)
			}
			res.writeHead(200)
			res.end(encodedJSON)
		}

		const send404 = () => {
			res.writeHead(404)
			res.end(`Resource not found: ${resource}`)
		}

		if (req.method === 'OPTIONS') {
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.setHeader('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE')
			res.setHeader('Access-Control-Allow-Headers', 'Link')
			res.writeHead(200)
			return res.end()
		} else if (resource.startsWith('GET /photos?term=')) {
			const term = new URLSearchParams(
				new URL(`http://localhost${req.url}`).search,
			).get('term')
			if (term === null) {
				res.writeHead(400)
				res.end(`Missing term!`)
				return
			}
			return sendJSON(await searchPhotos(gallery, term))
		} else if (resource === 'GET /photos/byDate') {
			return sendJSON(await photosByDate(gallery))
		} else if (/^PUT \/photo\/.+/.test(resource)) {
			const photo = gallery.photos.find(({ name }) => resource.endsWith(name))
			if (photo === undefined) return send404()

			const frontMatter = await readJSONBody(req)

			await gallery.updatePhoto(photo.name, frontMatter)

			return res.writeHead(202).end()
		} else if (/^DELETE \/photo\/.+/.test(resource)) {
			const photo = gallery.photos.find(({ name }) => resource.endsWith(name))
			if (photo === undefined) return send404()

			await gallery.deletePhoto(photo.name)

			return res.writeHead(202).end()
		} else if (/^GET \/photo\/.+/.test(resource)) {
			const photo = gallery.photos.find(({ name }) => resource.endsWith(name))
			if (photo !== undefined) {
				const next = gallery.photos[gallery.photos.indexOf(photo) + 1]
				const prev = gallery.photos[gallery.photos.indexOf(photo) - 1]
				const links = []
				if (next !== undefined) links.push(`<${next.name}>;rel="next"`)
				if (prev !== undefined) links.push(`<${prev.name}>;rel="prev"`)
				return sendJSON(photo, { Link: links.join(',') })
			}

			return send404()
		} else if (/^POST \/albums$/.test(resource)) {
			const body = await readJSONBody(req)
			const title = typeof body.title === 'string' ? body.title.trim() : ''
			const photos = Array.isArray(body.photos)
				? body.photos.filter((p): p is string => typeof p === 'string')
				: []

			if (title.length === 0) {
				res.writeHead(400)
				return res.end(`Missing album title!`)
			}
			if (photos.length === 0) {
				res.writeHead(400)
				return res.end(`Album has no photos!`)
			}

			return sendJSON(await gallery.createAlbum({ title, photos }))
		} else if (/^GET \/albums$/.test(resource)) {
			return sendJSON(
				gallery.albums
					.sort(
						(
							{ frontMatter: { createdAt: c1 } },
							{ frontMatter: { createdAt: c2 } },
						) =>
							(c2 instanceof Date ? c2.toISOString() : c2).localeCompare(
								c1 instanceof Date ? c1.toISOString() : c1,
							),
					)
					.map(({ name, frontMatter: { title, createdAt } }) => ({
						name,
						title,
						createdAt,
					})),
			)
		} else {
			return send404()
		}
	}

export const server = (gallery: Gallery, port = 3000) => {
	console.debug(chalk.gray('Launching server on'), chalk.blue(port))
	const server = http.createServer(requestListener(gallery))
	server.listen(port)
}
