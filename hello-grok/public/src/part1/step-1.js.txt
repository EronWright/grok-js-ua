(function() {

    var step = 1,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $button = $step.find('button'),
        nextStep = 2,
        urlParams = window.grokUrlParams,
        grokLog = window.grokLog,
        loadNext = window.helloGrokLoad;

    nextStep = urlParams.skipto || nextStep;

    $form.submit(function(evt) {
        evt.preventDefault();

        var client,
            apiKey = $form.find('input').val();

        grokLog('using api key: ' + apiKey);

        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');

        //{{highlight}}
        // Create a new GROK.Client object with an API key, which will be used
        // for all interactions with the Grok API.
        window.grokClient = client = new GROK.Client(apiKey, {
            // this tells the UA library where on the server it should proxy
            // API calls
            proxyEndpoint: '_grokProxy',
            // the URL to the API we are using
            // TODO: update to http://api.numenta.com
            endpoint: 'http://dailystaging.numenta.com:8081'
        });

        /*
         * Initialize the client, which will go to the API with the key
         * specified and return the complete user details for that API key, or
         * else an error if the API key is incorrect.
         */
        client.init(function(err) {
            if (err) {
                return grokLog(err);
            }
            var msg = '<h4>User "' + client.get('firstName') + ' ' +
                client.get('lastName') + '" was validated.</h4>';
            msg += '<pre>' + client.toJSON(null, 2) + '</pre>';
            $out.html(msg);

            // load next
            loadNext(nextStep);
        });
        //{{highlight-end}}
    });

})();
