(function() {
    var step = 6,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $input = $step.find('input'),
        $select = $step.find('select'),
        $button = $step.find('button'),
        $loadingImg = $out.find('img'),
        $status = $out.find('.status'),
        $swarm = $out.find('.swarm'),
        client = window.grokClient,
        previousModel = window.grokModel,
        grokLog = window.grokLog,
        loadNext = window.helloGrokLoad,
        scrollTo = window.scrollToGrokStep,
        chartData,
        chartOptions,
        chart,

        MAX_CHART_POINTS = 200;

    // set the model id previously processed as the model id in the form
    if (previousModel) {
        $input.val(previousModel.getId());
    }

    /***************************************************************************
     * For charting swarm results
     **************************************************************************/

    function constructChart() {
        var data = chartData = new google.visualization.DataTable();

        data.addColumn('datetime', 'time');
        data.addColumn('number', 'grok score');
        data.addColumn('number', 'avg error');

        chartOptions = {
            title: 'Swarm Status',
            height: 300,
            theme: 'maximized',
            pointSize: 3,
            series: [{
                color: 'blue',
                lineWidth: 2
            }, {
                color: 'red',
                lineWidth: 1
            }]
        };

        chart = new google.visualization.LineChart(document.getElementById('swarm-status-chart'));
    }

    function drawChart(swarm) {
        var swarmResults = swarm.get('results'),
            newRow = [],
            chartLength;
        
        if (! chart) {
            constructChart();
        }
        
        // datetime column
        newRow.push(new Date());
        
        // grok score column
        if (swarmResults && swarmResults.grokScore) {
            newRow.push(swarmResults.grokScore);
        } else {
            newRow.push(0);
        }
        
        // avg err column
        if (swarmResults && swarmResults.averageError) {
            newRow.push(swarmResults.averageError);
        } else {
            newRow.push(0);
        }
        
        chartData.addRow(newRow);
        // keep the chart small for performance reasons
        chartLength = chartData.getNumberOfRows();
        if (chartLength > MAX_CHART_POINTS) {
            chartData.removeRows(0, (chartLength - MAX_CHART_POINTS));
        }
        chart.draw(chartData, chartOptions);
    }

    function loadChart(callback) {
        google.load("visualization", "1", {
            packages:["corechart"],
            callback: callback
        });
    }

    function updateChart(swarm) {
        if (! chart) {
            // load chart if necessary
            loadChart(function() {
                // draw chart once loaded
                drawChart(swarm);
            });
        } else {
            // chart is loaded, so just draw it
            drawChart(swarm);
        }
    }

    /***************************************************************************
     * end charting functions
     **************************************************************************/


    $form.submit(function(evt) {
        evt.preventDefault();

        $loadingImg.show();
        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');

        var modelId = $input.val(),
            swarmSize = $select.find('option:selected').val();

        // if model id given is different than our current model, we'll
        // just get it first, then start a swarm on it

        if (previousModel && previousModel.getId() === modelId) {
            startSwarmFor(previousModel);
        } else {
            grokLog('Fetching model to swarm against (' + modelId + ')');
            client.getModel(modelId, function(err, model) {
                if (err) {
                    $button.removeAttr('disabled');
                    return grokLog(err);
                }
                startSwarmFor(model);
            });
        }

        function startSwarmFor(model) {
            //{{highlight}}
            model.startSwarm({size: swarmSize}, function(err, swarm, monitor) {
                if (err) {
                    $button.removeAttr('disabled');
                    return grokLog(err);
                }

                function onUpdate(lastSwarm) {
                    var status = lastSwarm.get('status'),
                        swarmDetails = lastSwarm.get('details') || {},
                        lastRecord = swarmDetails.numRecords || 0,
                        statusUpdate = '<p>Swarm "' + lastSwarm.getId() +
                            '" status: ' + status + '</p>';
                    statusUpdate += '<p>Last record seen: <span>' + lastRecord + '</span> (updated: ' + new Date() + ')</p>'
                    $status.html(statusUpdate);
                    $swarm.html(lastSwarm.toJSON(null, 2));
                    updateChart(lastSwarm);
                }

                onUpdate(swarm);

                scrollTo(6, '.output');

                // call onUpdate on every swarm update
                monitor.onPoll(onUpdate);

                // call this function when complete
                monitor.onStatus(GROK.Swarm.STATUS.COMPLETED, function(lastSwarm) {
                    var status = lastSwarm.get('status'),
                        duration;
                    if (status.toLowerCase() === 'completed') {
                        duration = monitor.stop();
                        $out.append('<p>Swarm finished in <strong>' + Math.floor(duration / 1000) + ' seconds</strong>.</p>');
                        $loadingImg.hide();
                        // load next
                        loadNext(7, 'SWARM COMPLETE.');
                    }
                });

                monitor.start();

            });
            //{{highlight-end}}
        }
    });

})();
