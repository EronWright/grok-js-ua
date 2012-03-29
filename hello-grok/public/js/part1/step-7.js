(function() {
    var step = 7,
        $step = $('#step-' + step),
        model = window.grokModel,
        part2Link = $step.find('a');

    if (model) {
        part2Link.attr('href', part2Link.attr('href') + '?modelid=' + model.getId());
    }

})();
