/*
 * ----------------------------------------------------------------------
 *  Copyright (C) 2006-2012 Numenta Inc. All rights reserved.
 *
 *  The information and source code contained herein is the
 *  exclusive property of Numenta Inc. No part of this software
 *  may be used, reproduced, stored or distributed in any form,
 *  without explicit written authorization from Numenta Inc.
 * ---------------------------------------------------------------------- */
(
    /**
     * @param {!Object} global The Global namespace.
     */
    function(global) {

        var GROK = global.GROK;

        function PredictionPlotter(elementId, model, options) {
            this.elementId = elementId;
            this.model = model;
            this.options = options || {};
        }

        PredictionPlotter.prototype.render = function() {
            var me = this;
            this.model.getStream(function(err, stream) {
                // TODO: handle multiple data sources
                var fieldDefs = stream.get('dataSources')[0].fields,
                    temporalFieldName,
                    series = [],
                    names,
                    prediction = {},
                    lastPrediction;

                if (err && this.options.onError) {
                    return this.options.onError(err);
                }

                // populate find the temporal field
                fieldDefs.forEach(function(field, index) {
                    if (field.dataFormat.dataType === 'DATETIME') {
                        temporalFieldName = field.name;
                    }
                });

                function getPlotPointsIndexedBySeries(output, names, series) {
//                    var toPlot = {};
                    var toPlot = [];
                    // ignore header row
                    output.shift();
                    output.forEach(function(row) {
                        var timestamp;
                        // processing rows
                        row.forEach(function(field, fieldIndex) {
                            // processing fields
                            names.forEach(function(name, nameIndex) {
                                if (fieldIndex === nameIndex) {
                                    // we have something to plot
                                    if (name === temporalFieldName) {
                                        timestamp = field;
                                    }
                                }
                            });
                            series.forEach(function(chartSeries, seriesIndex) {
                                if (chartSeries.name == names[fieldIndex]) {
//                                    if (! toPlot[seriesIndex]) {
//                                        toPlot[seriesIndex] = [];
//                                    }
//                                    toPlot[seriesIndex].push({
//                                        timestamp: new Date(timestamp).getTime(),
//                                        value: new Number(field).valueOf()
//                                    });
                                    toPlot.push([seriesIndex, {
                                        timestamp: new Date(timestamp).getTime(),
                                        value: new Number(field).valueOf()
                                    }]);
                                }
                            });
                        });
                    });
                    return toPlot;
                }

                me.model.getOutputData({align: true, limit: 100}, function(err, output) {
                    if (err) throw err;

                    var pointsIndexedBySeries;
                    names = output.shift();
                    // find the prediction column
                    names.forEach(function(name, index) {
                        if (name === 'ROWID' || name === temporalFieldName) {
                            // skip row id
                            return;
                        }
                        if (name === 'Average Grok Score' || name === 'Grok Score') {
                            // eventually we'll chart these, but not here and now
                            return;
                        }
                        if (name.indexOf('Temporal Predicted') === 0) {
                            prediction.name = name;
                            prediction.index = index;
                        }
                        series.push({
                            name: name,
                            data: []
                        })
                    });

                    // stash the last prediction to add to the first row of the
                    // next output array, if it comes
                    lastPrediction = output.pop()[prediction.index];

                    pointsIndexedBySeries = getPlotPointsIndexedBySeries(output, names, series);

                    pointsIndexedBySeries.forEach(function(p) {
                        var seriesIndex = p[0],
                            timestamp = p[1].timestamp,
                            value = p[1].value;
                        series[seriesIndex].data.push([timestamp, value]);
                    });

//                    Object.keys(pointsIndexedBySeries).forEach(function(seriesIndex) {
//                        pointsIndexedBySeries[seriesIndex].forEach(function(point) {
//                            if (point.timestamp) {
//                                series[seriesIndex].data.push([point.timestamp, point.value]);
//                            }
//                        });
//                    });

                    // the initial chart
                    me.chart = new Highcharts.Chart({
                        title: 'Grok Predictions',
                        chart: {
                            type: 'line',
                            renderTo: me.elementId
                        },
                        xAxis: {
                            type: 'datetime'
                        },
                        series: series
                    });

                    me.model.monitorPredictions({
                        limit: 0,
                        startAt: output[output.length - 1][1], // last row id
                        onUpdate: function(output) {
                            var newPoints,
                                pointsAdded = 0,
                                alignedRows = me.model.alignOutputData(output);
                            // put last prediction into place
                            alignedRows[1][prediction.index] = lastPrediction;
                            lastPrediction = alignedRows.pop()[prediction.index];
                            newPoints = getPlotPointsIndexedBySeries(alignedRows, names, series);
                            newPoints.forEach(function(p) {
                                var seriesIndex = p[0],
                                    timestamp = p[1].timestamp,
                                    value = p[1].value;
                                me.chart.series[seriesIndex].addPoint([timestamp, value]);
//                                if ((pointsAdded++ / 2) % 10) {
//                                    me.chart.redraw();
//                                }
                            });
                            me.chart.redraw();
//                            Object.keys(newPoints).forEach(function(seriesIndex) {
//                                var seriesPoints = newPoints[seriesIndex];
//                                seriesPoints.forEach(function(point, pointIndex) {
//                                    var pointData = [point.timestamp, point.value];
////                                    console.log('adding ' + pointData + ' points to chart series ' + seriesIndex);
//                                    me.chart.series[seriesIndex].addPoint(pointData, false, false);
//                                });
//                            });
//                            me.chart.redraw();
                        },
                        onDone: function() {
                            alert('no more predictions');
                        }
                    });

                });
            });
        };

        GROK.charts = {
            PredictionPlotter: PredictionPlotter
        };

        /******************************************************************************
         * The postfix below allows this JS source code to be executed within the UA
         * environment.
         *****************************************************************************/

    }
)(window);
