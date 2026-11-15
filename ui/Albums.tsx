import type { FunctionalComponent } from "preact"
import type { RoutableProps } from "preact-router"
import { useEffect, useState } from "preact/hooks"

export const Albums: FunctionalComponent<RoutableProps> = () => {
  const [albums, setAlbums] = useState<{ name: string; title: string; createdAt: string }[]>([])
  useEffect(() => {
    const t = setTimeout(() => {
      void fetch(`http://localhost:3000/albums`)
        .then(async (res) => res.json())
        .then(setAlbums)
    }, 250)

    return () => {
      clearTimeout(t)
    }
  }, [])
  return (
    <section>
      <h1>Albums</h1>
      <ul>
        {albums.map((album) => (
          <li>
            <small class="text-muted pe-1">
              {new Date(album.createdAt).toISOString().slice(0, 10)}
            </small>
            <a href={`/?${new URLSearchParams({ q: `album:${album.name}` })}`}>{album.title}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}
