import { Link } from 'preact-router/match'
import { useEffect, useState } from 'preact/hooks'

export const PhotoSearch = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [matches, setMatches] = useState<string[]>([])

	useEffect(() => {
		let isMounted = true

		if (searchTerm.length < 3) return

		const t = setTimeout(() => {
			const params = new URLSearchParams()
			params.set('term', searchTerm.trim())

			fetch(`http://localhost:3000/photos?${params.toString()}`)
				.then((res) => res.json())
				.then((matches) => setMatches(matches))
		}, 250)

		return () => {
			isMounted = false
			clearTimeout(t)
		}
	}, [searchTerm])

	// List newest photos first
	useEffect(() => {
		if (searchTerm.length !== 0) return

		fetch(`http://localhost:3000/photos/byDate`)
			.then((res) => res.json())
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
					onInput={(e: { target: HTMLInputElement }) =>
						setSearchTerm(e.target.value)
					}
				/>
			</form>
			{matches.length > 0 && (
				<ul>
					{matches.map((match) => (
						<li>
							<Link href={`/photo/${match}`}>{match}</Link>
						</li>
					))}
				</ul>
			)}
			{matches.length === 0 && (
				<p>
					<em>Not matches.</em>
				</p>
			)}
		</>
	)
}
