(function() {
    var step = 3,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $button = $step.find('button'),
        model = window.grokModel,
        grokLog = window.grokLog,
        scrollTo = window.scrollToGrokStep,
        loadNext = window.helloGrokLoad;

    $form.submit(function(evt) {
        evt.preventDefault();

        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');

        //{{highlight}}
        model.getStream(function(err, stream) {
            if (err) {
                return grokLog(err);
            }

            // stash globally
            window.grokStream = stream;

            var msg = '<h4>Stream "' + stream.getId() +
                '" was retrieved.</h4>';
            msg += '<pre>' + stream.toJSON(null, 2) + '</pre>';

            $out.html(msg);

            // load next
            loadNext(4);
        });
        //{{highlight-end}}
    });

})();
