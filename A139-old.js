function waitUntil(predicate) {
	var interval =
		arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 70;
	return new Promise(function (resolve) {
		var int = setInterval(function () {
			predicate() && (resolve(predicate()), clearInterval(int), (int = null));
		}, interval);
		setTimeout(function () {
			null !== int && (clearInterval(int), console.log('condition false'));
		}, 3e4);
	});
}

waitUntil(function () {
	return (
		document.querySelector('form.js-hp-s1-panel-form button.btn-primary') &&
		'function' == typeof jQuery
	);
}).then(function () {
	console.log('adding');
	const pathName = window.location.pathname;

	const form = jQuery('form.js-hp-s1-panel-form');
	console.log(form);

	const redirectPath =
		pathName + '/insurance/health/get-a-quote/customise-cover#objective';

	form.attr('data-redirect', redirectPath);
	jQuery('form.js-hp-s1-panel-form button.btn-primary').click(function () {
		localStorage.setItem('A139_test', 'clicked');
	});
	// insurance/health/get-a-quote/quick-quote#
});

waitUntil(function () {
	return (
		document.querySelector('.has-left-arrow') && 'function' == typeof jQuery
	);
}).then(function () {


	function checkStep() {
		console.log('function load');
		const pathName = window.location.pathname;
		var url = document.URL;
		if (url.includes('customise-cover#objective')) {
			console.log('true', url);
			var target = pathName + '/insurance/health/get-a-quote/quick-quote#';
			console.log(target);
			// change the button here
			jQuery('.has-left-arrow').click(function (e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				var base = window.location.pathname.split('/insurance/')[0]; // e.g. "/flybuys"
				var target = base + '/insurance/health/get-a-quote/quick-quote#';
				console.log('redirecting to', target);
				window.location.href = target;
			});
		}
	}
	if (localStorage.getItem('A139_test') === 'clicked') {
		checkStep(); // initial load
		//after changes
		['pushState', 'replaceState'].forEach(function (m) {
			var orignalMethod = history[m]; // save the original method
			history[m] = function () {
				// replace it with  wrapper
				var r = orignalMethod.apply(this, arguments); // call the original
				window.dispatchEvent(new Event('urlchange'));
				return r;
			};
		});
		window.addEventListener('urlchange', checkStep);
	}
});

// Quick-quote step 1 ("Get a quick quote"): let the site save the answers, then redirect
(function () {
	var QUICK_QUOTE_TARGET = '/insurance/health/get-a-quote/customise-cover#objective';

	if (localStorage.getItem('A139_test') !== 'clicked') return;

	document.addEventListener(
		'submit',
		function (e) {
			var form = e.target;
			if (!form.closest('#root-phi-quote')) return;

			var btn = form.querySelector('button[type="submit"]');
			if (!btn || btn.textContent.trim() !== 'Get a quick quote') return;

			var startUrl = document.URL;
			console.log('A139: quick quote submitted');

			// Wait for the site to move to the next step (data is saved by then), then redirect
			var poll = setInterval(function () {
				if (document.URL !== startUrl) {
					clearInterval(poll);
					var base = window.location.pathname.split('/insurance/')[0]; // e.g. "/flybuys"
					var target = base + QUICK_QUOTE_TARGET;
					console.log('A139: redirecting to', target);
					window.location.replace(target);
				}
			}, 50);
			setTimeout(function () {
				clearInterval(poll);
			}, 10000);
		},
		true
	);
})();
