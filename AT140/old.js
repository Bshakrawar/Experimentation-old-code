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
					<button class="AT140-test-btn AT140-test-yes" data-value="yes">Yes</button>
					<button class="AT140-test-btn AT140-test-no" data-value="no">No</button>
				</div>
			</div>

			<div class="AT140-test-section AT140-test-reason-section" style="display: none;">
				<label class="AT140-test-label">What are you here to do?</label>
				<select class="AT140-test-dropdown" id="reasonDropdown">
					<option value="">Select reason</option>
					<option value="add-extras">I have hospital cover and want to add extras</option>
					<option value="add-hospital">I have extras cover and want to add hospital cover</option>
					<option value="change-cover">I want to change my current cover</option>
					<option value="family-policy">I am moving from a HCF family policy onto my own policy</option>
					<option value="other">Other</option>
				</select>
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
				    <p class="icon-yourdetails-text">This application is for people who are not with HCF yet. To update your existing cover, get in touch with our team on <a href="tel:1800 062 063"><strong>1800 062 063</strong></a> between Monday to Friday, 8am to 8pm, or Saturday, 9am to 1pm (AEST / AEDT), or speak to use <a>via chat.</a></p>
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

	// Handle Yes button
	yesBtn.addEventListener('click', function () {
		selectedAnswer = 'yes';
		yesBtn.classList.add('active');
		noBtn.classList.remove('active');
		reasonSection.style.display = 'block';
		// updateNextButtonState();
	});

	// Handle No button
	noBtn.addEventListener('click', function () {
		selectedAnswer = 'no';
		noBtn.classList.add('active');
		yesBtn.classList.remove('active');
		reasonSection.style.display = 'none';
		otherSection.style.display = 'none';
		dateSection.style.display = 'block';
		infoSection.style.display = 'none';
		setNext(false);
	});

	// Handle dropdown change
	dropdown.addEventListener('change', function () {
		selectedReason = this.value;

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
	});

	// Handle Previous button
	prevBtn.addEventListener('click', resetForm);

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
		dropdown.value = '';
		otherInput.value = '';
		reasonSection.style.display = 'none';
		otherSection.style.display = 'none';
		dateSection.style.display = 'none';
		infoSection.style.display = 'none';
		setNext(true);
	}
}
