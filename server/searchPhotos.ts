import { Gallery } from './photoStorage'

const nameSearchTerm = /name:(?<name>[^ ]+)/
const albumSearchTerm = /album:(?<album>[^ ]+)/

export const searchPhotos = async (
	gallery: Gallery,
	term: string,
): Promise<Record<string, any>> => {
	const nameSearch = nameSearchTerm.exec(term)?.groups?.name
	const albumSearch = albumSearchTerm.exec(term)?.groups?.album
	let photosInAlbums: string[] = []

	if (albumSearch !== undefined) {
		const albums = gallery.albums.filter(({ name }) =>
			name.includes(albumSearch),
		)
		photosInAlbums = albums.flatMap(
			({ frontMatter }) => frontMatter.photos ?? [],
		)
	}

	return gallery.photos
		.filter((photo) => {
			if (nameSearch !== undefined && photo.name.includes(nameSearch))
				return true
			if (
				albumSearch !== undefined &&
				photosInAlbums.includes(photo.name.replace(/\.md$/, ''))
			)
				return true
			return false
		})
		.filter((_, i) => (albumSearch !== undefined ? true : i < 20))
		.map(({ name, frontMatter: { url } }) => ({ name, url }))
}
