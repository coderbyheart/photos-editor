import {Router} from 'preact-router'
import { Albums } from './Albums.tsx'
import { Nav } from './Nav.tsx'
import { Photo } from './Photo.tsx'
import { PhotoSearch } from './PhotoSearch.tsx'

export const App = () => (
	<>
		<Nav />
		<main class="container">
			<Router>
				<PhotoSearch path="/" />
				<Photo path="/photo/:photoId" />
				<Albums path="/albums" />
			</Router>
		</main>
	</>
)
