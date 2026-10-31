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
});
