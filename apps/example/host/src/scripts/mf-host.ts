const mountPoint = document.getElementById('remote-widget');
const statusEl = document.getElementById('remote-status');
const REMOTE_MANIFEST_URL = 'http://localhost:4322/mf-manifest.json';

const setStatus = (text: string): void => {
	if (statusEl) statusEl.textContent = text;
};

const showError = (error: string): void => {
	if (!mountPoint) return;
	mountPoint.innerHTML = '';
	const pre = document.createElement('pre');
	pre.textContent = String(error);
	mountPoint.appendChild(pre);
};

const ensureRemoteManifestReachable = async (): Promise<void> => {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), 2500);

	try {
		const response = await fetch(REMOTE_MANIFEST_URL, {
			mode: 'cors',
			signal: controller.signal,
		});

		if (response.ok) return;

		throw new Error(`Remote manifest returned HTTP ${response.status} from ${REMOTE_MANIFEST_URL}`);
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			[
				`Remote manifest unreachable: ${REMOTE_MANIFEST_URL}`,
				'Expected remote dev server on :4322.',
				'Start it with: pnpm dev:remote',
				`Reason: ${reason}`,
			].join('\n'),
		);
	} finally {
		window.clearTimeout(timeoutId);
	}
};

const start = async () => {
	try {
		await ensureRemoteManifestReachable();
		const remote = await import('astro_remote/widget');
		remote.renderRemoteWidget(mountPoint, {
			from: 'Astro host',
			loadedAt: new Date().toISOString(),
		});
		setStatus('Remote loaded from astro_remote/widget');
	} catch (error) {
		setStatus('Remote load failed. Check remote dev server on :4322.');
		const details = error instanceof Error ? error.stack || error.message : String(error);
		showError(details);
	}
};

setTimeout(() => {
	if (statusEl?.textContent === 'Loading remote module...') {
		setStatus('Still waiting for remote. Check remote dev server on :4322.');
	}
}, 4000);

start();
