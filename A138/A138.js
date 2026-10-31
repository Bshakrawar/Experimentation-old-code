const id = new URLSearchParams(window.location.search).get('ecid');

if (id) {
	const TARGET_URL = '/flybuys/insurance/health/get-a-quote/customise-cover';
	const BEACON_PATTERN = /\/b\/ss\//;
	const SETTLE_MS = 300;
	const MAX_WAIT = 5000;

	// TEMP DEBUG (remove before go-live): read on customise-cover with sessionStorage.getItem('a138log')
	const debugLog = (msg) => {
		try {
			const key = 'a138log';
			sessionStorage.setItem(
				key,
				(sessionStorage.getItem(key) || '') + Math.round(performance.now()) + 'ms ' + msg + '\n'
			);
		} catch (e) {}
	};
	try { sessionStorage.removeItem('a138log'); } catch (e) {}
	debugLog('start');
	// END TEMP DEBUG

	let redirected = false;

	const redirect = () => {
		if (redirected) return;

		redirected = true;
		debugLog('redirecting'); // TEMP DEBUG
		window.location.replace(TARGET_URL);
	};

	// Set the cap first so the user is never stuck if the observer is unsupported
	setTimeout(redirect, MAX_WAIT);

	try {
		new PerformanceObserver((list) => {
			list.getEntries()
				.filter((entry) => BEACON_PATTERN.test(entry.name))
				.forEach((entry) => debugLog('beacon done ' + Math.round(entry.responseEnd))); // TEMP DEBUG

			if (list.getEntries().some((entry) => BEACON_PATTERN.test(entry.name))) {
				setTimeout(redirect, SETTLE_MS);
			}
		}).observe({
			type: 'resource',
			buffered: true,
		});
	} catch (e) {
		// Older browsers: fall back to the cap only
		console.warn('PerformanceObserver is not supported, falling back to MAX_WAIT cap.', e);
		debugLog('observer error: ' + e.message); // TEMP DEBUG
	}
}