import { fromEnv } from '@nordicsemiconductor/from-env'
import chalk from 'chalk'
import { data } from './photoStorage.js'
import { server } from './server.js'

export {}

try {
	const { photosDir } = fromEnv({
		photosDir: 'PHOTOS_DIR',
	})(process.env)

	console.debug(chalk.gray('Loading photos from'), chalk.blue(photosDir))

	const photos = await data(photosDir)
	server(photos)
} catch (error) {
	console.error(chalk.red((error as Error).message))
}
