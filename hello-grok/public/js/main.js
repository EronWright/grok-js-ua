$(document).ready(function() {

    var $body = $('body'),
        $logContainer = $('#logs'),
        $logs = $logContainer.find('ul'),
        logsShowing = true,
        announceCount = 0,
        htmlFileName,
        scrollTimeout;

    function htmlEncode(value){
        return $('<div/>').text(value).html();
    }

    function transition(text, cb) {
        var announceId = announceCount,
            html = '<div id="ann-' + announceId
                + '" class="announce" style="display:none">' +text + '</div>';
        $body.append(html);
        $('#ann-' + announceId).show('slow', function() {
            setTimeout(cb, 500);
        });
        announceCount++;
    }

    function toggleLogs() {
        $logs.toggle();
        if (logsShowing) {
            $logContainer.animate({
                width: 40,
                height: 40,
                opacity: 0.5
            });
        } else {
            $logContainer.animate({
                width: 300,
                height: 300,
                opacity: 1.0
            })
        }
        logsShowing = ! logsShowing;
    }

    // The file name of this html file will identify the subdirectory for our js
    // and html used in this example.
    htmlFileName = window.location.href.split('/').pop().split('.').shift();

    // Some of our steps will use values stored within the query string of the
    // URL in the address bar. We'll convert into an object and stash globally.
    (function() {
        var queryString, queryObject;
        if (window.location.href.indexOf('?') > 0) {
            queryString = window.location.href.split('?').pop();
            if (queryString.indexOf('#') > -1) {
                queryString = queryString.split('#').shift();
            }
            queryObject = {};
            queryString.replace(
                new RegExp("([^?=&]+)(=([^&]*))?", "g"),
                function($0, $1, $2, $3) { queryObject[$1] = $3; }
            );
            window.grokUrlParams = queryObject;
        } else {
            window.grokUrlParams = {};
        }
    })();

    // the global function used to load next steps
    window.helloGrokLoad = function(num, transitionMessage) {

        if (transitionMessage) {
            transition(transitionMessage, function() {
                window.helloGrokLoad(num);
            });
            return;
        }

        // if it is already on the page, don't load it
        if ($('#step-' + num)[0]) {
            return;
        }

        function loadComplete() {
            var $step = $('#step-' + num),
                $source = $step.find('.source'),
                triggerHtml;
            if ($source[0]) {
                $source.hide();
                triggerHtml = '<div class="right"><a href="#" class="trigger">toggle source</a></div>';
                $source.before(triggerHtml);
                $step.find('a.trigger').click(function(evt) {
                    evt.preventDefault();
                    $source.toggle('slow');
                    window.scrollToGrokStep(num);
                });
            }
            window.scrollToGrokStep(num);
        }

        $.ajax('html/' + htmlFileName + '/step-' + num + '.html', {
            success: function(resp) {
                var jsFile = 'js/' + htmlFileName + '/step-' + num + '.js',
                    srcFile = 'src/' + htmlFileName + '/step-' + num + '.js.txt';
                $body.append(resp);
                $LAB.script(jsFile).wait(function() {
                    // the script is in the HEAD now, but we want to go get it
                    // so we can use the content if there is a place in the
                    // markup to put the source element
                    var $sourceElem = $('#step-' + num + ' .source');
                    if ($sourceElem[0]) {
                        $.ajax(srcFile, {
                            success: function(js) {
                                js = htmlEncode(js);
                                // replace any {{highlight}} tokens
                                js = js.replace(/\/\/\{\{highlight\}\}/g, '<div class="highlight">')
                                       .replace(/\/\/\{\{highlight-end\}\}/g, '</div>');
                                $sourceElem.html(js);
                                loadComplete();
                            }
                        });
                    } else {
                        loadComplete();
                    }
                });
            }
        });
    };

    // autoscroll!
    window.scrollToGrokStep = function(num, selector) {
        selector = selector || '';
        selector = '#step-' + num + ' ' + selector;
        $('html, body').animate({
            scrollTop: $(selector).offset().top
        }, 1000);

    };

    // make logging available to all steps
    window.grokLog = function(msg, type) {
        type = type || 'info';
        if (msg instanceof Error) {
            type = 'error';
            msg = msg.message;
        }
        if (type === 'error') {
            $logs.show();
        }
        $logs.prepend('<li class="' + type + '">' + msg + '</li>');
    };

    function slideLogs() {
        $logContainer.animate({
            top: window.pageYOffset + 10
        }, 300);
    }

    // on every window scroll, wait for the scroll events to stop coming in,
    // then slide the TOC element back to the top right of the visible page.
    window.onscroll = function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(slideLogs, 100);
    };

    $logContainer.click(toggleLogs);

    // load step 1
    window.helloGrokLoad(1);

});
