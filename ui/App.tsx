import Router from 'preact-router'
import { Nav } from './Nav'
import { Photo } from './Photo'
import { PhotoSearch } from './PhotoSearch'
import { Albums } from './Albums'

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
