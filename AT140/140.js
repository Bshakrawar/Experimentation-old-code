// https://www.hcf.com.au/insurance/health/get-a-quote/hcf-hospital-bronze-and-hcf-mid-extras
// https://www.hcf.com.au/insurance/health/application-form

console.log('✅ AT140 MAIN SCRIPT RUNNING - URL:', window.location.href);
console.log('✅ Pathname:', window.location.pathname);

function waitUntil(predicate) {
	var interval =
		arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 70;
	return new Promise(function (resolve) {
		var int = setInterval(function () {
			predicate() && (resolve(predicate()), clearInterval(int), (int = null));
		}, interval);
		setTimeout(function () {
			null !== int && (clearInterval(int), console.log('⏱️ AT140 condition timeout - element not found after 30s'));
		}, 3e4);
	});
}

waitUntil(function () {
	return (
		document.querySelector('#guideContainerForm') &&
		'function' == typeof jQuery
	);
}).then(function () {
	console.log('✅ AT140 - SUCCESS! Found guideContainerForm and jQuery');
	console.log('🎯 Starting A/B test logic...');
});
