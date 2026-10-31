
    function waitUntil(predicate) {
        var interval = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 70;
        return new Promise(function(resolve) {
            var int = setInterval(function() {
                predicate() && (resolve(predicate()), clearInterval(int), int = null);
            }, interval);
            setTimeout(function() {
                null !== int && (clearInterval(int), console.log("condition false"));
            }, 3e4);
        });
    }

    function updateProgressBarStorage() {

        var stepsEl = document.querySelector("form .phi-quote-steps");
        if (!stepsEl) return;

        var $steps = jQuery(stepsEl);
        var getTotalProgressBar = $steps.children().length;

        var getAllSteps = $steps.children(),
            activePosition = getAllSteps.filter(".active-step").first().index(),
            activeStepNumber = activePosition > -1 ? activePosition + 1 : 0;

        var stepParagraphs = $steps.children().find("p");
        var stepParagraphsText = stepParagraphs.map(function() {
            return jQuery(this).text().trim();
        }).get();

        if (jQuery('form .content-and-image h2').text().trim() !== 'Tell us about the type of cover you need') {
            localStorage.setItem("AT131ProgressBar", JSON.stringify(stepParagraphsText));
            localStorage.setItem("AT131ProgressBarActiveStep", activeStepNumber);
            localStorage.setItem("AT131ProgressBarLength", getTotalProgressBar);
        } else {
            localStorage.removeItem("AT131ProgressBar");
            localStorage.removeItem("AT131ProgressBarActiveStep");
            localStorage.removeItem("AT131ProgressBarLength");
        }
    }

    waitUntil(function() {
        return document.querySelector('form .phi-quote-steps') && "function" == typeof jQuery
    }).then(function() {

        var stepObserver = null;
        var currentStepsEl = null;
        var updateTimer = null;

        // Debounced so a burst of mutations only triggers a single storage update.
        function scheduleUpdate() {
            if (updateTimer) return;
            updateTimer = setTimeout(function() {
                updateTimer = null;
                updateProgressBarStorage();
            }, 100);
        }

        function attachStepObserver() {
            var stepsEl = document.querySelector('form .phi-quote-steps');

            // Steps node removed entirely — drop the stale observer.
            if (!stepsEl) {
                if (stepObserver) {
                    stepObserver.disconnect();
                    stepObserver = null;
                }
                currentStepsEl = null;
                return;
            }

            // Same node still in place — nothing to rebind.
            if (stepsEl === currentStepsEl) return;

            // Node was replaced (forward/back navigation) — rebind to the new one.
            if (stepObserver) stepObserver.disconnect();
            currentStepsEl = stepsEl;

            updateProgressBarStorage();

            stepObserver = new MutationObserver(function() {
                scheduleUpdate();
            });
            stepObserver.observe(stepsEl, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        }

        // Stable watcher: re-binds whenever the app re-renders and swaps the steps node,
        // and re-evaluates storage on any page/content change (h2, active-step, etc.).
        var rootObserver = new MutationObserver(function() {
            attachStepObserver();
            scheduleUpdate();
        });
        rootObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        attachStepObserver();

    });