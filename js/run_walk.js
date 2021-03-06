/*
 * Controls the Run and Walk features of the Watson Graphcis Lab
 * Author: James Miltenberger
 * Co-Authors: Mitchell Martin, Jonathan Teel
 */
//Assign all global variables
var step = 0;
var programRunning = false;
var runMode = false;
var fresh = true;
var loopArray = new Array();

//Allows users to run the program slowly
function run() {
	runMode = true;
    paintbrush++;
    walk();
    var delay = setInterval(function() {
        if (!programRunning) {
			runMode = false;
			clearInterval(delay);
		}
        else {
			runMode = true;
            walk();
        }
    }, 100);
    //Reset
    $("#" + walkButton.id).html("Reset").off("click").click(function() {
		fresh = true;
        clearInterval(delay);
        step = 0;
        returnToNormalColor()
        selectRow(codeTable.rows.length-1);
        $("#" + runButton.id).html("Run").off("click").click(function() { 
			run(); 
		});
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
    $(".button" + figNum).attr("disabled", true);
    //Turn off toggle events for table cells
    $('.innerTable' + figNum).off('mouseover').off('mouseout').off('click');
    returnToNormalColor();
    //Don't allow step to go beyond program scope
    if (step == codeTable.rows.length-1) {
        selectRow(step);
        step = 0;
        toggleEvents();
        $("#" + runButton.id).html("Run").off("click").click(function() { run(); });
        $("#" + walkButton.id).html("Walk").off("click").click(function() { walk(); });
        $(".button" + figNum).attr("disabled", false);
        $("#vvDivHolder").slideUp("medium"); // Teel's code <--
        programRunning = false;
        fresh = true;
        return;
    }
    selectRow(step);
    highlightLine(step);
    clear();
    draw();
    $("#drawCanvas" + figNum).trigger("mousemove");
    
    //Polygon found
    if (rowToString(step).indexOf("g") >= 0 && rowToString(step).indexOf("draw") == -1 && rowToString(step).indexOf("color") == -1) {
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
    refreshLineNumbers();
    updateVarValueWindow(); //Teel's code <--
    runMode = false;
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

//return string with correct number of indents.
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

//Updates the variables in the variables tracker. Author: Jonathan Teel
function updateVarValueWindow(){
	
	var vvDiv = document.getElementById("varValDiv" + figNum);
	var html = '<table id="varValueTable" style="border-spacing:15px 1px"><tbody><tr><td>level&#09</td><td>variable\t</td><td>type	</td><td>value</td></tr>';
	var i, canShow = 0;
	
	for(i = 0; i < d.length; i++)
	{
		html += '<tr><td>0</td><td>d' + (i+1) + '</td><td>distance</td><td>' + d[i] + '</td></tr>';
		canShow++;
	}
	for(i = 0; i < p.length; i++)
	{
		if(p[i].type != undefined)
		{
			html += '<tr><td>0</td><td>p' + (i+1) + '</td><td>' + p[i].type + '</td><td>( ' + p[i].startX + ', ' + Math.abs(p[i].startY-300) + ' )</td></tr>';
			canShow++;
		}
	}
	for(i = 0; i < l.length; i++)
	{
		if(l[i].type != undefined)
		{
			html += '<tr><td>0</td><td>l' + (i+1) + '</td><td>' + l[i].type + '</td><td>' + '( ( ' + l[i].startX + ', ' + Math.abs(l[i].startY-300) + ' ) ( ' + l[i].endX + ', ' + Math.abs(l[i].endY-300) + ' ) )' +'</td></tr>';
			canShow++;
		}
	}
	for(i = 0; i < g.length; i++)
	{
		if(g[i].type != undefined)
		{
			html += '<tr><td>0</td><td>g' + (i+1) + '</td><td>' + g[i].type + '</td>';
			html += '<td>';
			for(var j=0; j<g[i].angles.length; j++)
			{
				html += ((j==0)?'( ( ':'( ') + g[i].angles[j].startX + ', ' + Math.abs(g[i].angles[j].startY-300) + ' ) ';
				if(j != g[i].angles.length -1)
					html += ', ';
				else
					html += ' ( ' + g[i].angles[0].startX + '. ' + Math.abs(g[i].angles[0].startY-300) + ' ) ) ';
			}
			html += '</td></tr>';
			canShow++;
		}
	}
	for(i = 0; i < c.length; i++)
	{
		if(c[i].type != undefined && c[i].startX != 0 && c[i].startY != 0) 
		{
			canShow++;
			html += '<tr><td>0</td><td>c' + (i+1) + '</td><td>' + c[i].type + '</td><td>' + '( ( ' + c[i].startX + ', ' + Math.abs(c[i].startY-300) + ' ) ' + c[i].diameter + ' )</td></tr>';
		}
	}
	if(canShow > 0 && !runMode)
	{
		vvDiv.innerHTML = html;
		$("#vvDivHolder").slideDown("medium");
	}
	else
		$("#vvDivHolder").slideUp("medium");
}









