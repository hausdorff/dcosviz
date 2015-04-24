MESOS_MASTER = "http://srv6.hw.ca1.mesosphere.com:5050/"

REFRESH = true;
INTERVAL = 2000;
SIMULATION = true;

$().ready(function () {

    $(window).resize(function () {
        renderBlocks();
    });

    var SIMULATE_BASETASK = 5;

    var url = MESOS_MASTER + "state.json"

    var STATE = [];

    var STATE_META = [];

    var fetchState = function (cb) {

        $.jsonp({
            url: url + "?jsonp=?",
            done: function (data) {
                var tasks = _.map(data.frameworks, function (fw) {
                    var len = fw.tasks ? _.filter(fw.tasks, function (t) { return t.state == "TASK_RUNNING" }).length : 0;
                    return {
                        "name": fw.name.split("-")[0],
                        "task_count": len
                    };
                });

                setState(tasks);
            },
            error: function (data) {

            },
            complete: function (data) {
                renderBlocks();
            }
        });

        //$.getJSON(url + "?jsonp=?")
        //    .done(function (data) {
        //        var tasks = _.map(data.frameworks, function (fw) {
        //            var len = fw.tasks ? _.filter(fw.tasks, function (t) { return t.state == "TASK_RUNNING" }).length : 0;
        //            return {
        //                "name": fw.name.split("-")[0],
        //                "task_count": len
        //            };
        //        });
        //        STATE.shift();
        //        STATE.push(tasks);
        //        _.delay(cb, INTERVAL);
        //    }.bind(this));
    };

    $("#set_taskstate").on('click', function () {
        var nin1 = $("#sim1_tasks").val();
        var nin2 = $("#sim2_tasks").val();
        var nin3 = $("#sim3_tasks").val();
        setState([
            { "name": "simulated 1", "task_count": nin1 },
            { "name": "simulated 2", "task_count": nin2 },
            { "name": "simulated 3", "task_count": nin3 },
        ]);
        renderBlocks();
    });
    $("#polling-option").on('click', function () {
        if (this.checked) {
            REFRESH = false;
        } else {
            REFRESH = true;
        }
    });

    function setState(tasks) {
        var mastasks = STATE[0];
        if (!mastasks) { mastasks = []; }

        var buf = [];

        if (mastasks.length === 0) {
            STATE_META = [];
            _.each(tasks, function (v, i) {
                STATE_META.push({ "name": v.name, "task_count": v.task_count, "color": i });
                buf = buf.concat(getArray(v.name, v.task_count, i));
            });

            STATE.push(_.shuffle(buf));

        } else {
            // delta algorithm
            _.each(tasks, function (v, i) {
                var node = _.find(STATE_META, function (v2) { return v2.name === v.name });
                if (!node) {
                    // push, but we have a color problem
                    // TODO: fix
                } else {
                    if (v.task_count > node.task_count) {

                        // add
                        tasksToAdd = v.task_count - node.task_count;
                        node.task_count = new Number(node.task_count) + tasksToAdd;
                        buf = buf.concat(getArray(v.name, tasksToAdd, i));

                    } else if (v.task_count < node.task_count) {

                        // subtract
                        tasksToSub = node.task_count - v.task_count;
                        node.task_count = new Number(node.task_count) - tasksToSub;
                        for (var i = 0; i < tasksToSub; i++) {
                            var idx = _.findIndex(STATE[0], { "name": v.name });
                            if (idx !== -1) {
                                STATE[0].splice(idx, 1);
                            }
                        }

                    }
                }
            });

            STATE[0] = STATE[0].concat(_.shuffle(buf));
        }

    }

    function getArray(name, count, color) {
        if (count <= 0) return [];

        var arr = new Array(count);
        for (var i = 0; i < count; i++) {
            arr[i] = { "name": name, "color": color };
        }

        return arr;
    }

    function renderBlocks() {
        var mastasks = STATE[0];

        if (!mastasks) { mastasks = [] };

        var totalTasks = mastasks.length;
        $(".total-tasks :first-child").html(totalTasks);
        _.each(STATE_META, function (v, i) {
            $(".slot" + i + " :first-child").html(v.task_count);
            $(".slot" + i + " :last-child").html(v.name);
            $(".slot" + i).removeClass("hide");
        });

        var canvas = $("#canvas1");
        var context = canvas[0].getContext("2d");
        context.canvas.height = canvas.height();
        context.canvas.width = canvas.height();
        context.clearRect(0, 0, canvas.width(), canvas.height());

        // determine size of square
        var area = context.canvas.width * context.canvas.height;
        var cols = Math.ceil(Math.sqrt(totalTasks));
        var rows = Math.ceil(totalTasks / cols);
        var squareWidth = Math.floor(context.canvas.width / cols) - 5; // 5 is border
        //console.log("area: ", area, "cols", cols, "rows", rows, "size", squareWidth, "canvas:width", context.canvas.width, "canvas:height", context.canvas.height);
        var x = 0;
        var y = 0;
        for (var i = 0; i < totalTasks; i++) {

            drawSquare(context, x, y, squareWidth, getFillStyle(mastasks[i].color));

            x += squareWidth;
            if ((x + squareWidth) > context.canvas.width) {
                y += squareWidth + 5;
                x = 0;
            } else {
                x += 5; // add space
            }
        }
    }

    function drawSquare(context, x, y, size, fillStyle) {
        var height = size;
        var width = size;
        //console.log(x, y, width, height);
        context.fillStyle = fillStyle;
        context.fillRect(x, y, width, height);
    }

    function getFillStyle(taskTypeId) {
        switch (taskTypeId) {
            case 0:
                return "#ff006e";
                break;
            case 1:
                return "#00ff21";
                break;
            case 2:
                return "#ffd800";
                break;
            default:
                return "#000000";
                break;
        }
    }

    async.whilst(
        function () { return REFRESH }.bind(this),
        fetchState,
        function () { }
    );

});
