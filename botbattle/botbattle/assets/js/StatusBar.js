﻿var rows = [newRow('Turn', 'Standard Input', 'Standard Output', 'Standard Error')];

function addRow(turnNum, stdIn, stdOut, stdErr) {
    // Add a new row, mostly for testing purposes
    var cur = document.getElementById("tbl_status").innerHTML;
    document.getElementById("tbl_status").innerHTML = cur + newRow(turnNum, stdIn, stdOut, stdErr);
}

function newRow(turnNum, stdIn, stdOut, stdErr) {
    // Generate a row
    var row = "<tr>" +
        "<td class='turn_column'>#TURN#</td>" +
        "<td class='data_column'>#STDIN#</td>" +
        "<td class='data_column'>#STDOUT#</td>" +
        "<td class='data_column_red'>#STDERR#</td>" +
        "</tr>";
    row = row.replace("#TURN#", turnNum);
    row = row.replace("#STDIN#", stdIn);
    row = row.replace("#STDOUT#", stdOut);
    row = row.replace("#STDERR#", stdErr);
    return row;
}

function generateRows(gameInit,turns) {
    // Generate all rows for the match
    rows.push(generateRow(1,gameInit));
    for (var i = 0; i < turns.length; i++) {
        rows.push(generateRow(i+2, turns[i]));
    }
}

function generateRow(num, turn) {
    // Generate a single row
    var stdIn, stdOut, stdErr;
    if ('stdIn' in turn)
        stdIn = turn.stdIn;
    else
        stdIn = '';
    if ('stdOut' in turn)
        stdOut = turn.stdOut;
    else
        stdOut = '';
    if ('stdErr' in turn)
        stdErr = turn.stdErr;
    else
        stdErr = '';
    return newRow(num, stdIn, stdOut, stdErr);
}

function showRows(turnNum) {
    // Show all rows up to a specified turn
    var tbl = '';
    for (var i = 0; i < turnNum+2; i++)
        tbl += rows[i];
    document.getElementById("tbl_status").innerHTML = tbl;
}