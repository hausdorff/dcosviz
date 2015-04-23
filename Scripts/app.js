MESOS_MASTER = "http://srv6.hw.ca1.mesosphere.com:5050/"

REFRESH = true;
INTERVAL = 2000;

$().ready(function () {

    $(window).resize(function () {
        renderBlocks();
    });

    var SIMULATE_BASETASK = 0;

    var url = MESOS_MASTER + "state.json"

    var STATE = [];

    var fetchState = function (cb) {
        $.getJSON(url + "?jsonp=?", function (data) {
            var tasks = _.map(data.frameworks, function (fw) {
                return {
                    "name": fw.name.split("-")[0],
                    "task_count": fw.tasks ? fw.tasks.length : 0
                };
            });

            STATE.shift();

            if (SIMULATE_BASETASK > 0) {
                if (tasks.length == 3) {
                    tasks[0].task_count += SIMULATE_BASETASK;
                } else if (tasks.length == 2) {
                    tasks.push({ "name": "simulated", "task_count": SIMULATE_BASETASK });
                } else if (tasks.length == 1) {
                    var countA = Math.floor(SIMULATE_BASETASK / 2);
                    tasks.push({ "name": "simulated 1", "task_count": countA });
                    tasks.push({ "name": "simulated 2", "task_count": SIMULATE_BASETASK - countA });
                } else {
                    var countA = Math.floor(SIMULATE_BASETASK / 3);
                    tasks.push({ "name": "simulated 1", "task_count": countA });
                    tasks.push({ "name": "simulated 2", "task_count": countA });
                    tasks.push({ "name": "simulated 3", "task_count": SIMULATE_BASETASK - countA });
                }
            }
            STATE.push(tasks);

            renderBlocks();

            _.delay(cb, INTERVAL);
        }.bind(this));
    };

    $("#set_basetask").on('click', function () {
        var nin = prompt("How many tasks?", "1");
        var n = new Number(nin);
        if (n != NaN && n > 0) {
            SIMULATE_BASETASK = n;
        } else {
            SIMULATE_BASETASK = 0;
        }
    });

    function renderBlocks() {
        var stateTasks = STATE[0];
        var totalTasks = _.reduce(stateTasks, function (m, v) {
            return m + v.task_count;
        }, 0);

        $(".total-tasks :first-child").html(totalTasks);
        _.each(stateTasks, function (v, i) {
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
        console.log("area: ", area, "cols", cols, "rows", rows, "size", squareWidth, "canvas:width", context.canvas.width, "canvas:height", context.canvas.height);
        var x = 0;
        var y = 0;
        for (var i = 0; i < totalTasks; i++) {
            idx = Math.floor((Math.random() * totalTasks) + 1);
            if (idx <= stateTasks[0].task_count) {
                drawSquare(context, x, y, squareWidth, getFillStyle(1));
            } else if (idx <= (stateTasks[0].task_count + stateTasks[1].task_count)) {
                drawSquare(context, x, y, squareWidth, getFillStyle(2));
            } else {
                drawSquare(context, x, y, squareWidth, getFillStyle(3));
            }

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
        console.log(x, y, width, height);
        context.fillStyle = fillStyle;
        context.fillRect(x, y, width, height);
    }

    function getFillStyle(taskTypeId) {
        switch (taskTypeId) {
            case 1:
                return "#ff006e";
                break;
            case 2:
                return "#00ff21";
                break;
            case 3:
                return "#ffd800";
                break;
            default:
                return "#000000";
                break;
        }
    }

    function createSample(n) {
        for (var i = 0; i < n; i++) {
            tasks.push({ "typeId": Math.floor((Math.random() * 3) + 1) });
        }
    }

    async.whilst(
        function () { return REFRESH }.bind(this),
        fetchState,
        function () { }
    );

    renderBlocks();

});
