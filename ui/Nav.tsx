import { Link } from 'preact-router/match'

export const Nav = () => (
	<header class="container d-flex flex-wrap justify-content-center py-3 mb-4 border-bottom">
		<a
			href="/"
			class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-dark text-decoration-none"
		>
			<span class="fs-4">Photo Editor</span>
		</a>

		<ul class="nav nav-pills">
			<li class="nav-item">
				<Link href="/" class="nav-link active" aria-current="page">
					Photos
				</Link>
			</li>
			<li class="nav-item">
				<Link href="/albums" class="nav-link">
					Albums
				</Link>
			</li>
		</ul>
	</header>
)
