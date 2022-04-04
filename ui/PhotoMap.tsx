import L from 'leaflet'
import { useEffect, useState } from 'preact/hooks'

export const PhotoMap = ({
	geo,
	onGeo,
}: {
	geo?: { lat: number; lng: number }
	onGeo: (geo: { lat: number; lng: number }) => void
}) => {
	const [zoom, setZoom] = useState<number>(12)

	useEffect(() => {
		console.log(`New map`)
		const map = L.map('map').setView(
			[geo?.lat ?? 63.4305094966943, geo?.lng ?? 10.39505368728824],
			zoom,
		)
		// add the OpenStreetMap tiles
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution:
				'&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
		}).addTo(map)
		if (geo !== undefined) L.marker([geo.lat, geo.lng]).addTo(map)
		map.on('click', (e: { latlng: L.LatLng }) => {
			onGeo(e.latlng)
		})
		map.on('zoom', () => {
			setZoom(map.getZoom())
		})
		return () => {
			map.off()
			map.remove()
		}
	}, [geo])

	return <div id="map" style={{ width: '100%', height: '500px' }} />
}
