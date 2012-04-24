(function() {
    var step = 7,
        $step = $('#step-' + step),
        model = window.grokModel,
        apiKey = $('#apiKey').val(), // gotten from step-1 html
        part2Link = $step.find('a');

    if (model) {
        part2Link.attr('href', part2Link.attr('href') +
            '?modelid=' + model.getId() +
            '&apiKey=' + apiKey);
    }

})();
