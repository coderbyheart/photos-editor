import Router from 'preact-router'
import { Nav } from './Nav'
import { Photo } from './Photo'
import { PhotoSearch } from './PhotoSearch'

export const App = () => (
	<>
		<Nav />
		<main class="container">
			<Router>
				<PhotoSearch path="/" />
				<Photo path="/photo/:photoId" />
			</Router>
		</main>
	</>
)
