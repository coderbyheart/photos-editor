import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { AlbumCart } from './AlbumCart'
import { DeleteButton } from './DeleteButton'
import { PhotoMap } from './PhotoMap'

type LoadedPhoto = {
	name: string
	frontMatter: {
		title: string
		takenAt: string
		license: string
		geo?: { lat: number; lng: number }
		tags?: string[]
		url?: string
		size?: number
		image?: { width: number; height: number }
		video?: { youtube: string }
	}
	takenAt: null
}

const LastGeoButton = ({
	onClick,
}: {
	onClick: (geo: { lat: number; lng: number }) => void
}) => {
	const lastGeo = localStorage.getItem('geo')

	if (lastGeo === null) return null

	return (
		<button
			class="btn btn-outline-secondary ms-2"
			type="button"
			onClick={() => onClick(JSON.parse(lastGeo))}
		>
			use last position
		</button>
	)
}

const LastTitleButton = ({ onClick }: { onClick: (title: string) => void }) => {
	const lastTitle = localStorage.getItem('title')

	if (lastTitle === null) return null

	return (
		<button
			class="btn btn-outline-secondary"
			type="button"
			onClick={() => onClick(lastTitle)}
		>
			{lastTitle}
		</button>
	)
}

const LastTagsButton = ({ onClick }: { onClick: (tags: string[]) => void }) => {
	const lastTags = localStorage.getItem('tags')

	if (lastTags === null) return null

	const tags = JSON.parse(lastTags)
	return (
		<button
			class="btn btn-outline-secondary"
			type="button"
			onClick={() => onClick(tags)}
		>
			{tags.join(', ')}
		</button>
	)
}

const relRx = /rel="(?<rel>[^"]+)"/

