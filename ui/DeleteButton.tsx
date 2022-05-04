import { useState } from 'preact/hooks'

export const DeleteButton = ({ onDelete }: { onDelete: () => void }) => {
	const [unlocked, setUnlocked] = useState<boolean>(false)

	return (
		<div>
			<label>
				<input
					type="checkbox"
					checked={unlocked}
					onChange={() => setUnlocked((u) => !u)}
				/>{' '}
				I am sure.
			</label>
			<button
				class="btn btn-outline-danger ms-2"
				disabled={!unlocked}
				type="button"
				onClick={onDelete}
			>
				Delete
			</button>
		</div>
	)
}
