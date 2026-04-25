import { fromEnv } from '@bifravst/from-env'
import chalk from 'chalk'
import { data } from './photoStorage.ts'
import { server } from './server.ts'

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
