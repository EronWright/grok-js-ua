(function() {
    var step = 7,
        $step = $('#step-' + step),
        csv = window.escape(localStorage.getItem('predictions'));

    $step.find('a').attr('href', 'data:text/csv,' + csv);

})();
