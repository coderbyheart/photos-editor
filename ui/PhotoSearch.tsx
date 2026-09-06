import { Link as RouterLink } from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'

type LinkProps = Parameters<typeof RouterLink>[0] & { href: string }
const Link = RouterLink as (props: LinkProps) => ReturnType<typeof RouterLink>

const pageSize = 20

type PhotoMatch = {
	name: string
	url: string
	video?: { youtube: string }
}

type PhotoListResponse = {
	matches: PhotoMatch[]
	total: number
	page: number
	pageSize: number
}

export const PhotoSearch = (_: { path?: string }) => {
	const [searchTerm, setSearchTerm] = useState(
		new URLSearchParams(document.location.search).get('q') ?? '',
	)
	const [matches, setMatches] = useState<PhotoMatch[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(0)
	const [pagedByServer, setPagedByServer] = useState(true)

	const totalPages = Math.max(1, Math.ceil(total / pageSize))
	const currentPage = Math.min(page, totalPages - 1)

	// Accept both the legacy bare-array response and the paged envelope, so
	// the list renders against old and new servers alike.
	const setList = (data: PhotoListResponse | PhotoMatch[]) => {
		if (Array.isArray(data)) {
			setPagedByServer(false)
			setMatches(data)
			setTotal(data.length)
			return
		}
		setPagedByServer(true)
		setMatches(data.matches)
		setTotal(data.total)
	}

	useEffect(() => {
		if (searchTerm.length < 3) return

		const t = setTimeout(() => {
			const params = new URLSearchParams()
			params.set('term', searchTerm.trim())
			params.set('page', String(currentPage + 1))
			params.set('pageSize', String(pageSize))

			fetch(`http://localhost:3000/photos?${params.toString()}`)
				.then(async (res) => res.json())
				.then((data) => setList(data))
		}, 250)

		return () => {
			clearTimeout(t)
		}
	}, [searchTerm, currentPage])

	// List newest photos first
	useEffect(() => {
		if (searchTerm.length !== 0) return

		const params = new URLSearchParams()
		params.set('page', String(currentPage + 1))
		params.set('pageSize', String(pageSize))

		fetch(`http://localhost:3000/photos/byDate?${params.toString()}`)
			.then(async (res) => {
				if (res.ok) return res.json()
				// Legacy servers only serve the exact path without query params
				const legacy = await fetch(`http://localhost:3000/photos/byDate`)
				return legacy.json()
			})
			.then((data) => setList(data))
	}, [searchTerm, currentPage])

	// Without server paging (legacy response) slice the full list locally
	const visibleMatches = pagedByServer
		? matches
		: matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

	// Step back when the current page no longer exists (e.g. after deletes)
	useEffect(() => {
		if (page > totalPages - 1) setPage(totalPages - 1)
	}, [page, totalPages])

	return (
		<>
			<form class="d-flex">
				<input
					class="form-control me-2"
					type="search"
					placeholder="Search"
					aria-label="Search"
					value={searchTerm}
					onInput={(e) => {
						setSearchTerm(e.currentTarget.value)
						setPage(0)
					}}
				/>
			</form>
			{visibleMatches.length > 0 && (
				<div>
					{visibleMatches.map((match) => (
						<PhotoThumb
							key={match.name}
							photo={match}
							onDeleted={() => {
								setMatches((matches) => matches.filter((m) => m !== match))
								setTotal((total) => Math.max(0, total - 1))
							}}
						/>
					))}
				</div>
			)}
			{totalPages > 1 && (
				<nav
					class="d-flex justify-content-between align-items-center mt-2"
					aria-label="Photos pages"
				>
					<button
						class="btn btn-outline-secondary"
						type="button"
						disabled={currentPage === 0}
						onClick={() => setPage(currentPage - 1)}
					>
						prev
					</button>
					<span>
						Page {currentPage + 1} of {totalPages}
					</span>
					<button
						class="btn btn-outline-secondary"
						type="button"
						disabled={currentPage === totalPages - 1}
						onClick={() => setPage(currentPage + 1)}
					>
						next
					</button>
				</nav>
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
	photo: { name: string; url: string; video?: { youtube: string } }
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
				{photo.video !== undefined ? (
					<img
						src={`https://img.youtube.com/vi/${photo.video.youtube}/maxresdefault.jpg`}
						style={{ width: '250px', height: '250px', objectFit: 'cover' }}
					/>
				) : (
					<img
						key={photo.url}
						src={`${photo.url}?w=250&h=250&fm=webp&fit=thumb&q=50`}
						style={{ width: '250px' }}
					/>
				)}
			</Link>
		</div>
	)
}
