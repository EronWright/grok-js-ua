(function() {
    var step = 6,
        $step = $('#step-' + step),
        $form = $step.find('form'),
        $out = $step.find('.output'),
        $outputData = $out.find('.data-out'),
        $loadingImg = $out.find('img'),
        $button = $step.find('button'),
        client = window.grokClient,
        model = window.grokModel,
        urlParams = window.grokUrlParams,
        loadNext = window.helloGrokLoad,
        scrollTo = window.scrollToGrokStep,
        chartData,
        chartOptions,
        chart,

        STASH_KEY = 'predictions',
        MAX_CHART_POINTS = 350;

    // if there is no model from previous steps, check the URL for one and load it
    if (! model && urlParams.modelid) {
        client.getModel(urlParams.modelid, function(err, m) {
            model = m;
        });
    }

    /***************************************************************************
     * For charting swarm results
     **************************************************************************/

    function constructChart() {
        var data = chartData = new google.visualization.DataTable();

        data.addColumn('datetime', 'time');
        data.addColumn('number', 'consumption');
        data.addColumn('number', 'prediction');
        // to make prediction always dotted
        data.addColumn({type:'boolean',role:'certainty'});

        chartOptions = {
            title: 'Consumption predictions',
            height: 600,
            theme: 'maximized',
            pointSize: 3,
            series: [{
                color: 'blue'
            }, {
                color: 'grey',
                lineWidth: 1
            }]
        };

        chart = new google.visualization.LineChart(document.getElementById('prediction-chart'));

        scrollTo(6, ' .chart');

    }

    function drawChart(output) {
        var newRows = [],
            chartLength;

        if (! chart) {
            constructChart();
        }

        if (output.length > 1) {
            // the first row is always a header row
            console.log('Charting rows ' + output[1][0] + ' - ' + output[output.length-1][0]);
            output.forEach(function(row, i) {
                var newRow = [];
                // datetime column
                newRow.push(new Date(row[1]));
                // consumption value
                newRow.push(new Number(row[2]).valueOf());
                // prediction value
                newRow.push(new Number(row[5]).valueOf());
                // certainty=false (dotted line)
                newRow.push(false);

                newRows.push(newRow);
            });

            chartData.addRows(newRows);
            // keep the chart small for performance reasons
            chartLength = chartData.getNumberOfRows();
            if (chartLength > MAX_CHART_POINTS) {
                chartData.removeRows(0, (chartLength - MAX_CHART_POINTS));
            }
            chart.draw(chartData, chartOptions);
        }
    }

    function loadChart(callback) {
        google.load("visualization", "1", {
            packages:["corechart"],
            callback: callback
        });
    }

    function updateChart(output) {
        if (! chart) {
            // load chart if necessary
            loadChart(function() {
                // draw chart once loaded
                drawChart(output);
            });
        } else {
            // chart is loaded, so just draw it
            drawChart(output);
        }
    }

    /***************************************************************************
     * end charting functions
     **************************************************************************/

    function updateHtml(output) {
        var rows = output.length - 1,
            now = new Date();
        $outputData.html('<p>' + rows + ' new output rows received at ' + now + '</p>');
    }

    function toCsv(output) {
        var i, out = '';
        for (i = 0; i < output.length; i++) {
            out += output[i].join(',') + '\n';
        }
        return out;
    }

    function stashLocally(output) {
        localStorage.setItem(STASH_KEY,
            (localStorage.getItem(STASH_KEY) || '') + toCsv(output)
        );
    }

    $form.submit(function(evt) {
        var lastPrediction;
        evt.preventDefault();

        localStorage.setItem(STASH_KEY, '');

        $loadingImg.show();
        $button.attr('disabled', 'disabled');
        $out.removeClass('hidden');
        scrollTo(step, '.output');
        //{{highlight}}
        model.monitorPredictions({
            onUpdate: function(output) {
                var alignedRows = output.data;
                if (! alignedRows.length) {
                    return;
                }
                // if there was a last prediction stashed before, we add it back
                // as the "predicted" column of the first row of data
                if (lastPrediction) {
                    alignedRows[1][5] = lastPrediction;
                }
                // Pop off the last entry in the output, which is just a
                // prediction for the next time step. We'll save it and add it
                // to the next chunk of data, where the prediction is missing
                // in the first row
                lastPrediction = alignedRows.pop()[5];
                // not shift off the first row of the output, which is a header
                // row
                alignedRows.shift();
                updateChart(alignedRows);
                updateHtml(alignedRows);
                stashLocally(alignedRows);
            },
            onDone: function(duration) {
                $out.append('<p>Predictions caught up in <strong>' +
                    Math.floor(duration / 1000) + ' seconds</strong>.</p>');
                $loadingImg.hide();
                // load next
                loadNext(7, 'PREDICTIONS COMPLETE.');
            }
        });
        //{{highlight-end}}
    });

})();
