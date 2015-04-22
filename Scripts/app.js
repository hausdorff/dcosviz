//MESOS_MASTER = "http://srv6.hw.ca1.mesosphere.com:5050/"
//MESOS_MASTER = "http://master0-swartz3.westus.cloudapp.azure.com:5050/";
MESOS_MASTER = "http://master0-build15dcos.southeastasia.cloudapp.azure.com:5050/";

REFRESH = true;
INTERVAL = 2000;

$().ready(function () {

    $(window).resize(function () {
        renderBlocks();
    });

    // 1 = marathon
    // 2 = spark
    // 3 = cassandra
    var taskTotals = { marathon: 0, spark: 0, cassandra: 0 };
    var tasks = [];
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
            STATE.push(tasks);

            renderBlocks2();

            _.delay(cb, INTERVAL);
        }.bind(this));
    };

    $("#set_basetask").on('click', function () {
        var nin = prompt("How many tasks?", "1");
        var n = new Number(nin);
        if (n != NaN && n > 0) {
            SIMULATE_BASETASK = n;
        }
    });
    $("#add_task").on('click', function () {
        if (event.shiftKey === true) {
            var nin = prompt("How many tasks?", "1");
            var n = new Number(nin);
            if (n != NaN && n > 0) {
                createSample(n - 1)
            }
        }
        addRandomTask();
    });
    $("#remove_task").on('click', function () {
        removeRandomTask();
    });

    function getTotalTasks() {
        return tasks.length;
    }

    function calcTasksTotals() {
        taskTotals.marathon = 0;
        taskTotals.spark = 0;
        taskTotals.cassandra = 0;
        for (var i = tasks.length; --i >= 0;) {
            if (tasks[i] === null) continue;
            switch (tasks[i].typeId) {
                case 1:
                    taskTotals.marathon += 1;
                    break;
                case 2:
                    taskTotals.spark += 1;
                    break;
                case 3:
                    taskTotals.cassandra += 1;
                    break;
                default:
                    //do nothing
            }
        }
    }

    function addRandomTask() {
        var idx = Math.floor((Math.random() * 3) + 1);
        switch (idx) {
            case 1:
                tasks.push({ "typeId": 1 });
                break;
            case 2:
                tasks.push({ "typeId": 2 });
                break;
            default:
                tasks.push({ "typeId": 3 });
                break;
        }
        renderBlocks();
    }

    function removeRandomTask() {
        var idx2 = Math.floor((Math.random() * tasks.length) + 1);
        if (idx2 <= tasks.length)
            tasks.splice(idx2 - 1, 1);
        renderBlocks();
    }

    function renderBlocks() {

        calcTasksTotals();

        $(".total-tasks :first-child").html(getTotalTasks);
        $(".marathon-tasks :first-child").html(taskTotals.marathon);
        $(".spark-tasks :first-child").html(taskTotals.spark);
        $(".cassandra-tasks :first-child").html(taskTotals.cassandra);

        var canvas = $("#canvas1");
        var context = canvas[0].getContext("2d");
        context.canvas.height = canvas.height();
        context.canvas.width = canvas.height();
        context.clearRect(0, 0, canvas.width(), canvas.height());

        // determine size of square
        var area = context.canvas.width * context.canvas.height;
        var cols = Math.ceil(Math.sqrt(tasks.length));
        var rows = Math.ceil(tasks.length / cols);
        var squareWidth = Math.floor(context.canvas.width / cols) - 5; // 5 is border
        console.log("area: ", area, "cols", cols, "rows", rows, "size", squareWidth, "canvas:width", context.canvas.width, "canvas:height", context.canvas.height);
        var x = 0;
        var y = 0;
        for (var i = 0; i < tasks.length; i++) {

            drawSquare(context, x, y, squareWidth, getFillStyle(tasks[i].typeId));

            x += squareWidth;
            if ((x + squareWidth) > context.canvas.width) {
                y += squareWidth + 5;
                x = 0;
            } else {
                x += 5; // add space
            }
        }
    }

    function renderBlocks2() {
        var stateTasks = STATE[0];
        var totalTasks = _.reduce(stateTasks, function (m, v) {
            return m + v.task_count;
        }, 0);

        $(".total-tasks :first-child").html(totalTasks);
        _.each(stateTasks, function (v, i) {
            $(".slot" + i + " :first-child").html(v.task_count);
            $(".slot" + i + " :last-child").html(v.name);
            $(".slot" + i).show();
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

    //createSample();
    renderBlocks();

    window.foo = addRandomTask;
});
