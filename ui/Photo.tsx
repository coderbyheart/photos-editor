import { useEffect, useState } from 'preact/hooks'
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
			class="btn btn-sm btn-outline-secondary ms-2"
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
			class="btn btn-sm btn-outline-secondary ms-2"
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
			class="btn btn-sm btn-outline-secondary ms-2"
			type="button"
			onClick={() => onClick(tags)}
		>
			{tags.join(', ')}
		</button>
	)
}

export const Photo = ({
	matches: { photoId },
}: {
	path: string
	matches?: { photoId: string }
}) => {
	const [photo, setPhoto] = useState<LoadedPhoto>()
	const [newTag, setNewTag] = useState<string>('')

	useEffect(() => {
		fetch(`http://localhost:3000/photo/${photoId}`)
			.then((res) => res.json())
			.then((photo) => setPhoto(photo))
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
		const tags = [...(photo.frontMatter.tags ?? []), newTag]
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
		<form>
			<dl>
				<dt>ID</dt>
				<dd>{photoId}</dd>
				<dt>
					Geo <LastGeoButton onClick={setGeo} />
				</dt>
				{geo !== undefined && (
					<dd>
						{geo.lat},{geo.lng}
						<LastGeoButton onClick={setGeo} />
					</dd>
				)}
				{geo === undefined && <dd>&mdash;</dd>}
				<dt>Taken at</dt>
				<dd>{takenAt}</dd>
				<dt>
					Tags
					<LastTagsButton onClick={setTags} />
				</dt>
				<dd>
					{(tags?.length ?? []) > 0 && (
						<ul>
							{tags.map((tag) => (
								<li>
									{tag}
									<button
										class="btn btn-sm btn-outline-danger ms-2"
										type="button"
										id="add-tag"
										onClick={() => {
											setPhoto({
												...photo,
												frontMatter: {
													...photo.frontMatter,
													tags: photo.frontMatter.tags.filter((t) => t !== tag),
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
				</dd>
			</dl>
			<fieldset class="mb-3">
				<label for="title" class="form-label">
					Title
				</label>
				<LastTitleButton onClick={setTitle} />
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
			</fieldset>
			<footer class="mb-4 d-flex justify-content-end">
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
			</footer>
			{photo?.frontMatter?.url !== undefined && (
				<img src={`${photo.frontMatter.url}?w=500`} style={{ width: '100%' }} />
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
			<PhotoMap
				geo={geo}
				onGeo={(geo) => {
					localStorage.setItem('geo', JSON.stringify(geo))
					setGeo(geo)
				}}
			/>
		</form>
	)
}
