import { renderRemoteWidget } from '../widget.js';

const mount = document.getElementById('remote-standalone');
renderRemoteWidget(mount, {
	from: 'remote standalone page',
	loadedAt: new Date().toISOString(),
});
