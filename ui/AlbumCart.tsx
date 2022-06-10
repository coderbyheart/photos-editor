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

	return (
		<>
			<div>
				<button
					class="btn btn-outline-danger"
					type="button"
					onClick={() => {
						setEntries(() => {
							const newEntries = []
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
					.map((e) => (
						<li>{e}</li>
					))}
			</ul>
		</>
	)
}
