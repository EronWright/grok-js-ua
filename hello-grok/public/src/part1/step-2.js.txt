(function() {
    var step = 2,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $input = $form.find('input'),
        $button = $step.find('button'),
        $out = $step.find('.output'),
        grokLog = window.grokLog,
        client = window.grokClient,
        scrollTo = window.scrollToGrokStep,
        loadNext = window.helloGrokLoad;

    $input.val('Hello-Grok UA Example Project ' + new Date().getTime());

    $form.submit(function(evt) {
        evt.preventDefault();
        var name = $input.val();

        grokLog('using creating project "' + name + '"');

        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');
        //{{highlight}}
        client.createProject(name, function(err, project) {
            if (err) {
                return grokLog(err);
            }
            // stash globally
            window.grokProject = project;

            var msg = '<h4>Project "' + project.getName() +
                '" was created.</h4>';
            msg += '<pre>' + project.toJSON(null, 2) + '</pre>';
            $out.html(msg);

            // load next
            loadNext(3);
        });
        //{{highlight-end}}
    });

})();
