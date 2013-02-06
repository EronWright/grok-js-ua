(function() {
    var step = 4,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $loadingImg = $out.find('img'),
        $button = $step.find('button'),
        model = window.grokModel,
        grokLog = window.grokLog,
        scrollTo = window.scrollToGrokStep,
        loadNext = window.helloGrokLoad;

    $form.submit(function(evt) {
        evt.preventDefault();

        $loadingImg.show();
        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');

        /******************************************************************************
         * Promote the model
         *
         * Note: This will eventually go away in favor of automatic promotion
         *
         * When you promote a model you are taking it from the swarm into a
         * production ready state. You can then train the model further by sending
         * it more records (as we will do below) or you can start streaming your
         * live data right away.
         *
         * The current implementation has a quirk where the system will first
         * rerun the data from the swarm so that the production model is 'caught up.'
         * This means that the first new predictions you get back from the production
         * model will have ROWIDs greater than 0.
         */

        //{{highlight}}
        model.promote(function(err) {
            if (err) {
                return grokLog(err);
            }

            var msg = '<h4>Model "' + model.getId() +
                '" was promoted.</h4>';

            $out.html(msg);

            // load next
            loadNext(5);
        });
        //{{highlight-end}}
    });

})();
