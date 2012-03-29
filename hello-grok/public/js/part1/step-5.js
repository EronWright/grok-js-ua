(function() {
    var step = 5,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $textarea = $form.find('textarea'),
        $out = $step.find('.output'),
        $button = $step.find('button'),
        stream = window.grokStream,
        project = window.grokProject,
        grokLog = window.grokLog,
        scrollTo = window.scrollToGrokStep,
        loadNext = window.helloGrokLoad;

    // replace the {{streamId}} token with the real stream id
    $textarea.html(
        $textarea.html()
            .replace('{{streamId}}', '"' + stream.getId() + '"')
            .replace('{{timestamp}}', new Date().toString())
    );

    $form.submit(function(evt) {
        evt.preventDefault();

        var specString = $form.find('textarea').html(),
            jsonSpec;

        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');

        // convert string to JSON
        try {
            jsonSpec = JSON.parse(specString);
        } catch (e) {
            grokLog(new Error('Error parsing stream config to JSON!\n' +
                'You must have invalid JSON syntax.'));
            return;
        }
        //{{highlight}}
        project.createModel(jsonSpec, function(err, model) {
            if (err) {
                return grokLog(err);
            }

            // stash globally
            window.grokModel = model;

            var msg = '<h4>Model "' + model.getId() +
                '" was created.</h4>';
            msg += '<pre>' + model.toJSON(null, 2) + '</pre>';

            $out.html(msg);

            // load next
            loadNext(6);
        });
        //{{highlight-end}}
    });

})();
