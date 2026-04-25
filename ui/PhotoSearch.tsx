import { Link as RouterLink } from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'

type LinkProps = Parameters<typeof RouterLink>[0] & { href: string }
const Link = RouterLink as (props: LinkProps) => ReturnType<typeof RouterLink>

export const PhotoSearch = (_: { path?: string }) => {
	const [searchTerm, setSearchTerm] = useState(
		new URLSearchParams(document.location.search).get('q') ?? '',
	)
	const [matches, setMatches] = useState<{ name: string; url: string }[]>([])

	useEffect(() => {
		if (searchTerm.length < 3) return

		const t = setTimeout(() => {
			const params = new URLSearchParams()
			params.set('term', searchTerm.trim())

			fetch(`http://localhost:3000/photos?${params.toString()}`)
				.then(async (res) => res.json())
				.then((matches) => setMatches(matches))
		}, 250)

		return () => {
			clearTimeout(t)
		}
	}, [searchTerm])

	// List newest photos first
	useEffect(() => {
		if (searchTerm.length !== 0) return

		fetch(`http://localhost:3000/photos/byDate`)
			.then(async (res) => res.json())
			.then((matches) => setMatches(matches))
	}, [searchTerm])

	return (
		<>
			<form class="d-flex">
				<input
					class="form-control me-2"
					type="search"
					placeholder="Search"
					aria-label="Search"
					value={searchTerm}
					onInput={(e) => setSearchTerm(e.currentTarget.value)}
				/>
			</form>
			{matches.length > 0 && (
				<div>
					{matches.map((match) => (
						<PhotoThumb
							key={match.name}
							photo={match}
							onDeleted={() => {
								setMatches((matches) => matches.filter((m) => m !== match))
							}}
						/>
					))}
				</div>
			)}
			{matches.length === 0 && (
				<p>
					<em>Not matches.</em>
				</p>
			)}
		</>
	)
}

const PhotoThumb = ({
	photo,
	onDeleted,
}: {
	photo: { name: string; url: string }
	onDeleted: () => void
}) => {
	const [checked, setChecked] = useState<boolean>(false)
	return (
		<div style={{ float: 'left', position: 'relative' }}>
			<nav
				style={{
					position: 'absolute',
					bottom: '1rem',
					right: '1rem',
				}}
			>
				{checked && (
					<button
						type="button"
						class="btn btn-sm btn-danger me-2"
						onClick={() => {
							fetch(`http://localhost:3000/photo/${photo.name}`, {
								method: 'DELETE',
							}).then((res) => {
								if (res.ok) onDeleted()
							})
						}}
					>
						Delete
					</button>
				)}
				<input
					type="checkbox"
					checked={checked}
					onInput={(e) => {
						setChecked((e.target as HTMLInputElement).checked)
					}}
				/>
			</nav>
			<Link href={`/photo/${photo.name}`}>
				<img
					key={photo.url}
					src={`${photo.url}?w=250&h=250&fm=webp&fit=thumb&q=50`}
					style={{ width: '250px' }}
				/>
			</Link>
		</div>
	)
}