export const Photo = ({
	matches: { photoId },
}: {
	path: string
	matches?: { photoId: string }
}) => {
	const [photo, setPhoto] = useState<LoadedPhoto>()
	const [next, setNext] = useState<string>()
	const [prev, setPrev] = useState<string>()
	const [newTag, setNewTag] = useState<string>('')
	const [geoInput, setGeoInput] = useState<string>('')

	const saveAndNext = () => {
		if (photo === undefined) return
		fetch(`http://localhost:3000/photo/${photoId}`, {
			method: 'PUT',
			body: JSON.stringify(photo.frontMatter),
		}).then((res) => {
			if (res.ok) route(`/photo/${next}`)
		})
	}

	useEffect(() => {
		fetch(`http://localhost:3000/photo/${photoId}`, { mode: 'cors' })
			.then((res) => {
				const links = res.headers
					.get('link')
					?.split(',')
					.map((link) => {
						const [url, relSpec] = link.split(';')
						const rel = relRx.exec(relSpec)?.groups.rel
						const href = url.slice(1, -1)
						return { [rel]: href }
					})
					.reduce(
						(links, link) => ({ ...links, ...link }),
						{} as Record<string, string>,
					)
				setNext(links.next)
				setPrev(links.prev)
				return res.json()
			})
			.then((photo) => {
				setPhoto(photo)
				if (photo.geo !== undefined) {
					setGeoInput(`${photo.geo.lat},${photo.geo.lng}`)
				}
			})
	}, [photoId])

	if (photo?.frontMatter === undefined) return null

	const { takenAt, title, tags, geo } = photo.frontMatter

	const setTags = (tags: string[]) => {
		setPhoto({
			...photo,
			frontMatter: {
				...photo.frontMatter,
				tags,
			},
		})
	}

	const addTag = () => {
		const tags = [...(photo.frontMatter.tags ?? []), newTag.replace(',', '')]
		localStorage.setItem('tags', JSON.stringify(tags))
		setTags(tags)
		setNewTag('')
	}

	const setGeo = (geo: { lat: number; lng: number }) => {
		setPhoto({
			...photo,
			frontMatter: {
				...photo.frontMatter,
				geo,
			},
		})
		setGeoInput(`${geo.lat},${geo.lng}`)
	}

	const setTitle = (title: string) => {
		setPhoto({
			...photo,
			frontMatter: {
				...photo.frontMatter,
				title: title,
			},
		})
	}

	return (
		<>
			<nav class="d-flex justify-content-between mb-2">
				{prev && (
					<button
						class="btn btn-outline-secondary"
						type="button"
						onClick={() => {
							route(`/photo/${prev}`)
						}}
					>
						prev
					</button>
				)}
				<div>
					<button
						class="btn btn-primary"
						type="button"
						onClick={() => {
							fetch(`http://localhost:3000/photo/${photoId}`, {
								method: 'PUT',
								body: JSON.stringify(photo.frontMatter),
							})
						}}
					>
						save
					</button>
					{next && (
						<button
							class="btn btn-outline-primary ms-2"
							type="button"
							onClick={() => {
								fetch(`http://localhost:3000/photo/${photoId}`, {
									method: 'PUT',
									body: JSON.stringify(photo.frontMatter),
								}).then((res) => {
									if (res.ok) route(`/photo/${next}`)
								})
							}}
						>
							save + next
						</button>
					)}
					{next && (
						<button
							class="btn btn-outline-secondary ms-2"
							type="button"
							onClick={() => {
								route(`/photo/${next}`)
							}}
						>
							next
						</button>
					)}
				</div>
			</nav>
			<div class="d-flex">
				<form class="flex-grow-1 me-4">
					<fieldset>
						<label for="title" class="form-label">
							Title
						</label>

						<div class="input-group mb-3">
							<input
								type="text"
								class="form-control"
								id="title"
								placeholder="Awesome Cat!"
								value={title}
								onInput={(e: { target: HTMLInputElement }) => {
									localStorage.setItem('title', e.target.value)
									setTitle(e.target.value)
								}}
							/>
							<LastTitleButton onClick={setTitle} />
						</div>
					</fieldset>
					<fieldset class="mt-2">
						<label for="tags" class="d-flex justify-content-between">
							Tags
							<LastTagsButton onClick={setTags} />
						</label>
						{(tags?.length ?? []) > 0 && (
							<ul>
								{tags.map((tag) => (
									<li>
										{tag}
										<button
											class="btn btn-outline-danger ms-2"
											type="button"
											id="add-tag"
											onClick={() => {
												setPhoto({
													...photo,
													frontMatter: {
														...photo.frontMatter,
														tags: photo.frontMatter.tags.filter(
															(t) => t !== tag,
														),
													},
												})
											}}
										>
											delete
										</button>
									</li>
								))}
							</ul>
						)}
						<div class="input-group mb-3">
							<input
								type="text"
								class="form-control"
								placeholder="Some tag"
								aria-label="Some tag"
								aria-describedby="add-tag"
								onInput={(e: { target: HTMLInputElement }) =>
									setNewTag(e.target.value)
								}
								value={newTag}
								onKeyUp={(e: KeyboardEvent) => {
									if (e.key === 'Enter') addTag()
									if (e.key === ',') addTag()
								}}
							/>
							<button
								class="btn btn-outline-secondary"
								type="button"
								id="add-tag"
								onClick={() => addTag()}
								disabled={newTag.length === 0}
							>
								add tag
							</button>
						</div>
					</fieldset>

					<label class="d-flex justify-content-between">
						Geo <LastGeoButton onClick={setGeo} />
					</label>
					<div class="input-group mb-3">
						<button
							class="btn btn-outline-danger"
							type="button"
							onClick={() => {
								setPhoto({
									...photo,
									frontMatter: {
										...photo.frontMatter,
										geo: undefined,
									},
								})
							}}
						>
							delete
						</button>
						<input
							type="text"
							class="form-control"
							placeholder="e.g. '50.08980509521561,8.778178095817568'"
							aria-label="Geo location"
							aria-describedby="add-geolocation"
							onInput={(e: { target: HTMLInputElement }) =>
								setGeoInput(e.target.value)
							}
							value={geoInput}
						/>

						<button
							class="btn btn-outline-secondary"
							type="button"
							id="add-geolocation"
							onClick={() => {
								const [lat, lng] = geoInput.split(',')
								setGeo({
									lat: parseFloat(lat),
									lng: parseFloat(lng),
								})
							}}
							disabled={(() => {
								const [lat, lng] = geoInput.split(',').map(parseFloat)
								return !(typeof lat === 'number' && typeof lng === 'number')
							})()}
						>
							set location
						</button>
					</div>
					<PhotoMap
						geo={geo}
						onGeo={(geo) => {
							localStorage.setItem('geo', JSON.stringify(geo))
							setGeo(geo)
						}}
					/>
					<footer class="d-flex justify-content-end mt-2">
						<button
							class="btn btn-primary"
							type="button"
							onClick={() => {
								fetch(`http://localhost:3000/photo/${photoId}`, {
									method: 'PUT',
									body: JSON.stringify(photo.frontMatter),
								})
							}}
						>
							save
						</button>
						{next && (
							<button
								class="btn btn-outline-primary ms-2"
								type="button"
								onClick={saveAndNext}
							>
								save + next
							</button>
						)}
					</footer>
				</form>
				<article>
					<h2>{title}</h2>
					{(tags?.length ?? []) > 0 && (
						<p>{tags?.map((t) => `#${t}`).join(' ')}</p>
					)}
					<div class="d-flex">
						<div key={photoId}>
							{photo?.frontMatter?.url !== undefined && (
								<img
									key={photo.frontMatter.url}
									src={`${photo.frontMatter.url}?w=500&fm=webp`}
									style={{ width: '500px' }}
								/>
							)}
							{photo?.frontMatter?.video !== undefined && (
								<iframe
									width="100%"
									height="400"
									src={`https://www.youtube-nocookie.com/embed/${photo.frontMatter.video.youtube}?controls=0&autoplay=1`}
									title="YouTube video player"
									frameborder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowfullscreen
								></iframe>
							)}
							<dl class="mt-2">
								<dt>ID</dt>
								<dd>{photoId}</dd>
								<dt>Taken at</dt>
								<dd>{takenAt}</dd>
							</dl>
							<DeleteButton
								onDelete={() => {
									fetch(`http://localhost:3000/photo/${photoId}`, {
										method: 'DELETE',
									}).then((res) => {
										if (res.ok) route(`/photo/${next}`)
									})
								}}
							/>
							<AlbumCart photoId={photoId} onAdd={saveAndNext} />
						</div>
					</div>
				</article>
			</div>
		</>
	)
}
