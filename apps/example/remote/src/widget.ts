const baseStyles = {
	background: 'linear-gradient(135deg, #0b172a, #0f3d5e)',
	color: '#f8fafc',
	padding: '1rem 1.25rem',
	borderRadius: '12px',
	border: '1px solid rgba(148, 163, 184, 0.35)',
	fontFamily: 'ui-sans-serif, system-ui, sans-serif',
	boxShadow: '0 12px 32px rgba(2, 6, 23, 0.25)',
};

export type RemoteWidgetPayload = {
	from?: string;
	loadedAt?: string;
	[key: string]: unknown;
};

export function renderRemoteWidget(
	mountPoint: HTMLElement | null,
	payload: RemoteWidgetPayload = {},
): void {
	if (!mountPoint) return;

	const wrapper = document.createElement('section');
	Object.assign(wrapper.style, baseStyles);

	const title = document.createElement('h2');
	title.textContent = 'Remote Widget';
	title.style.margin = '0 0 0.5rem';
	title.style.fontSize = '1.1rem';

	const byline = document.createElement('p');
	byline.textContent = 'Rendered from federated Vite remote';
	byline.style.margin = '0 0 0.75rem';
	byline.style.opacity = '0.85';

	const meta = document.createElement('pre');
	meta.textContent = JSON.stringify(payload, null, 2);
	meta.style.margin = '0';
	meta.style.padding = '0.75rem';
	meta.style.background = 'rgba(15, 23, 42, 0.65)';
	meta.style.borderRadius = '8px';
	meta.style.overflow = 'auto';
	meta.style.fontSize = '0.8rem';

	wrapper.append(title, byline, meta);
	mountPoint.innerHTML = '';
	mountPoint.appendChild(wrapper);
}
