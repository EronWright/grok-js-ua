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
