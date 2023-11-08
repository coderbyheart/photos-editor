import { Gallery } from './photoStorage'

export const photosByDate = async (
	gallery: Gallery,
): Promise<Record<string, any>> =>
	gallery.photos
		.sort(({ takenAt: a }, { takenAt: b }) => b.getTime() - a.getTime())
		.slice(0, 20)
		.map(({ name, frontMatter: { url } }) => ({ name, url }))
