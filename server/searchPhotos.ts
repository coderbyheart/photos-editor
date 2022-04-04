import { Gallery } from './photoStorage'

const searchTerm = /name:(?<name>[^ ]+)/

export const searchPhotos = async (
	gallery: Gallery,
	term: string,
): Promise<Record<string, any>> => {
	const searches = searchTerm.exec(term)
	const nameSearch = searches?.groups?.name
	return gallery.photos
		.filter((photo) => {
			if (nameSearch !== undefined && photo.name.includes(nameSearch))
				return true
			return false
		})
		.slice(0, 20)
		.map(({ name: path }) => path)
}
