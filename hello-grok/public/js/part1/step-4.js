(function() {
    var step = 4,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $loadingImg = $out.find('img'),
        $button = $step.find('button'),
        grokLog = window.grokLog,
        stream = window.grokStream,
        scrollTo = window.scrollToGrokStep,
        loadNext = window.helloGrokLoad;

    $form.submit(function(evt) {
        evt.preventDefault();

        var inputData = $form.find('textarea').html(),
            formattedInput = [];

        $loadingImg.show();
        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');

        // split data into rows by newline
        inputData.split('\n').forEach(function(row) {
            // split rows into fields
            if (row) {
                // ignore empty rows
                formattedInput.push(row.split(','));
            }
        });

        // adjust the scroll after adding to output
        window.scrollToGrokStep(4, '.output');
        //{{highlight}}
        stream.addData(formattedInput, function(err) {
            if (err) {
                $button.removeAttr('disabled');
                return grokLog(err);
            }
            var msg = '<h4>Added data to "' + stream.getId() + '".</h4>';

            $out.html(msg);

            // load next
            loadNext(5);
        });
        //{{highlight-end}}
    });

})();
