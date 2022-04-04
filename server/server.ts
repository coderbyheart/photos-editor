import chalk from 'chalk'
import http, { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import { photosByDate } from './photosByDate.js'
import { Gallery } from './photoStorage'
import { searchPhotos } from './searchPhotos.js'

const requestListener =
	(gallery: Gallery) => async (req: IncomingMessage, res: ServerResponse) => {
		const resource = `${req.method} ${req.url}`
		console.debug(
			chalk.magenta('[server]'),
			chalk.blue(req.method),
			chalk.yellow(req.url),
		)
		res.setHeader('Access-Control-Allow-Origin', '*')

		const sendJSON = (data: Record<string, any>) => {
			console.log(JSON.stringify(data, null, 2))
			res.setHeader('Content-Type', 'application/json; charset=utf-8')
			res.writeHead(200)
			res.end(JSON.stringify(data))
		}

		const send404 = () => {
			res.writeHead(404)
			res.end(`Resource not found: ${resource}`)
		}

		if (req.method === 'OPTIONS') {
			res.setHeader('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE')
			res.writeHead(200)
			return res.end()
		} else if (/^GET \/photos\?term=/.test(resource)) {
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

			const frontMatter = await new Promise<Record<string, any>>((resolve) => {
				let body = ''
				req.on('data', (data: Buffer) => {
					body = `${body}${data.toString()}`
				})
				req.on('end', () => {
					resolve(JSON.parse(body))
				})
			})

			await gallery.updatePhoto(photo.name, frontMatter)

			return res.writeHead(202).end()
		} else if (/^GET \/photo\/.+/.test(resource)) {
			const photo = gallery.photos.find(({ name }) => resource.endsWith(name))
			if (photo !== undefined) return sendJSON(photo)
			return send404()
		} else {
			return send404()
		}
	}

export const server = (gallery: Gallery, port = 3000) => {
	console.debug(chalk.gray('Launching server on'), chalk.blue(port))
	const server = http.createServer(requestListener(gallery))
	server.listen(port)
}