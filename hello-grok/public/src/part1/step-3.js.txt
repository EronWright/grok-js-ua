(function() {
    var step = 3,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $button = $step.find('button'),
        grokLog = window.grokLog,
        client = window.grokClient,
        scrollTo = window.scrollToGrokStep,
        loadNext = window.helloGrokLoad;

    $form.submit(function(evt) {
        evt.preventDefault();
        var config = $form.find('textarea').html();
        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');

        // convert string to JSON
        try {
            config = JSON.parse(config);
        } catch (e) {
            grokLog(new Error('Error parsing stream config to JSON!\n' +
                'You must have invalid JSON syntax.'));
            return;
        }
        //{{highlight}}
        client.createStream(config, function(err, stream) {
            if (err) {
                return grokLog(err);
            }
            // stash globally
            window.grokStream = stream;

            var msg = '<h4>Stream "' + stream.getId() +
                '" was created.</h4>';
            msg += '<pre>' + stream.toJSON(null, 2) + '</pre>';
            $out.html(msg);

            // load next
            loadNext(4);
        });
        //{{highlight-end}}
    });

})();
