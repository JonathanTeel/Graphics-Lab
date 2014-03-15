/*
 * Controls the Run and Walk features of the Watson Graphcis Lab
 */
//Assign all global variables
var step = 0;
var programRunning = false;
var fresh = true;
var loopArray = new Array();

//Allows users to run the program slowly
function run() {
    paintbrush++;
    walk();
    var delay = setInterval(function() {
        if (!programRunning) clearInterval(delay);
        else {
            walk();
        }
    }, 100);
    //Reset
    $("#" + walkButton.id).html("Reset").off("click").click(function() {
        clearInterval(delay);
        step = 0;
        returnToNormalColor()
        selectRow(codeTable.rows.length-1);
        $("#" + runButton.id).html("Run").off("click").click(function() { run(); });
        $(this).html("Walk").off("click").click(function() { walk(); });
        $(".button" + figNum).attr("disabled", false);
    });
    //Pause
    $("#" + runButton.id).html("Pause").off("click").click(function() {
        clearInterval(delay);
        $(this).html("Play").off("click").click(function() { run(); });
        $("#" + walkButton.id).html("Walk").off("click").click(function() { walk(); });
    });

}

//Allows users to walk through the program code one step at a time
function walk() {
	changeBtnState(true);
    paintbrush++;
    var oldPos = -1;
    if (!programRunning) {
        //check if selected row is before end of code
        if (selRow < codeTable.rows.length-1)
            codeTable.deleteRow(selRow);
        else {
        	moveToLine(0);
        	codeTable.deleteRow(selRow);
        }
    }
    programRunning = true;
    //Set some buttons to false while walking or running
   // $(".button" + figNum).attr("disabled", true);
    //Turn off toggle events for table cells
    $('.innerTable' + figNum).off('mouseover').off('mouseout').off('click');
    returnToNormalColor();
    //Don't allow step to go beyond program scope , check if current row is there
    if (step == codeTable.rows.length-1) {
        if(codeTable.rows[step] != undefined) selectRow(step);
        step = 0;
        toggleEvents();
        $("#" + runButton.id).html("Run").off("click").click(function() { run(); });
        $("#" + walkButton.id).html("Walk").off("click").click(function() { walk(); });
        $(".button" + figNum).attr("disabled", false);
        programRunning = false;
        fresh = true;
        changeBtnState(false);
        return;
    }
    selectRow(step);
    highlightLine(step);
    clear();
    draw();
    $("#drawCanvas" + figNum).trigger("mousemove");
    
    //Polygon found [ make sure its not erase(g1) ]
    if (rowToString(step).indexOf("g") >= 0 && rowToString(step).indexOf("draw") == -1 && rowToString(step).indexOf("e") != 0) {
    	var string = rowToString(step).trim();
    	step++;
    	while (!containsCommand(rowToString(step+1))) {
    		string += rowToString(step);
    		step++;
    	}
    	step++;
    	interpret(string);
    }
    //Loop found
    else if (rowToString(step).indexOf("repeat") >= 0 && rowToString(step).indexOf("COUNTER") == -1) {
    	var i = Number(rowToString(step).substring(rowToString(step).indexOf("repeat")+6, rowToString(step).indexOf("times")));
    	step += 2;
    	var loopStart = step;
    	loopArray[loopArray.length] = new makeLoop(loopStart, i);
    	
    }
    //found the end of a loop
    else if (rowToString(step).indexOf("endloop") >= 0) {
    	//Loop is not finished. Decrement i and return to loop start.
    	if (loopArray[loopArray.length-1].i > 1) {
    		loopArray[loopArray.length-1].i--;
    		step = loopArray[loopArray.length-1].loopStart;
    	}
    	//this loop is finished. Remove it from array and increment step
    	else {
    		step++;
    		loopArray.splice(loopArray.length-1, 1);
    	}
    }
    else {
    	interpret(rowToString(step));
	    step++;
    }
    $("#drawCanvas" + figNum).trigger("mousemove");
}

function containsCommand(input) {
	var found = false;
	found = found || input.indexOf("draw") != -1;
	found = found || input.indexOf("erase") != -1;
	found = found || input.indexOf("=") != -1;
	found = found || input.indexOf("color") != -1;
	found = found || input.indexOf("loop") != -1;
	found = found || input.indexOf("repeat") != -1;
	found = found || input.indexOf("endloop") != -1;
	return found;
}

//returns the indent of the loop.
function makeLoop(loopStart, i) {
	this.loopStart = loopStart;
	this.i = i;
}

//return string with correct number of indents
function getIndent(row) {
	var loop = 0;
	for (var i = 0; i < row; i++) {
		if (rowToString(i).indexOf("loop") >= 0 && rowToString(i).indexOf("endloop") == -1) loop++;
		if (rowToString(i).indexOf("endloop") >= 0) loop--;
	}
	var string = "";
	for (var i = 0; i < loop; i++) {
		string += indent;
	}
	return string;
}

// disable / enable buttons for run walk
function changeBtnState(state){
	document.getElementById("distanceButton" + figNum).disabled = state;
	document.getElementById("pointButton" + figNum).disabled = state;
	document.getElementById("lineButton" + figNum).disabled = state;
	document.getElementById("polygonButton" + figNum).disabled = state;
	document.getElementById("circleButton" + figNum).disabled = state;
	document.getElementById("assignButton" + figNum).disabled = state;
	document.getElementById("drawButton" + figNum).disabled = state;
	document.getElementById("eraseButton" + figNum).disabled = state;
	document.getElementById("colorButton" + figNum).disabled = state;
	document.getElementById("loopButton" + figNum).disabled = state;
	document.getElementById("editor" + figNum).disabled = state;
}








