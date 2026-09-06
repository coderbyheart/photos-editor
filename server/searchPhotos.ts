import type { Gallery, PhotoList } from './photoStorage.ts'

const nameSearchTerm = /name:(?<name>[^ ]+)/
const albumSearchTerm = /album:(?<album>[^ ]+)/

export const searchPhotos = async (
	gallery: Gallery,
	term: string,
	page = 1,
	pageSize = 20,
): Promise<PhotoList> => {
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

	const filtered = gallery.photos.filter((photo) => {
		if (nameSearch !== undefined && photo.name.includes(nameSearch))
			return true
		if (
			albumSearch !== undefined &&
			photosInAlbums.includes(photo.name.replace(/\.md$/, ''))
		)
			return true
		return false
	})
	const start = (page - 1) * pageSize
	return {
		matches: filtered
			.slice(start, start + pageSize)
			.map(({ name, frontMatter: { url, video } }) => ({ name, url, video })),
		total: filtered.length,
	}
}
