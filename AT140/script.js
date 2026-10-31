console.log('AT140');
//https://www.hcf.com.au/insurance/health/get-a-quote/hcf-hospital-bronze-and-hcf-mid-extras

function waitUntilA140(predicate) {
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

function restoreConsoleLog() {
	var dummy = document.createElement('iframe');
	((dummy.style.display = 'none'),
		document.body.appendChild(dummy),
		(window.console = dummy.contentWindow.console));
}

// Run only on the base page or #cover-start-date; skip any other hash
function isA140Allowed() {
	return ['', '#cover-start-date'].indexOf(window.location.hash) !== -1;
}

// Selection kept across in-app steps; cleared only by Prev on this step
var a140SavedState = { answer: '', reason: '', otherReason: '' };

// Destination for selections (Power Automate / form service URL). Empty = local log only.
var A140_ENDPOINT = 'https://hcfofaustralia.sharepoint.com/:x:/r/teams/HCF-MXDD-AllEmployees-DigitalEnterprise-AllStaff/Shared%20Documents/Digital%20Enterprise%20-%20All%20Staff/3.%20Digital%20Acquisition%20Team/CRO%20Experimentation/Strategy%20Packs/AT140%20Data%20Capture.xlsx?d=w14fa3f3eb85b49ba8673a22d5a64b425&csf=1&web=1&e=93wEAB';

// Readable labels saved to the sheet instead of internal values
var A140_ANSWER_LABELS = { yes: 'Yes', no: 'No' };
var A140_REASON_LABELS = {
	'add-extras': 'I have hospital cover and want to add extras',
	'add-hospital': 'I have extras cover and want to add hospital cover',
	'change-cover': 'I want to change my current cover',
	'family-policy': 'I am moving from a HCF family policy onto my own policy',
	other: 'Other',
};
var A140_COLUMNS = ['User ID', 'Has HCF cover', 'Reason', 'Other reason'];

// TEST ONLY: selections are also kept in localStorage. Console helpers:
//   AT140_table()    - show all selections as a table
//   AT140_download() - download selections as CSV (opens in Excel)
//   AT140_clear()    - delete stored selections
//   AT140_newUser()  - switch to the next test user (AT140-User-02, 03...)
var A140_LOG_KEY = 'AT140_selections';

function a140ReadLog() {
	try {
		return JSON.parse(window.localStorage.getItem(A140_LOG_KEY)) || [];
	} catch (e) {
		return [];
	}
}

function a140StoreRow(row) {
	try {
		var log = a140ReadLog();
		log.push(row);
		window.localStorage.setItem(A140_LOG_KEY, JSON.stringify(log));
	} catch (e) {}
}

window.AT140_table = function () {
	var log = a140ReadLog();
	console.table(log, A140_COLUMNS);
	return log.length + ' selection(s)';
};

window.AT140_download = function () {
	var log = a140ReadLog();
	if (!log.length) return 'No selections stored';
	var esc = function (v) {
		return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
	};
	var csv = [A140_COLUMNS.map(esc).join(',')]
		.concat(
			log.map(function (row) {
				return A140_COLUMNS.map(function (c) {
					return esc(row[c]);
				}).join(',');
			})
		)
		.join('\r\n');
	// BOM so Excel reads UTF-8 correctly
	var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
	var a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'AT140-selections.csv';
	document.body.appendChild(a);
	a.click();
	a.remove();
	return log.length + ' selection(s) downloaded';
};

window.AT140_clear = function () {
	try {
		window.localStorage.removeItem(A140_LOG_KEY);
	} catch (e) {}
	return 'AT140 selections cleared';
};

// Sequential readable ID, e.g. AT140-User-01.
// TEST ONLY: the counter lives in this browser, so every browser starts at 01.
// For live data the number must come from the destination (one shared counter).
var A140_ID_PATTERN = /^AT140-User-\d{2,}$/;

function a140FormatUserId(n) {
	return 'AT140-User-' + (n < 10 ? '0' + n : String(n));
}

function a140NextUserId() {
	var n = 1;
	try {
		n = (parseInt(window.localStorage.getItem('AT140_userCounter'), 10) || 0) + 1;
		window.localStorage.setItem('AT140_userCounter', String(n));
		window.localStorage.setItem('AT140_userId', a140FormatUserId(n));
	} catch (e) {}
	return a140FormatUserId(n);
}

// Same ID for this browser across visits; replaces IDs in older formats
function a140GetUserId() {
	try {
		var id = window.localStorage.getItem('AT140_userId');
		if (id && A140_ID_PATTERN.test(id)) return id;
	} catch (e) {}
	return a140NextUserId();
}
var a140UserId = a140GetUserId();

// TEST ONLY: act as the next user in this browser
window.AT140_newUser = function () {
	a140UserId = a140NextUserId();
	return 'Now testing as ' + a140UserId;
};

function a140SendHit(data) {
	var row = {
		'User ID': a140UserId,
		'Has HCF cover': A140_ANSWER_LABELS[data.answer] || '',
		Reason: A140_REASON_LABELS[data.reason] || '',
		// Only relevant when 'Other' is the reason; blank otherwise
		'Other reason': data.reason === 'other' ? data.otherReason || '' : '',
	};

	console.log('AT140 selection:', row);
	a140StoreRow(row);
	if (!A140_ENDPOINT) return;

	// text/plain avoids a CORS preflight; keepalive lets the request survive navigation
	try {
		fetch(A140_ENDPOINT, {
			method: 'POST',
			mode: 'no-cors',
			keepalive: true,
			headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
			body: JSON.stringify(row),
		}).catch(function () {});
	} catch (e) {}
}

// Wait for either the demo form or production form
var a140Starting = false;

function startA140() {
	if (a140Starting || document.querySelector('.AT140-test-wrapper')) return;
	a140Starting = true;
	waitUntilA140(function () {
		return (
			isA140Allowed() &&
			document.querySelector('#guideContainerForm') &&
			'function' == typeof jQuery
		);
	}).then(function () {
		a140Starting = false;
		if (document.querySelector('.AT140-test-wrapper')) return;
		initA140();
	});
	// The wait gives up silently after 30s; allow a later retry
	setTimeout(function () {
		a140Starting = false;
	}, 31000);
}

// Re-add the test when the user returns to an allowed hash
window.addEventListener('hashchange', function () {
	if (isA140Allowed()) startA140();
});

startA140();

function initA140() {
	restoreConsoleLog();
	console.log('AT140 - Initializing A/B Test on Production');

	// Target the A/B test container
	const abTestContainerDiv = document.querySelector('#guideContainerForm');
	const mainForm = document.getElementById('guideContainerForm');

	// Create the A/B test form
	const abTestHTML = `
		<div class="AT140-test-wrapper">
			<div class="AT140-test-section">
				<h2 class="AT140-test-question">Do you currently have HCF health, extras, or ambulance cover?</h2>

				<div class="AT140-test-buttons">
					<button type="button" class="AT140-test-btn AT140-test-yes" data-value="yes">Yes</button>
					<button type="button" class="AT140-test-btn AT140-test-no" data-value="no">No</button>
				</div>
			</div>

			<div class="AT140-test-section AT140-test-reason-section" style="display: none;">
				<label class="AT140-test-label">What are you here to do?</label>
				<div class="AT140-dropdown" id="reasonDropdown">
					<button class="AT140-dropdown-toggle" type="button" aria-expanded="false">
						<span>Select reason</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.63128 9.88128C4.97299 9.53957 5.52701 9.53957 5.86872 9.88128L14 18.0126L22.1313 9.88128C22.473 9.53957 23.027 9.53957 23.3687 9.88128C23.7104 10.223 23.7104 10.777 23.3687 11.1187L14.6187 19.8687C14.277 20.2104 13.723 20.2104 13.3813 19.8687L4.63128 11.1187C4.28957 10.777 4.28957 10.223 4.63128 9.88128Z" fill="#3A3637"></path></svg>
					</button>
					<div class="AT140-dropdown-menu">
						<button type="button" class="AT140-dropdown-item" data-value="add-extras">I have hospital cover and want to add extras</button>
						<button type="button" class="AT140-dropdown-item" data-value="add-hospital">I have extras cover and want to add hospital cover</button>
						<button type="button" class="AT140-dropdown-item" data-value="change-cover">I want to change my current cover</button>
						<button type="button" class="AT140-dropdown-item" data-value="family-policy">I am moving from a HCF family policy onto my own policy</button>
						<button type="button" class="AT140-dropdown-item" data-value="other">Other</button>
					</div>
				</div>
			</div>

			<div class="AT140-test-section AT140-test-other-section" style="display: none;">
				<label class="AT140-test-label hidden">Please specify your reason</label>
				<input type="text" class="AT140-test-input" id="otherReasonInput" placeholder="Enter reason (Optional)">
			</div>

			<div class="AT140-test-info-section securityMessage" style="display: none;">
				<div class="info-container">
				  <div class="info-img"></div>
				  <div class="info-content">
				    <p class="icon-yourdetails-text">This application is for people who are not with HCF yet. To update your existing cover, get in touch with our team on <a href="tel:1800 062 063"><strong>1800 062 063</strong></a> between Monday to Friday, 8am to 8pm, or Saturday, 9am to 1pm (AEST / AEDT), or speak to use <a><strong>via chat.</strong></a></p>
				  </div>
				</div>
			</div>
		</div>
	`;

	abTestContainerDiv.insertAdjacentHTML('afterbegin', abTestHTML);

	// Initialize event listeners
	initializeA140Events(mainForm);
}

function initializeA140Events(mainForm) {
	const yesBtn = document.querySelector('.AT140-test-yes');
	const noBtn = document.querySelector('.AT140-test-no');
	const dropdown = document.querySelector('#reasonDropdown');
	const dropdownToggle = dropdown.querySelector('.AT140-dropdown-toggle');
	const dropdownLabel = dropdownToggle.querySelector('span');
	const dropdownItems = dropdown.querySelectorAll('.AT140-dropdown-item');
	const otherInput = document.querySelector('#otherReasonInput');
	const nextBtn = document.querySelector(
		'.oaf-container .footer-buttons-container .button-next'
	);
	const prevBtn = document.querySelector(
		'.oaf-container .footer-buttons-container .button-prev'
	);

	const reasonSection = document.querySelector('.AT140-test-reason-section');
	const otherSection = document.querySelector('.AT140-test-other-section');
	const dateSection = document.querySelector(
		'#guideContainerForm .guideContainerWrapperNode'
	);
	const infoSection = document.querySelector('.AT140-test-info-section');
	const abTestWrapper = document.querySelector('.AT140-test-wrapper');

	let selectedReason = '';
	let selectedAnswer = '';

	let locked = true;

	function setNext(disabled) {
		locked = disabled;
		nextBtn.classList.toggle('disabled', disabled);
		nextBtn.toggleAttribute('disabled', disabled);
		nextBtn.setAttribute('aria-disabled', String(disabled));
		nextBtn.style.pointerEvents = disabled ? 'none' : '';
		nextBtn.style.opacity = disabled ? '0.5' : '';
	}

	// The site re-enables the button after load, so re-apply our state
	const nextObserver = new MutationObserver(function () {
		if (locked && !nextBtn.classList.contains('disabled')) setNext(true);
	});
	nextObserver.observe(nextBtn, {
		attributes: true,
		attributeFilter: ['class', 'disabled'],
	});

	// Remove the test if the site moves to a hash where it must not run
	function teardownIfNotAllowed() {
		if (isA140Allowed()) return;
		window.removeEventListener('hashchange', teardownIfNotAllowed);
		nextObserver.disconnect();
		nextBtn.removeEventListener('click', blockWhenLocked, true);
		nextBtn.removeEventListener('click', onNextClick);
		prevBtn.removeEventListener('click', resetForm);
		document.removeEventListener('click', onDropdownClick, true);
		setNext(false);
		dateSection.style.display = '';
		abTestWrapper.remove();
	}
	window.addEventListener('hashchange', teardownIfNotAllowed);

	// Block the site's own click handlers while locked
	function blockWhenLocked(e) {
		if (locked) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	}
	nextBtn.addEventListener('click', blockWhenLocked, true);

	dateSection.style.display = 'none';
	setNext(true);

	function saveState() {
		a140SavedState = {
			answer: selectedAnswer,
			reason: selectedReason,
			otherReason: otherInput.value,
		};
	}
	otherInput.addEventListener('input', saveState);
	// Enter would submit the site's form and trigger validation on hidden fields
	otherInput.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			otherInput.blur();
		}
	});
	// 'change' fires once when the user leaves the field, not on every keystroke
	otherInput.addEventListener('change', function () {
		a140SendHit({
			answer: selectedAnswer,
			reason: selectedReason,
			otherReason: otherInput.value.trim(),
		});
	});

	// Handle Yes button
	function selectYes() {
		if (selectedAnswer === 'yes') return;
		selectedAnswer = 'yes';
		selectedReason = '';
		dropdownLabel.textContent = 'Select reason';
		dropdownItems.forEach(function (i) {
			i.classList.remove('active');
		});
		otherSection.style.display = 'none';
		infoSection.style.display = 'none';
		saveState();
		yesBtn.classList.add('active');
		noBtn.classList.remove('active');
		dateSection.style.display = 'none';
		reasonSection.style.display = 'block';
		setNext(true);
	}
	yesBtn.addEventListener('click', function () {
		if (selectedAnswer === 'yes') return;
		selectYes();
		a140SendHit({ answer: 'yes' });
	});

	// Handle No button
	function selectNo() {
		selectedAnswer = 'no';
		selectedReason = '';
		saveState();
		noBtn.classList.add('active');
		yesBtn.classList.remove('active');
		reasonSection.style.display = 'none';
		otherSection.style.display = 'none';
		dateSection.style.display = 'block';
		infoSection.style.display = 'none';
		setNext(false);
	}
	noBtn.addEventListener('click', function () {
		if (selectedAnswer === 'no') return;
		selectNo();
		a140SendHit({ answer: 'no' });
	});

	// Handle dropdown change
	function closeDropdown() {
		dropdown.classList.remove('AT140-open');
		dropdownToggle.setAttribute('aria-expanded', 'false');
	}

	// Single capture-phase handler so site scripts can't swallow the clicks
	function onDropdownClick(e) {
		const item = e.target.closest('.AT140-dropdown-item');
		if (item && dropdown.contains(item)) {
			e.preventDefault();
			dropdownItems.forEach(function (i) {
				i.classList.remove('active');
			});
			item.classList.add('active');
			dropdownLabel.textContent = item.textContent;
			closeDropdown();
			const changed = selectedReason !== item.dataset.value;
			onReasonChange(item.dataset.value);
			if (changed) {
				a140SendHit({
					answer: selectedAnswer,
					reason: selectedReason,
				});
			}
		} else if (dropdownToggle.contains(e.target)) {
			e.preventDefault();
			const open = dropdown.classList.toggle('AT140-open');
			dropdownToggle.setAttribute('aria-expanded', String(open));
		} else {
			closeDropdown();
		}
	}
	document.addEventListener('click', onDropdownClick, true);

	function onReasonChange(value) {
		selectedReason = value;
		saveState();

		// Show/hide date and info based on selection
		if (
			selectedReason === 'add-extras' ||
			selectedReason === 'add-hospital' ||
			selectedReason === 'change-cover'
		) {
			infoSection.style.display = 'block';
			dateSection.style.display = 'none';
			otherSection.style.display = 'none';
			setNext(true);
		} else if (selectedReason === 'family-policy') {
			dateSection.style.display = 'block';
			infoSection.style.display = 'none';
			setNext(false);
		} else if (selectedReason === 'other') {
			dateSection.style.display = 'block';
			otherSection.style.display = 'block';
			infoSection.style.display = 'none';
			setNext(false);
		} else {
			dateSection.style.display = 'none';
			infoSection.style.display = 'none';
			setNext(true);
		}
	}

	// Handle Previous button
	prevBtn.addEventListener('click', resetForm);

	// Restore the selection when coming back from a later step
	function restoreState(state) {
		if (state.answer === 'no') {
			selectNo();
		} else if (state.answer === 'yes') {
			selectYes();
			const item = dropdown.querySelector(
				'.AT140-dropdown-item[data-value="' + state.reason + '"]'
			);
			if (item) {
				item.classList.add('active');
				dropdownLabel.textContent = item.textContent;
				otherInput.value = state.otherReason || '';
				onReasonChange(state.reason);
			}
		}
	}
	restoreState(a140SavedState);

	// Handle Next button - PRODUCTION VERSION
	function onNextClick() {
		if (!locked) {
			const formData = {
				timestamp: new Date().toISOString(),
				answer: selectedAnswer,
				reason: selectedReason,
				otherReason: selectedReason === 'other' ? otherInput.value : '',
				coverStartDate: document.querySelector('#coverStartDate').value,
			};

			console.log('A/B Test Form Submitted:', formData);

			// Send to analytics if available
			if (window.trackEvent) {
				window.trackEvent('ab_test_complete', formData);
			}

			// Track with Google Analytics if available
			if (window.gtag) {
				window.gtag('event', 'ab_test_complete', formData);
			}

			// PRODUCTION: Show main form and hide A/B test
			if (mainForm) {
				// Hide A/B test container
				const abTestContainer =
					abTestWrapper.closest('.AT140-test-container') ||
					abTestWrapper.parentElement.parentElement;
				if (abTestContainer) {
					abTestContainer.style.display = 'none';
				}

				// Show main form
				mainForm.style.display = 'block';
				mainForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	}
	nextBtn.addEventListener('click', onNextClick);

	function resetForm() {
		selectedAnswer = '';
		selectedReason = '';
		yesBtn.classList.remove('active');
		noBtn.classList.remove('active');
		dropdownLabel.textContent = 'Select reason';
		dropdownItems.forEach(function (i) {
			i.classList.remove('active');
		});
		closeDropdown();
		otherInput.value = '';
		reasonSection.style.display = 'none';
		otherSection.style.display = 'none';
		dateSection.style.display = 'none';
		infoSection.style.display = 'none';
		setNext(true);
		saveState();
	}
}
