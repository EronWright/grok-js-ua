(function() {
    var step = 2,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $button = $step.find('button'),
        $input = $step.find('input'),
        urlParams = window.grokUrlParams,
        client = window.grokClient,
        grokLog = window.grokLog,
        scrollTo = window.scrollToGrokStep,
        loadNext = window.helloGrokLoad;

    // get the model id from the url
    if (urlParams.modelid) {
        $input.val(urlParams.modelid);
    }

    $form.submit(function(evt) {
        evt.preventDefault();

        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');

        //{{highlight}}
        client.getModel($input.val(), function(err, model) {
            if (err) {
                return grokLog(err);
            }

            // stash globally
            window.grokModel = model;

            var msg = '<h4>Model "' + model.getId() +
                '" was retrieved.</h4>';
            msg += '<pre>' + model.toJSON(null, 2) + '</pre>';

            $out.html(msg);

            // load next
            loadNext(3);
        });
        //{{highlight-end}}
    });

})();
