var stats = {
    type: "GROUP",
name: "Global Information",
path: "",
pathFormatted: "group_missing-name-b06d1",
stats: {
    "name": "Global Information",
    "numberOfRequests": {
        "total": "200",
        "ok": "200",
        "ko": "0"
    },
    "minResponseTime": {
        "total": "787",
        "ok": "787",
        "ko": "-"
    },
    "maxResponseTime": {
        "total": "2843",
        "ok": "2843",
        "ko": "-"
    },
    "meanResponseTime": {
        "total": "1095",
        "ok": "1095",
        "ko": "-"
    },
    "standardDeviation": {
        "total": "539",
        "ok": "539",
        "ko": "-"
    },
    "percentiles1": {
        "total": "798",
        "ok": "798",
        "ko": "-"
    },
    "percentiles2": {
        "total": "1261",
        "ok": "1261",
        "ko": "-"
    },
    "percentiles3": {
        "total": "2426",
        "ok": "2426",
        "ko": "-"
    },
    "percentiles4": {
        "total": "2767",
        "ok": "2767",
        "ko": "-"
    },
    "group1": {
    "name": "t < 800 ms",
    "count": 114,
    "percentage": 57
},
    "group2": {
    "name": "800 ms < t < 1200 ms",
    "count": 33,
    "percentage": 17
},
    "group3": {
    "name": "t > 1200 ms",
    "count": 53,
    "percentage": 27
},
    "group4": {
    "name": "failed",
    "count": 0,
    "percentage": 0
},
    "meanNumberOfRequestsPerSecond": {
        "total": "18.182",
        "ok": "18.182",
        "ko": "-"
    }
},
contents: {
"req_reactor-14106": {
        type: "REQUEST",
        name: "reactor",
path: "reactor",
pathFormatted: "req_reactor-14106",
stats: {
    "name": "reactor",
    "numberOfRequests": {
        "total": "200",
        "ok": "200",
        "ko": "0"
    },
    "minResponseTime": {
        "total": "787",
        "ok": "787",
        "ko": "-"
    },
    "maxResponseTime": {
        "total": "2843",
        "ok": "2843",
        "ko": "-"
    },
    "meanResponseTime": {
        "total": "1095",
        "ok": "1095",
        "ko": "-"
    },
    "standardDeviation": {
        "total": "539",
        "ok": "539",
        "ko": "-"
    },
    "percentiles1": {
        "total": "798",
        "ok": "798",
        "ko": "-"
    },
    "percentiles2": {
        "total": "1261",
        "ok": "1261",
        "ko": "-"
    },
    "percentiles3": {
        "total": "2426",
        "ok": "2426",
        "ko": "-"
    },
    "percentiles4": {
        "total": "2767",
        "ok": "2767",
        "ko": "-"
    },
    "group1": {
    "name": "t < 800 ms",
    "count": 114,
    "percentage": 57
},
    "group2": {
    "name": "800 ms < t < 1200 ms",
    "count": 33,
    "percentage": 17
},
    "group3": {
    "name": "t > 1200 ms",
    "count": 53,
    "percentage": 27
},
    "group4": {
    "name": "failed",
    "count": 0,
    "percentage": 0
},
    "meanNumberOfRequestsPerSecond": {
        "total": "18.182",
        "ok": "18.182",
        "ko": "-"
    }
}
    }
}

}

function fillStats(stat){
    $("#numberOfRequests").append(stat.numberOfRequests.total);
    $("#numberOfRequestsOK").append(stat.numberOfRequests.ok);
    $("#numberOfRequestsKO").append(stat.numberOfRequests.ko);

    $("#minResponseTime").append(stat.minResponseTime.total);
    $("#minResponseTimeOK").append(stat.minResponseTime.ok);
    $("#minResponseTimeKO").append(stat.minResponseTime.ko);

    $("#maxResponseTime").append(stat.maxResponseTime.total);
    $("#maxResponseTimeOK").append(stat.maxResponseTime.ok);
    $("#maxResponseTimeKO").append(stat.maxResponseTime.ko);

    $("#meanResponseTime").append(stat.meanResponseTime.total);
    $("#meanResponseTimeOK").append(stat.meanResponseTime.ok);
    $("#meanResponseTimeKO").append(stat.meanResponseTime.ko);

    $("#standardDeviation").append(stat.standardDeviation.total);
    $("#standardDeviationOK").append(stat.standardDeviation.ok);
    $("#standardDeviationKO").append(stat.standardDeviation.ko);

    $("#percentiles1").append(stat.percentiles1.total);
    $("#percentiles1OK").append(stat.percentiles1.ok);
    $("#percentiles1KO").append(stat.percentiles1.ko);

    $("#percentiles2").append(stat.percentiles2.total);
    $("#percentiles2OK").append(stat.percentiles2.ok);
    $("#percentiles2KO").append(stat.percentiles2.ko);

    $("#percentiles3").append(stat.percentiles3.total);
    $("#percentiles3OK").append(stat.percentiles3.ok);
    $("#percentiles3KO").append(stat.percentiles3.ko);

    $("#percentiles4").append(stat.percentiles4.total);
    $("#percentiles4OK").append(stat.percentiles4.ok);
    $("#percentiles4KO").append(stat.percentiles4.ko);

    $("#meanNumberOfRequestsPerSecond").append(stat.meanNumberOfRequestsPerSecond.total);
    $("#meanNumberOfRequestsPerSecondOK").append(stat.meanNumberOfRequestsPerSecond.ok);
    $("#meanNumberOfRequestsPerSecondKO").append(stat.meanNumberOfRequestsPerSecond.ko);
}
