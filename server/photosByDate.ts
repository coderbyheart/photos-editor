import type { Gallery } from './photoStorage.ts'

export const photosByDate = async (gallery: Gallery): Promise =>
	gallery.photos
		.sort(({ takenAt: a }, { takenAt: b }) => b.getTime() - a.getTime())
		.slice(0, 20)
		.map(({ name, frontMatter: { url, video } }) => ({ name, url, video }))
