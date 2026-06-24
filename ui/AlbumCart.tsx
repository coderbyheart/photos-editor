import { route } from 'preact-router'
import { useState } from 'preact/hooks'
export const AlbumCart = ({
	photoId,
	onAdd,
}: {
	photoId: string
	onAdd: () => void
}) => {
	const [entries, setEntries] = useState<string[]>(
		JSON.parse(localStorage.getItem('cart') ?? '[]'),
	)
	const [albumTitle, setAlbumTitle] = useState<string>('')

	const createAlbum = () => {
		const title = albumTitle.trim()
		if (title.length === 0 || entries.length === 0) return
		fetch(`http://localhost:3000/albums`, {
			method: 'POST',
			body: JSON.stringify({ title, photos: entries }),
		}).then(async (res) => {
			if (!res.ok) return
			const album = (await res.json()) as { name: string }
			localStorage.setItem('cart', JSON.stringify([]))
			setEntries([])
			setAlbumTitle('')
			route(`/?${new URLSearchParams({ q: `album:${album.name}` })}`)
		})
	}

	return (
		<>
			<div>
				<button
					class="btn btn-outline-danger"
					type="button"
					onClick={() => {
						setEntries(() => {
							const newEntries: string[] = []
							localStorage.setItem('cart', JSON.stringify(newEntries))
							return newEntries
						})
					}}
				>
					clear stash
				</button>
				{entries.includes(photoId) && (
					<button
						class="btn btn-outline-danger"
						type="button"
						onClick={() => {
							setEntries((entries) => {
								const newEntries = entries.filter((id) => photoId !== id)
								localStorage.setItem('cart', JSON.stringify(newEntries))
								return newEntries
							})
						}}
					>
						remove from stash
					</button>
				)}
				{!entries.includes(photoId) && (
					<button
						class="btn btn-outline-secondary"
						type="button"
						onClick={() => {
							setEntries((entries) => {
								const newEntries = [...entries, photoId]
								localStorage.setItem('cart', JSON.stringify(newEntries))
								onAdd()
								return newEntries
							})
						}}
					>
						add to stash <small>saves, and next</small>
					</button>
				)}
			</div>
			<ul>
				{entries
					.sort((a, b) => a.localeCompare(b))
					.map((e) => e.replace(/\.md$/, ''))
					.map((e) => (
						<li>{e}</li>
					))}
			</ul>
			{entries.length > 0 && (
				<div class="input-group mt-2">
					<input
						type="text"
						class="form-control"
						placeholder="New album title"
						aria-label="New album title"
						value={albumTitle}
						onInput={(e) => setAlbumTitle(e.currentTarget.value)}
						onKeyUp={(e: KeyboardEvent) => {
							if (e.key === 'Enter') createAlbum()
						}}
					/>
					<button
						class="btn btn-outline-primary"
						type="button"
						onClick={createAlbum}
						disabled={albumTitle.trim().length === 0}
					>
						create album from stash
					</button>
				</div>
			)}
		</>
	)
}
