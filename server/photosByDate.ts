import type { Gallery, PhotoList } from './photoStorage.ts'

export const photosByDate = async (
	gallery: Gallery,
	page = 1,
	pageSize = 20,
): Promise<PhotoList> => {
	const sorted = gallery.photos.sort(({ takenAt: a }, { takenAt: b }) =>
		b.getTime() - a.getTime(),
	)
	const start = (page - 1) * pageSize
	return {
		matches: sorted
			.slice(start, start + pageSize)
			.map(({ name, frontMatter: { url, video } }) => ({ name, url, video })),
		total: sorted.length,
	}
}
