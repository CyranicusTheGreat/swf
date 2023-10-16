var path = "https://typesample.com/assets/";  // OR change this path where this javascript file lives

//Type Sample code by Justin Van Slembrouck 2013-2021

window.typeSampleTracking = false;

if (!window.hasOwnProperty('typesampleqwerty')) {

	init();

    // Set the flag so this won't run again
    window.typesampleqwerty = true;

  } else {

  	if (window.typeSamplePanelOpen == true){
  		closePanel();
  	}

  	initPartTwo();
}

function init() {

	fontInfoGlobal = new Object();
	fontStyleGlobal = new Object();

	window.possibleFontNames = new Array();
	window.typeSamplePanelOpen = false;

	var d = document;
	var e = d.createElement('script');

	d.body.appendChild(e);

	e.setAttribute('type','text/javascript');
	e.setAttribute('src','https://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js');

	e.onload = initPartTwo;
}

function initPartTwo(){
	if (window.hasOwnProperty('typesample_params')) {

		var decoded_params = unescape(decodeURI(typesample_params));
		var font_vars = decoded_params.split("+");
		console.log("font_vars: " + font_vars);

		fontInfo = new Object();
	    fontStyle = new Object();

	    //fontInfo.serviceDisplayName   = font_vars[0];
	    // fontInfo.serviceAPI           = font_vars[1];
	    //fontInfo.serviceLink          = font_vars[1];
	    fontInfo.fontDisplayName      = font_vars[2];
	    fontInfo.fontLink             = font_vars[3];

	    fontStyle.fontfamily          = font_vars[4];
	    fontStyle.fontweight          = font_vars[5];
	    fontStyle.fontstyle           = font_vars[6];
	    fontStyle.fontsize            = font_vars[7];

      	loadCSS();

		displaytypesample(fontInfo, fontStyle);

		fontInfoGlobal = fontInfo; //this doesn't feel elegant
		fontStyleGlobal = fontStyle; //Again, this doesn't feel elegant

		moveCursor();

 	 	initImageSave();

	} else {
		displayloadingMessage();

		window.tsinitialized;

		checkForTypekit(); //put this here so there time to get a response from Typekit before user clicks something

	    loadCSS();

		$.getScript("https://cdn.jsdelivr.net/gh/CyranicusTheGreat/swf@latest/type.js", function() {});

		initPartThree();
    }
}

function initPartThree(){
	document.getElementById("temp").style.display = "block";
	document.getElementById('temp').innerHTML = "Go click some text.";
	main();

	// *** start tracking
	var urchinCode = "UA-46280994-2";
	var domain = window.location.host;
	var url =  window.location.pathname;
	var gaEvent = "&utme=5(" + "bookmarklet_open" + "*" + domain + url + ")";

	if (window.typeSampleTracking == true){
		gaTrack(urchinCode, domain, url, gaEvent);
	}
	// *** end tracking
}

function linkedSheets(api){
	for (var i=0; i<document.styleSheets.length; i++) {

		var h = document.styleSheets[i].href;

		if (h) {

		  if (h.indexOf("css") > -1) {
			// console.log("document.styleSheets[i].href: " + h);

		  	if (h.indexOf(api) > -1) {
				//console.log(api + " FOUND");
				return true;
		  	}

		 	// Returns: [Error] XMLHttpRequest cannot load... not allowed by Access-Control-Allow-Origin.
		 	//    var content;
			// $.get(h, function(data) {
			//     content = data;
			//     console.log(content);
			// });
		  }
		}
	}

	return false;

}

function displayloadingMessage() {

	//add a style for the temp loading message
	var css = "#temp { position:absolute !important; margin:0; min-width:115px; z-index:9999999998;"
	+ "background:#fff; background-color:rgba(255,255,255,.99);	text-align:left; width:auto; box-shadow: 0px 8px 15px 0px rgba(0,0,0,.16), 0px 0px 1px 0px rgba(0,0,0,.66);"
	+ "font-family: 'Courier New', 'Courier', monospace; font-size:14px; -webkit-font-smoothing:antialiased; line-height:20px; color:#111; left:0px; top:0px; padding:16px 18px 16px 18px; white-space: nowrap;}"
	+ "#temp b{font-family: 'Courier New', 'Courier', monospace; font-weight:bold !important;}"
	+ "#temp br{display: block;}";
    head = document.getElementsByTagName('head')[0];
    style = document.createElement('style');

	style.type = 'text/css';
	if (style.styleSheet){
	  style.styleSheet.cssText = css;
	} else {
	  style.appendChild(document.createTextNode(css));
	}

	head.appendChild(style);

	//Create and append "Loading" div to page
	var newDiv = document.createElement("div");
	var newContent = document.createTextNode("Loading...");
	newDiv.id = "temp";

	newDiv.appendChild(newContent); //add the text node to the newly created div.

  	document.body.appendChild(newDiv);
}

// function addChartbeat(){
// 	var iframe = document.createElement('iframe');
// 	iframe.style.display = "none";
// 	iframe.style.height = "0";
// 	iframe.style.width = "0";
// 	iframe.src = "//www.typesample.com/about";
// 	document.body.appendChild(iframe);
// }


function loadCSS(){
	var c =  "https://cdn.jsdelivr.net/gh/CyranicusTheGreat/swf@latest/type.css?r="+Math.random()*99999999;

	//Insert the stylesheet
	if (c) {
		csslink = $("<link>").attr({
			'rel': 'stylesheet',
			'href': c
		}).appendTo("head");
	}
}


//need to remember sites used this
function isThereAnImportedStylesheet(sheet, api){

	if (sheet.length > 0){  //changed from (sheet.cssRules != null) because of firefox

		for (var i =0; i < rules.length; i++) {

			var txt = rules[i].cssText;

			if(txt.indexOf(api) > -1) {
				return true;
			}
		}
	}

	return false;
}


function lookForFontFace(sheet, api){

	if (sheet.href){

		if(sheet.href.indexOf(api) > -1) {
			return true;
		}
	}

	// Haven't seen any cases where this was necessary??? Remove?
	if (sheet.length > 0){

		if (sheet.cssRules[0]){

			var txt = sheet.cssRules[0].cssText;

			if(txt.indexOf(api) > -1) {

				return true;

			} else {

				return false;
			}
		}

	} else {
		return false;
	}
}

function findKitId(){

	// This looks for Typekit Kit ID
	// From here https://github.com/typekit/typekit-api-examples/blob/master/bookmarklet/bookmarklet.js

    var kitId = null;

    // I added this bit -->

    var exists = (typeof window["Typekit.config"] !== "undefined");

    if (exists){
	    var w = window.Typekit.config.w;

	    if (w){
			kitId = w;
	    	return kitId;
	    }
	}

    // <-- to here

    $('script').each(function(index){
      var m = this.src.match(/use\.typekit\.(com|net)\/(.+)\.js/);

      if (m) {
        kitId = m[2];
        return false
      }
    });

    return kitId;
}


function checkForTypekit(){

    var kitId = findKitId();
    if(kitId){

      $.getJSON("https://typekit.com/api/v1/json/kits/" + kitId + "/published?callback=?", function(data){

        if(data.errors) {
          //console.log("Error: Could not get Typekit data");
        } else {

          var box = $("<div><p>Typekit fonts used on this page:</p></div>")

          $.each(data.kit.families, function(i,family){
            var css = "font-family:" + family.css_names.join(',') + ";";
            var item = $('<div><h2><a href="http://typekit.com/fonts/' + family.slug + '">' + family.name + '</a></h2><p class="sample" style="' + css + '">AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRr</p></div>');
            item.appendTo(box);

		  	var fontNames = new Array();
            fontNames[0] = family.css_names;
            fontNames[1] = family.name;
            fontNames[2] = 'http://typekit.com/fonts/' + family.slug; //this is a link to the kit.
            possibleFontNames.push(fontNames);

          });

          //display(box);
        }

      });

	return true;

    } else {
      return false;
    }
  }



function getFontInfo(font){

	var fontInfo;

	//console.log("");



	fontInfo = getBasicFontInfo(font);

	fontInfo.serviceDisplayName =  " ";
	fontInfo.serviceAPI =  "none";
	fontInfo.serviceLink = "none";

	return(fontInfo);
}




function isThisBasicFont(font){

	font = font.replace(/'/g, "");
	font = font.replace(/"/g, "");
	var lowercase = font.toLowerCase();

	for (var i =0; i < basicFontNames.length; i++) {

		var n = basicFontNames[i].toLowerCase();

		if (lowercase == n){ 			//Congrats, it's a basic font

			return basicFontNames[i]; //return the basic font name
		}
	}

	return false; //Not a basic font
}


function getBasicFontInfo(font){
	font = font.replace(/'/g, "");
	font = font.replace(/"/g, "");
	var basicFont = isThisBasicFont(font);

	if (basicFont != false){


		return {
			fontDisplayName: basicFont,
		    fontLink: "http://en.wikipedia.org/wiki/Core_fonts_for_the_Web"
		};

	} else { //could be a font from a service that's not supported (yet)

		//setNoFontServiceUsed();

		return {
			fontDisplayName: font,
		    fontLink: "none"
		};
	}

}



// var whitelist = new Array();
// whitelist = [
// 	"futura",
// 	"apercu",
// 	"proxima nova",
// 	"caslon",
// 	"courier new",
// 	"domaine text",
// 	Dia
// ];




// Basic fonts
//Eventually need platform specific checks
var basicFontNames = new Array();
basicFontNames = [
	"serif",
	"sans-serif",
	"monospace",
	"Andale Mono",
	"Arial",
	"Arial Black",
	"Baskerville",
	"Big Caslon",
	"Brush Script",
	"Cochin",
	"Comic Sans",
	"Courier",
	"Courier New",
	"Copperplate",
	"Geneva",
	"Georgia",
	"Helvetica",
	"Helvetica Neue",
	"Impact",
	"Lucida",
	"Lucida Grande",
	"Monaco",
	"monospace",
	"MS Sans Serif",
	"MS Serif",
	"Papyrus",
	"Symbol",
	"Tahoma",
	"Times",
	"Times New Roman",
	"Trebuchet",
	"Palatino",
	"Verdana",
	"Zapf Dingbats"
];



// Try looking at height too
// Seems like faux bold only widens characters?
// http://www.rgraph.net/blog/2013/january/measuring-text-height-with-html5-canvas.html

function getMeasurement(fontName) {
    // creating our in-memory Canvas element where the magic happens
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    // the text whose final pixel size I want to measure
    //var text = "abcdefghijklmnopqrstuvwxyz0123456789";
     var text = "+++++++++++++++"; //trying to find a character whose width does not change not matter the weight

    // specifying the baseline font
    context.font = "720px " + fontName;

    // checking the size of the baseline text
    var baselineSize = context.measureText(text).width;

    // specifying the font whose existence we want to check
    context.font = "bold 720px " + fontName;

    // checking the size of the font we want to check
    var newSize = context.measureText(text).width;

    // removing the Canvas element we created
    delete canvas;

	// If greater than 1, then  bold is not available
    // Consider edge case of display ultra-bold fonts like: acropolis/webfonts/
    var result = fontName + ": " + (newSize/baselineSize);
    return result;

}

// function measureAllFonts(fontfamily){
// 	var f = splitFonts(fontfamily);

// 	var measurements = new Array();

// 	for (var i =0; i < f.length; i++) {

// 		var font = f[i];

// 		var m = getMeasurement(font);

// 		measurements[i] = m;
// 		//console.log(font + " - measurement:" + m);

// 	};
// }

function doesFontExist(fontName,fontstyle,fallback) {

    // creating our in-memory Canvas element where the magic happens
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    // the text whose final pixel size I want to measure
    var text = "abcdefghijklmnopqrstuvwxyz0123456789";

  	//Gotta pass in the style otherwise it doesn't work for italic webfonts, etc.

    // specifying the baseline font
    context.font = fontstyle + " 72px " + fallback;

    // checking the size of the baseline text
    var baselineSize = context.measureText(text).width;

    // specifying the font whose existence we want to check
    // context.font = fontstyle + " 72px '" + fontName + "', monospace";  // I removed the single quotes. If this doesn't work, alt approach is to strip quotes and add back in
    context.font = fontstyle + " 72px " + fontName + ", " + fallback;


    // checking the size of the font we want to check
    var newSize = context.measureText(text).width;


    // removing the Canvas element we created
    delete canvas;

    // console.log(" ");
    // console.log("*** doesFontExist *** ");
    // console.log("baselineSize: " + baselineSize);
    // console.log("newSize: " + newSize);

    // If the size of the two text instances is the same, the font does not exist because it is being rendered
    // using the default sans-serif font
    //
    if (newSize == baselineSize) {
        return false;
        // var tryagain = doesFontExist2(fontName,fontstyle);
        // return tryagain;
    } else {
        return true;
    }
}


function whatFontUsed(fontfamily,fontstyle) {
	var f = splitFonts(fontfamily);

	for (var i =0; i < f.length; i++) {
		//checkIfFontExists(f[i]);

		var font = f[i];

		var result = doesFontExist(font,fontstyle,"serif");

		//console.log("doesFontExist: " + font + " - " + result );

		if (result == true) {
			//return the first font that is in use
			return font;

		}  else if 	(result == false) {

			//try again with a monospace fallback
			var result2 = doesFontExist(font,fontstyle,"monospace");

			if (result2 == true) {
				return font;
			}
		}
	};

	//if all else fails, return entire font family
	return fontfamily;
}

function splitFonts(fontfamily){
	var n=fontfamily.split(",");

	//return array of all fonts in font-family
	return(n);
}

//Edit panel functionality
function closePanel(){
	$('*').off('mouseover');
	$('*').off('click');
	$('*').off('mousemove');

	function complete() {
	    $( this ).remove();
	  }

	$("#temp").fadeOut(200, complete);
	$("#typesample").fadeOut(200, complete);

	$("*").removeClass("selectHighlight");
	$("*").removeClass("hoverHighlight");

	window.typeSamplePanelOpen = false;
}

function styletypesampletext(family, weight, style){
	var elem = document.getElementById("typesampletext");
	elem.setAttribute("style","font-family:" + family + "; font-weight:" + weight + "; font-style:" + style + "; min-height: 80px");
}

function changeFontWeight(){
	var fontSizeList=document.getElementById("fontWeightList");
	var newWeight = fontWeightList.options[fontWeightList.selectedIndex].text;

	var e = document.getElementById("typesampletext")
	e.style.fontWeight = newWeight;

	//Return focus to text selection. Otherwise we're stuck on dropdown.
	e.focus();
}

function changeFontSize(){
	var fontSizeList=document.getElementById("fontSizeList");
	var newSize = fontSizeList.options[fontSizeList.selectedIndex].text;

	var e = document.getElementById("typesampletext")
	e.style.fontSize = newSize + "px";


	if (fontSizeList.length > 6) {
	     fontSizeList.remove(0);

	    var element = document.getElementById("listdivider");
		element.parentNode.removeChild(element);
	}

	var input = document.getElementById("typesampleslider");
	input.value = newSize;

	//Return focus to text selection. Otherwise we're stuck on dropdown.
	e.focus();
}

function fontSizeIncrement(byAmount){

	//IF Shift is pressed, increment by 10's
	if (keyPressed[16] == true) {
		byAmount = byAmount*10;
	}

	var f = $(typesampletext).css("font-size");
	f = f.substring(0, f.length - 2);
	num = parseFloat(f) + parseFloat(byAmount);

	if (num < 8){
		num = 8;
	} else if (num > 999){
		num = 999;
	}

	newSize = num + "px";

	var e = document.getElementById("typesampletext")
	e.style.fontSize = newSize;

	var input = document.getElementById("typesampleslider");
	input.value = num;

	displayFontSize(newSize);
}

function updateRange(val){
	var num = val;

	newSize = num + "px";

	var e = document.getElementById("typesampletext")
	e.style.fontSize = newSize;

	displayFontSize(newSize);
}


function displayFontSize(newSize){
	document.getElementById('fontSizeOutput').innerHTML = " " + newSize;
	fontSize = newSize;
}





var keyPressed = new Array();

function main(){

	$( "*" ).keyup(function( event ) {
	    keyPressed[event.keyCode] = false;

		var ele = document.getElementById('typesampletext')

	    if (ele.textContent.length > 0 && ele.innerHTML != window.defaultTypeSampleText){	//if cursor is at the beginning and the text is the default text...
		   	//$("#convertpngbtn").removeClass("primarybtn_inactive").addClass("primarybtn");

	   	} else {
		   	//$("#convertpngbtn").removeClass("primarybtn").addClass("primarybtn_inactive");
	   	}

	    event.stopPropagation();
	});

	//prevent stupid keyboard shortcuts when focused on entering text
	$( "*" ).keydown(function( event ) {



		keyPressed[event.keyCode] = true;

		var key1 = 65;	// A
		var key2 = 91;	// Command key on Safari and Chrome
		var key3 = 224;	// Command key on Firefox

		// if user is trying to select all with Command + A
		// scratch that... don't do anything if they're pressing the command key
	    if (keyPressed[key2] == true || keyPressed[key3] == true) {
	    	event.stopPropagation();
	    	return;
	    }

	    if (event.keyCode == 27) {  //if esc key is pressed
	    	closePanel();
	    	event.stopPropagation();
	    }

		var ele = document.getElementById('typesampletext')
		var position = window.getSelection().getRangeAt(0).startOffset;

	   if (document.activeElement == ele){			//if typesampletext is in focus

	   		if (position == 0 && ele.innerHTML == window.defaultTypeSampleText){	//if cursor is at the beginning and the text is the default text...
			   		if (
			   				(event.keyCode >= 48 && event.keyCode <= 90)
			   			||	(event.keyCode >= 96 && event.keyCode <= 111)
			   			||	(event.keyCode >= 186 && event.keyCode <= 222)
			   			){
				   		ele.innerHTML="";
			   		}
		   	}

			event.stopPropagation();
	   }

	});

	// Tooltip stuff

	var xMousePos = 0;
	var yMousePos = 0;
	var lastScrolledLeft = 0;
	var lastScrolledTop = 0;

	//this variable here so tooltip doesn't appear until a mouseover event occurs
	var tooltipMove = 0;

	$(document).on('mousemove', function(e){

		if (tooltipMove == 1){

		    xMousePos = e.pageX;
		    yMousePos = e.pageY;

			positionToolTip(e);
		}
	});


	$(document).on('scroll', function(e){

		if(lastScrolledLeft != $(document).scrollLeft()){
	        var distanceX = xMousePos -= lastScrolledLeft;
	        lastScrolledLeft = $(document).scrollLeft();
	        xMousePos += lastScrolledLeft;
	    }

	    if(lastScrolledTop != $(document).scrollTop()){
	        yMousePos -= lastScrolledTop;
	        lastScrolledTop = $(document).scrollTop();
	        yMousePos += lastScrolledTop;
	    }

		positionToolTip(e, xMousePos, yMousePos);

	});

	$('*').on('mouseover', function(e) {
		tooltipMove = 1;

	    $(this).addClass('hoverHighlight');

	    var f = identifyFont($(this));
	    var tag = $(this).prop("tagName");
	    var msg;


		var displayName = f.fontInfo.fontDisplayName;

		var linkAndName = searchTypewolf(f.fontInfo);

		if (linkAndName != -1){
			displayName = linkAndName[0];
		}


		var weightAndStyle = fontWeightStyleDisplay(f.fontStyle);

		if (f.fontInfo.fontPopularity != 0 && displayPopularity != 0){
			var pop = "<span style='color:#00f;'>#" + f.fontInfo.fontPopularity + "</span><br>";
		} else {
			var pop = "";
		}

		if (tag == "IFRAME"){
			msg = "That is an iframe.";

		} else if (tag == "IMG"){
			var width = $(this).width();
			var height = $(this).height();

			msg = "This is an image.<br>" + width + " x " + height;

	    } else {
	    	msg = pop
	    	+ "<b>" + displayName + "</b>"
	    	+ "<br>" + weightAndStyle + f.fontStyle.fontsize
	    	+ "<br><span style='color:#777;'>Click to sample</span>";
	    }

	    document.getElementById('temp').innerHTML = msg;

	    e.stopPropagation();

	});

	$('*').on('mouseout', function(e) {
	    $(this).removeClass('hoverHighlight');
	    e.stopPropagation();
	});

	$( "*" ).click(function( event ) {
	  event.preventDefault();
	});

	$('*').bind('click', function(e) {

		window.typeSamplePanelOpen = true;

		//Remove the temp "Loading" message
		document.getElementById("temp").style.display = "none";

		//Let user click things on the page again
		$('*').unbind('click');

		$('*').on('mouseover', function(e) {
	    	$(this).removeClass('hoverHighlight');
		});

		e.stopPropagation();

		$(this).addClass("selectHighlight");

		var f = identifyFont($(this));

		displaytypesample(f.fontInfo, f.fontStyle);

		fontInfoGlobal = f.fontInfo; //this doesn't feel elegant
		fontStyleGlobal = f.fontStyle; //Again, this doesn't feel elegant

		moveCursor();

 	 	initImageSave();

	});
}

function positionToolTip(e, xpos, ypos){

		if (xpos == undefined){
			var xpos = e.pageX;
		}

		if (ypos == undefined){
			var ypos = e.pageY;
		}

		var offset = 10;
		var left;
		var top;

		var temp = document.getElementById("temp");
		temp.style.position = "absolute"; //this needs to be important. May have to add CSS declaration? or to CSS file?

		//calculate X position
	    var pleft =		parseInt($('#temp').css( "padding-left" ), 10);
	    var pright = 	parseInt($('#temp').css( "padding-right" ), 10);

	    var totalToolTipWidth = pleft + pright + offset + $('#temp').width();


	    var winWidth = $(window).width();
	    var winScrollLeft = $(window).scrollLeft();

	    if ((totalToolTipWidth + xpos) < (winWidth + winScrollLeft)){
			left = xpos + offset;
	    } else {
			left = xpos - totalToolTipWidth;
	    }

		//calculate Y position
	   	var ptop =		parseInt($('#temp').css( "padding-top" ), 10);
	    var pbottom = 	parseInt($('#temp').css( "padding-bottom" ), 10);

	    var totalToolTipHeight = ptop + pbottom + offset + $('#temp').height();


	    var winHeight = $(window).height();
	    var winScrollTop = $(window).scrollTop();

	    if ((totalToolTipHeight + ypos) < (winHeight + winScrollTop)){
			top = ypos + offset;
	    } else {
			top = ypos - totalToolTipHeight;
	    }

	    $('#temp').css({
	       left:  left,
	       top:   top
	    });

}


function identifyFont(elem){

		fontStyle = new Object();

		fontStyle.fontfamily = elem.css("font-family");
		fontStyle.fontweight = elem.css("font-weight");
		fontStyle.fontstyle = elem.css("font-style");
		fontStyle.fontsize = elem.css("font-size");

		//this measures the fonts
		//measureAllFonts(fontfamily);
		var fontUsed = whatFontUsed(fontStyle.fontfamily, fontStyle.fontstyle);
		var fontInfo = getFontInfo(fontUsed);

		var popularity = howPopularIsFont(fontInfo.fontDisplayName);


		fontInfo.fontPopularity = popularity;

	    return {
	        fontStyle: fontStyle,
	        fontInfo: fontInfo
	    };
}


function howPopularIsFont(name){
	name = name.toLowerCase();

	for (var i =0; i < popularFonts.length; i++) {
		var popname = popularFonts[i].toLowerCase();
		if (name == popname){
			return i;

			//var n = convertToOrdinal(i+1);
			//return n;
		}
	}

	return 0;
}

// function convertToOrdinal(n){
// 		return n+([,'st','nd','rd'][~~(n/10%10)-1?n%10:0]||'th');
// }

/*
function searchTypewolf(fontInfo){
	// var str = fontInfo.fontDisplayName; 
	// var n = str.search("Visit");

	var s = fontInfo.fontDisplayName; 
	s = s.toLowerCase();
	var fontNameArray = s.split(/[ -]+/);


	console.log(fontNameArray);

	console.log("Looking for " + fontNameArray);

	var match = 0;

	for (var i =0; i < whitelist.length; i++) {
		var str = whitelist[i]; 
		var n = str.search(fontNameArray[0]);

		if (n != -1){
			//successful match

			if (fontNameArray.length > 1){

					var n = str.search(fontNameArray[1]);

					if (n != -1){
						//successful match of second word
						console.log("Also found " + fontNameArray[1]);
						match = 1;
						return i;
					} 
					
			} else {
				match = 1;
				return i;
			}
		}
	}

	return -1;

}

*/

function searchTypewolf(fontInfo){
	// var str = fontInfo.fontDisplayName; 
	// var n = str.search("Visit");

	var s = fontInfo.fontDisplayName; 
	s = s.toLowerCase();
	var fontNameArray = s.split(/[ -]+/);

	for (var i =0; i < fontNameArray.length; i++) {
		if (fontNameArray[i] == "" || fontNameArray[i] == " "){
			fontNameArray.splice(i, 1);
		}
	}


	var matches = 0;

	for (var i =0; i < whitelist.length; i++) {
		var str = whitelist[i][0]; 

		for (var j =0; j < fontNameArray.length; j++) {
			
			var n = str.search(fontNameArray[j]);

			if (n == -1){
				break;
			} else {
				matches++;

				if (matches >= fontNameArray.length){

					var linkAndName = new Array();
					linkAndName[0] = whitelist[i][1]; //display name
					linkAndName[1]= whitelist[i][2]; 	//link;

					return linkAndName;

				}
			}
		}
	}

	return -1;

}


function displaytypesample(fontInfo, fontStyle){



		// console.log(fontInfo.serviceDisplayName);
		// console.log(fontInfo.serviceAPI);
		// console.log(fontInfo.serviceLink);
		// console.log(fontInfo.fontDisplayName);
		// console.log(fontInfo.fontLink);

		// console.log(fontStyle.fontfamily);
		// console.log(fontStyle.fontweight);
		// console.log(fontStyle.fontstyle);
		// console.log(fontStyle.fontsize);





		var linkAndName = searchTypewolf(fontInfo);


		var fontName;


		if (linkAndName != -1){

			fontName = "<b>" + linkAndName[0] + "</b>";
			fontNameHTML = ", <a href='" + "https://www.typewolf.com/" + linkAndName[1] + "' target='_blank'>" + "View&nbsp;on&nbsp;Typewolf</a>";

		} else {
			fontName = "<b>" + fontInfo.fontDisplayName + "</b>";
			fontNameHTML = ""; //"<a href='" + fontInfo.fontLink +" ' target='_blank'><b>" + fontInfo.fontDisplayName + "</b></a>"
		}


		var weightAndStyle = fontWeightStyleDisplay(fontStyle);


		//get text for preview
		var txt = fillDefaultText();


		$("<div id='typesample' spellcheck='false'>"
			+ "<div id='typesamplebuttons'>"

				+ "<div id='fontsizecontainer'>"
				+ "<div class='fontsizebutton' onclick='fontSizeIncrement(-1);'> a </div>"
				+ "<input id='typesampleslider' width='123px' type='range' min='6' max='256' name='points' step='1' value='64' oninput='updateRange(this.value)'>"
				+ "<div class='fontsizebutton' id='fontsizebuttonlarger' onclick='fontSizeIncrement(1);'> a </div>"
				+ "</div>"
				+ "<span id='buttoncontainer'>"
				+ "<div id='closebtn' class='typesamplebutton secondarybtn' onclick='closePanel();'>Close</div>"
				+ "<select id='typesampleMenu' onchange='optionsMenu();' class='typesamplebutton secondarybtn hideOnMobile'><option>Presets</option><option value='pangram'>Pangram</option> <option value='lorem'>Loremâ€¦</option> <option value='abc'>A B Câ€¦</option> </select>"
				+ "<div id='convertpngbtn' class='typesamplebutton primarybtn'>Save</div>"

				+ "<div id='resetbtn' class='typesamplebutton secondarybtn'><span class='hideOnDesktop'>Back</span><span class='hideOnMobile'>&#x276e; Back</span></div>"
				+ "<div id='openbtn' class='typesamplebutton primarybtn'>Open</div>"
				//+ "<div id='savepngbtn' class='typesamplebutton primarybtn' download='MyImage.png'>Download</div>"

				+ "</span>"

			+ "</div>"

			+ "<div id='editcontainer'>"
				+ "<div id='typesamplemeta'>" + fontName + " " + weightAndStyle	 + "<span id='fontSizeOutput'>64px</span>" + fontNameHTML + "</div>"

				+ "<div id='typesampletext' contenteditable='true' onPaste='handlePaste(this, event)'>"
				+ txt
				+ "</div>"

				+ "<canvas width='0' height='0' style='border:1px solid #EEE; display:none;' id='canvasimage'></canvas>"
				+ "<div id='typesampleinfo'>"
			+ "</div>"

		+ "</div>").appendTo("body");


		//I forget what this does exactly
		fontStyle.fontfamily.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

		styletypesampletext(fontStyle.fontfamily, fontStyle.fontweight, fontStyle.fontstyle);
}


function optionsMenu(){
	var f = document.getElementById("typesampleMenu").value;
	if (f == "abc"){
		fillAbcText();
	} else if (f == "pangram"){
		fillRandomPangram();
	} else if (f == "lorem"){
		fillLorem();
	} else if (f == "rand"){
		fillRandom();
	}
}

function fontWeightStyleDisplay(fontStyle){

		if (fontStyle.fontweight != "400"){
			var weight = fontStyle.fontweight + " ";
		} else {
			var weight = "";
		}

		if (fontStyle.fontstyle != "normal"){
			var italic = fontStyle.fontstyle + " ";
		} else {
			var italic = "";
		}

		var w = weight + italic;

		return w;
}

function handlePaste(elem, e){

	window.defaultTypeSampleText
	var ele = document.getElementById('typesampletext')
	var txt = ele.textContent;
	var position = window.getSelection().getRangeAt(0).startOffset;

	// If the default text is still there and the cursor is at the beginning, remove default text
	if (txt == window.defaultTypeSampleText && position == 0){
		ele.innerHTML = "";
	}

	setTimeout(function(){
		var ele = document.getElementById('typesampletext')

		var txt = ele.innerHTML;

		// This is not perfect but...
		// if the pasted content does not start with opening div tag, then convert first occurent of <div> to a <br>
		var firstFour = txt.substring(0,4);
		if (firstFour != "<div"){
		    txt = txt.replace("<div>", "BREAK");
		}

		//prevents formatting from being pasted into sample text
		//convert <br> to \n
		txt = txt.replace(/<br\s*[\/]?>/gi, "BREAK");

		//convert closing </div> to \n
		txt = txt.replace(/<\/div>/g,'BREAK');
		txt = txt.replace(/<\/p>/g,'BREAK');
		txt = txt.replace(/<\/h1>/g,'BREAK');
		txt = txt.replace(/<\/h2>/g,'BREAK');
		txt = txt.replace(/<\/h3>/g,'BREAK');
		txt = txt.replace(/<\/h4>/g,'BREAK');
		txt = txt.replace(/<\/h5>/g,'BREAK');
		txt = txt.replace(/<\/h6>/g,'BREAK');

		//remove all remaining tags
		txt = txt.replace(/(<([^>]+)>)/ig,"");

		//Now that we've cleaned away all tags, convert BREAK to <br>
		txt = txt.replace(/BREAK/g,'<br>');

		ele.innerHTML = txt;  //bailed innerText for textContent
	},10);
}

 function setCursor(node,pos){
    var node = (typeof node == "string" ||
    node instanceof String) ? document.getElementById(node) : node;
        if(!node){
            return false;
        }else if(node.createTextRange){
            var textRange = node.createTextRange();
            textRange.collapse(true);
            textRange.moveEnd(pos);
            textRange.moveStart(pos);
            textRange.select();
            return true;
        }else if(node.setSelectionRange){
            node.setSelectionRange(pos,pos);
            return true;
        }
        return false;
    }

function moveCursor(){
	$elem = $('#typesampletext');
	$elem.focus();
	setCursor( 'typesampletext' , $elem.val().length ); //set caret
}

function focusAndActivateSaveButton(){
	$("#convertpngbtn").removeClass("primarybtn_inactive").addClass("primarybtn");

	var e = document.getElementById("typesampletext")
	e.focus();
}


function fillDefaultText(){
	var txt;

	txt = "Okay. Now type something.";

	window.defaultTypeSampleText = txt;
	return txt;
}


function fillRandomPangram(){
	var pangram;
	pangram = pangrams[Math.floor(Math.random()*pangrams.length)];
	var ele = document.getElementById('typesampletext')
	ele.innerHTML = pangram;

	focusAndActivateSaveButton();
}

function fillAbcText(){
	var ele = document.getElementById('typesampletext')
	ele.innerHTML="A B C D E F G H I J K L M N O P Q R S T U V W X Y Z a b c d e f g h i j k l m n o p q r s t u v w x y z & 0 1 2 3 4 5 6 7 8 9 { } [ ] ( ) ? ! @ â€œ â€ Â« Â» fl fi Ã¥ Ã© Ã¼ Ã¬ Ã§ Ã¸ ÃŸ Ã… Ã‰ Ãœ ÃŒ Ã‡ Ã˜";

	focusAndActivateSaveButton();
}

function fillLorem(){
	var ele = document.getElementById('typesampletext')
	ele.innerHTML="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean luctus sed augue eget vehicula. Maecenas eget mollis quam, nec convallis lorem. Nunc euismod elementum sem, ac tristique felis. Curabitur suscipit est sed eros tempor imperdiet. Sed non enim et nibh sodales molestie. Maecenas ut leo metus. Mauris efficitur velit orci. Fusce quis nisi vitae enim mollis feugiat.";

	focusAndActivateSaveButton();
}







var pangrams = new Array();
pangrams = [
	"The quick brown fox jumps over a lazy dog.",
	"My faxed joke won a pager in the cable TV quiz show.",
	"Few black taxis drive up major roads on quiet hazy nights.",
	"A quick movement of the enemy will jeopardize six gunboats.",
	"Brawny gods just flocked up to quiz and vex him.",
	"When zombies arrive, quickly fax judge Pat.",
	"Just keep examining every low bid quoted for zinc etchings.",
	"How razorback-jumping frogs can level six piqued gymnasts!",
	"The wizard quickly jinxed the gnomes before they vaporized."
];


function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


function saveFont(){
	var myImage = document.getElementById('canvasimage'); // or whatever means of access
	var src = myImage.src; // will contain the full path

	window.open(src,'_blank');

	/*
	var fi = fontInfoGlobal;
	var fs = fontStyleGlobal;

	// fontInfoGlobal.serviceDisplayName;
	// fontInfoGlobal.serviceAPI;
	// fontInfoGlobal.serviceLink;
	// fontInfoGlobal.fontDisplayName,
	// fontInfoGlobal.fontLink;

	// fontStyleGlobal.fontfamily
	// fontStyleGlobal.fontweight
	// fontStyleGlobal.fontstyle

	var myImage = document.getElementById('canvasimage'); // or whatever means of access
	var src = myImage.src; // will contain the full path

	var fontSize = document.getElementById('fontSizeOutput').innerHTML;
	var randomId = makeid();

	var regex = /([\-\â€“\â€”\_\s])/; //split at spaces and hypens and dashes and underscores
	var nameShortened = fi.fontDisplayName.split(regex);

	var imageName = nameShortened[0] + "_" + randomId;
	imageName = imageName.toLowerCase();

	//add "_2x" if this is a retina image
	if (pixelRatio!=1){
		imageName += "_" + pixelRatio +"x";
	}

	var currentURL = document.URL;

	var sample_text = document.getElementById('typesampletext').innerHTML;


	var sample = {
            font_family:			fs.fontfamily,
            font_size:				fontSize,
            font_style:				fs.fontstyle,
            font_weight: 			fs.fontweight,
            font_link: 				fi.fontLink,
            font_name: 				fi.fontDisplayName,
            font_source: 			currentURL,
            service_displayname: 	fi.serviceDisplayName,
            service_link: 			fi.serviceLink,
            image_url: 				src,
            bookmark_id: 			imageName,
            sample_text: 			sample_text
        };

    $.post( location.protocol + path + "samples", { sample: sample } );
	window.open(location.protocol + path + "samples/" + imageName+"/loading","_blank");


	//js_open('POST',"http:" + path + "samples", sample, '_blank' );
	return false;
	*/
}

// function js_open(verb, url, data, target) {
//   var form = document.createElement("form");
//   form.action = url;
//   form.method = verb;
//   form.target = target || "_self";
//   if (data) {
//     for (var key in data) {
//       var input = document.createElement("input");
//       input.name = "[sample]"+key;
//       input.value = typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key];
//       //input.value = data[key];
//       form.appendChild(input);
//     }
//   }
//   form.style.display = 'none';
//   document.body.appendChild(form);
//   form.submit();
// };


function initImageSave() {

	var oCanvas = document.getElementById("canvasimage");
	var oCtx = oCanvas.getContext("2d");

	function showDownloadText() {
		document.getElementById("convertpngbtn").style.display = "none";
		document.getElementById("typesampleMenu").style.display = "none";
		document.getElementById("resetbtn").style.display = "inline";
	}

	function hideDownloadText() {
		document.getElementById("convertpngbtn").style.display = "inline";
		document.getElementById("resetbtn").style.display = "none";

		if (screen.width >= 640){
			document.getElementById("typesampleMenu").style.display = "inline";
		}
	}

	function convertCanvas(strType) {
		if (strType == "PNG")
			var oImg = Canvas2Image.saveAsPNG(oCanvas, true);
		if (strType == "BMP")
			var oImg = Canvas2Image.saveAsBMP(oCanvas, true);
		if (strType == "JPEG")
			var oImg = Canvas2Image.saveAsJPEG(oCanvas, true);

		if (!oImg) {
			alert("Sorry, this browser is not capable of saving " + strType + " files!");
			return false;
		}

		oImg.id = "canvasimage";

		oImg.className = "fontpng";
		//oImg.className = "fontpngOffscreen";

		oCanvas.parentNode.replaceChild(oImg, oCanvas);


		oImg.onload = function() {
		  //alert(this.width + 'x' + this.height);
		  this.width *= 0.5;
		  document.getElementById("canvasimage").style.display = "inline";

		}



		showDownloadText();
	}

	function saveCanvas(pCanvas, strType) {
		var bRes = false;
		if (strType == "PNG")
			bRes = Canvas2Image.saveAsPNG(oCanvas);
		if (strType == "BMP")
			bRes = Canvas2Image.saveAsBMP(oCanvas);
		if (strType == "JPEG")
			bRes = Canvas2Image.saveAsJPEG(oCanvas);

		if (!bRes) {
			alert("Sorry, this browser is not capable of saving " + strType + " files!");
			return false;
		}
	}

	document.getElementById("convertpngbtn").onclick = function() {

		if (keyPressed[16] == true && (keyPressed[18] == true)) {

			duplicateHTMLToCanvas();
			saveCanvas(oCanvas, "PNG");

	    	return;
		}

		//reset the image back to a canvas. Same works as below in:	document.getElementById("resetbtn").onclick = function() {
		// var oImg = document.getElementById("canvasimage");
		// oImg.parentNode.replaceChild(oCanvas, oImg);
		// var c = document.getElementById("canvasimage");
		// c.width = 0;
		// c.height = 0;

		// duplicateHTMLToCanvas();
		// convertCanvas("PNG");
		// saveFont();

		// //hide input text
		// document.getElementById("typesamplemeta").style.display = "none";
		// document.getElementById("typesampletext").style.display = "none";
		// document.getElementById("typesample").className += "typesampledark"; 
		// document.getElementById("fontsizecontainer").style.display = "none";

		// document.getElementById("savepngbtn").style.display = "block";
		// document.getElementById("openbtn").style.display = "block";

		// // Make sure elements don't animate when being "re-displayed" when user hits reset button
		// var d = document.getElementById("typesampletext");
		// d.className = d.className + " notransition";
		
		// var e = document.getElementById("typesamplemeta");
		// e.className = e.className + " notransition";	


		duplicateHTMLToCanvas();

		convertCanvas("PNG");

		//hide input text
		document.getElementById("typesamplemeta").style.display = "none";
		document.getElementById("typesampletext").style.display = "none";



		document.getElementById("typesample").className += "typesampledark"; 
		document.getElementById("fontsizecontainer").style.display = "none";

		//document.getElementById("savepngbtn").style.display = "block";
		//document.getElementById("openbtn").style.display = "block";


		document.getElementById("typesampleMenu").style.display = "none";

		// Make sure elements don't animate when being "re-displayed" when user hits reset button
		var d = document.getElementById("typesampletext");
		d.className = d.className + " notransition";
		
		var e = document.getElementById("typesamplemeta");
		e.className = e.className + " notransition";	

		
		var delayInMilliseconds = 500; //1 second

		setTimeout(function() {
		  saveCanvas(oCanvas, "PNG");
		}, delayInMilliseconds);

	}

	document.getElementById("resetbtn").onclick = function() {
		var oImg = document.getElementById("canvasimage");
		oImg.parentNode.replaceChild(oCanvas, oImg);

		var c = document.getElementById("canvasimage");

		c.width = 0;
		c.height = 0;

		hideDownloadText();

		document.getElementById("typesamplemeta").style.display = "block";
		document.getElementById("typesampletext").style.display = "block";

		document.getElementById("typesample").className = "";
		document.getElementById("fontsizecontainer").style.display = "block";

		document.getElementById("savepngbtn").style.display = "none";
		document.getElementById("openbtn").style.display = "none";
		document.getElementById("resetbtn").style.display = "none";


		if (screen.width >= 640){
			document.getElementById("typesampleMenu").style.display = "block";
		}

	}


	document.getElementById("savepngbtn").onclick = function() {
		// duplicateHTMLToCanvas();
		saveCanvas(oCanvas, "PNG");
	}


	document.getElementById("openbtn").onclick = function() {
		saveFont();
	}

	function getStyle(el,styleProp) {
	  var camelize = function (str) {
	    return str.replace(/\-(\w)/g, function(str, letter){
	      return letter.toUpperCase();
	    });
	  };

	  if (el.currentStyle) {
	    return el.currentStyle[camelize(styleProp)];
	  } else if (document.defaultView && document.defaultView.getComputedStyle) {
	    return document.defaultView.getComputedStyle(el,null)
	                               .getPropertyValue(styleProp);
	  } else {
	    return el.style[camelize(styleProp)];
	  }
	}


    function duplicateHTMLToCanvas() {
		var c = document.getElementById("canvasimage");
		var ctx = c.getContext("2d");
		ctx.textBaseline="top";

		window.isThisARetinaScreen = 1;
		window.pixelRatio = 1;

		if (isThisARetinaScreen == 1){
			pixelRatio = 2;
		}

		var iWidth = c.width;
		var iHeight = c.height;


		//create a clear rectangle
		ctx.clearRect(0,0,iWidth,iHeight);

		var element = document.getElementById('typesampletext');

	    var padding = 20*pixelRatio;

		var w = getStyle(element, 'width');
		var h = getStyle(element, 'height');


		w = Math.round(eval(w.substring(0, w.length - 2)));
		h = Math.round(eval(h.substring(0, h.length - 2)));

		w = w*pixelRatio;
		h = h*pixelRatio;


		c.width = w + (padding*2);
		c.height = h + (padding*2) + (34*pixelRatio);

		var fontSize = getStyle(element, 'font-size');
		var fontFamily = getStyle(element, 'font-family');
		var fontWeight = getStyle(element, 'font-weight');
		var fontStyle = getStyle(element, 'font-style');
		var lineHeight = getStyle(element, 'line-height');

		lineHeight = eval(lineHeight.substring(0, lineHeight.length - 2));
		lineHeight = lineHeight*pixelRatio;

		fontStyle.toLowerCase();

		var txt = element.innerHTML;


		//OLD METHOD
        // txt = txt.replace(/&nbsp;/g,'Â ');              			//convert NBSP

        // txt = txt.replace(/<br\s*[\/]?>/gi, " NEWLINE_BR ");   	//convert <br> to \n
        // txt = txt.replace(/<div\s*[\/]?>/gi, " NEWLINE_DIV ");	//convert <div> to \n
        // txt = txt.replace(/NEWLINE_DIV  NEWLINE_BR/g , 'NEWLINE');
        // txt = txt.replace(/NEWLINE_DIV/g, 'NEWLINE');
        // txt = txt.replace(/NEWLINE_BR/g, 'NEWLINE');

        // txt = txt.replace(/(<([^>]+)>)/ig,"");        			//remove all remaining tags
        // txt = txt.replace(/&amp;/g, '&');						//replace &amp; with &
        // txt = txt.replace(/&lt;/g, '<');
        // txt = txt.replace(/&gt;/g, '>');


        //NEW METHOD
        txt = txt.replace(/&nbsp;/g,'Â ');              			//convert NBSP
        txt = txt.replace(/<[\/]{0,1}(span|SPAN)[^><]*>/g,""); // remove all span tags
		txt = txt.replace(/<br\s*[\/]?>/gi, " NEWLINE_BR ");   	//convert <br> to \n
        txt = txt.replace(/<div\s*[\/]?>/gi, " NEWLINE_DIV ");	//convert <div> to \n
        txt = txt.replace(/(<([^>]+)>)/ig,"");        			//remove all remaining tags


        txt = txt.replace(/NEWLINE_DIV  NEWLINE_BR/g , 'NEWLINE');
        txt = txt.replace(/NEWLINE_BR  NEWLINE_DIV/g , 'NEWLINE');

        txt = txt.replace(/NEWLINE_DIV/g, 'NEWLINE');
        txt = txt.replace(/NEWLINE_BR/g, 'NEWLINE');

        txt = txt.replace(/&amp;/g, '&');						//replace &amp; with &
        txt = txt.replace(/&lt;/g, '<');
        txt = txt.replace(/&gt;/g, '>');



		//Meta display text
		var ypadding = padding+(18*pixelRatio);

		var metaFontSize = 14*pixelRatio;

		var fontName =  fontInfoGlobal.fontDisplayName;

		var linkAndName = searchTypewolf(fontInfoGlobal);

		if (linkAndName != -1){
			fontName = linkAndName[0];
		}



		ctx.font= "bold" + " " + metaFontSize + "px" + " " + "Courier New, monospace";
 		ctx.fillText(fontName, padding, ypadding);

 		var metrics = ctx.measureText(fontName);

 		var s;
		// if (fontInfoGlobal.serviceLink != "none"){
		// 	s =  ", " + fontInfoGlobal.serviceDisplayName + " ";
		// } else {
			s = " ";
		//}

		var weightAndStyle = fontWeightStyleDisplay(fontStyleGlobal);

		ctx.font= "normal" + " " + metaFontSize + "px" + " " + "Courier New, monospace";
 		ctx.fillText(s + weightAndStyle + fontSize, metrics.width + (20*pixelRatio), ypadding);


 		//text for canvas

 		// var fontWeightOrStyle;

 		// if (fontStyle == "italic"){
 		// 	fontWeightOrStyle = fontStyle + " " + fontWeight;
 		// } else {
 		// 	fontWeightOrStyle = fontWeight;
 		// }


 		//Get fontSize without the "px"
 		var fontSizeAsNumber = eval(fontSize.substring(0, fontSize.length - 2));

 		fontSize = fontSizeAsNumber*pixelRatio;

		ctx.font = weightAndStyle + " " + fontSize + "px" + " " + fontFamily;
	    ctx.fillStyle = '#000';

    	var x = padding;
    	var y = padding + (33*pixelRatio) + fontSize - (6 * pixelRatio); //lineHeight;


      	wrapText(ctx, txt, x, y, w, lineHeight);
		//getLines("#typesampletext", ctx, x, y);
	}

	var nodeCount = 0;

	function wrap(target) {

	    var revert = target.html();

	    var newtarget = $("<div></div>");
	    nodes = target.contents().clone();

	    $.each(nodes, function( j ) {

	        if (this.nodeType == 3) {
	            var newhtml = "";
	            var text = this.textContent;

	            for (var i=0; i < text.length; i++) {

	                newhtml += "<ts class='tselemtemp' id='tselem" + nodeCount + "'>" + text[i] + "</ts>";
	                 nodeCount++;
	            }

	            newtarget.append($(newhtml));

	        } else {

	            $(this).html(wrap($(this)));
	            newtarget.append($(this));
	        }
	    });

	    return newtarget.html();
	}

	// function getLinesAndOffset(){
	// 	    var line = "";
	// 		var lines = [];
	// 		var elem_intitial = $( "#tselem0" );
	// 		var offset = elem_intitial.position();
	// 		var prevOffsetTop = offset.top;

	//         for(var i = 0; i < nodeCount; i++) {
	// 		    var elem = $( "#tselem"+i );

	//             offset = elem.position();
	// 		    var content = elem.html();

	// 		    if (offset.top > prevOffsetTop && i>0){

	//                 line = line.replace(/&nbsp;/g,'Â ');
	//                 line = line.replace(/&amp;/g, '&');
	//                 line = line.replace(/&lt;/g, '<');
	//                 line = line.replace(/&gt;/g, '>');
	//                 line = line.replace(/\s*$/,"");				//trim whitespace at end of line

	// 		    	lines.push([prevOffsetTop, line]);
	//                 prevOffsetTop = offset.top;
	// 		    	line = "";
	// 		    }

	// 		    line += content;

	// 		    console.log("tselem"+i+", " + content + ", " + offset.top + ", " + offset.left);


	// 		}

	// 		lines.push([offset.top, line]);

	//         return lines;
	// }

	// function getLines(elem, context, x, y){

	// 	var $p = $(elem);
	// 	var revert = $p.html();



	//     $(elem).html(wrap($(elem)));
	//     var lines = getLinesAndOffset();

	//     var yoffset = y - lines[0][0];
	//     console.log(lines[0][0] + " : " + y)

	//     for(var j = 0; j < lines.length; j++) {
	//         console.log(lines[j][0] + " : " + lines[j][1]);
	//         context.fillText(lines[j][1], x, lines[j][0]+yoffset);

	//     }


	//     $(elem).html(revert);
	// }



	function wrapText(context, text, x, y, maxWidth, lineHeight) {
        //var words = text.split(' '); //old method. split at spaces and spaces were reinserted later.

        var regex = /([\-\â€“\â€”\.\s])/; //split at spaces and hypens and dashes
		var words = text.split(regex);

		var space = '';
        var line = '';

        for(var n = 0; n < words.length; n++) {

          //if the latest word is NEWLINE
          //	print line (which does NOT have the "NEWLINE" on the end)
          //	reset line to ''
          //	increment y position by lineHeight to next line
          //

          	var word = words[n];

			if (word == "NEWLINE"){

				context.fillText(line, x, y);
		        line = '';
		        y += lineHeight;

			} else {

		          //Add next word to testLine
		          var testLine = line + word + space;

		          //measure line
		          var metrics = context.measureText(testLine);

		          //get width of testLine
		          var testWidth = metrics.width;


		          //if the textLine exceeds maxWidth then...
		          //	print line (which does NOT have the latest word on the end)
		          //	reset line to latest word + ' '
		          //	increment y position by lineHeight to next line
		          //

		         console.log(testWidth);

		          console.log(maxWidth);

		          if (testWidth >= (maxWidth+1) && n > 0) {
 					

		            context.fillText(line, x, y);
		            line = word + space;
		            y += lineHeight;
		          }

		          //if it _does not_ exceed the maxWidth then testLine is the new line
		          else {
		            line = testLine;
		            line = line.replace(/(^\s+)/g,''); //remove leading spaces on a new line

		            //console.log("line: " + line);

		          }
	    	}
        }
        context.fillText(line, x, y);
      }

}


/*
 * Canvas2Image v0.1
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 */

var Canvas2Image = (function() {

	// check if we have canvas support
	var bHasCanvas = false;
	var oCanvas = document.createElement("canvas");
	if (oCanvas.getContext("2d")) {
		bHasCanvas = true;
	}

	// no canvas, bail out.
	if (!bHasCanvas) {
		return {
			saveAsBMP : function(){},
			saveAsPNG : function(){},
			saveAsJPEG : function(){}
		}
	}

	var bHasImageData = !!(oCanvas.getContext("2d").getImageData);
	var bHasDataURL = !!(oCanvas.toDataURL);
	var bHasBase64 = !!(window.btoa);

	var strDownloadMime = "image/octet-stream";

	// ok, we're good
	var readCanvasData = function(oCanvas) {
		var iWidth = parseInt(oCanvas.width);
		var iHeight = parseInt(oCanvas.height);
		return oCanvas.getContext("2d").getImageData(0,0,iWidth,iHeight);
	}

	// base64 encodes either a string or an array of charcodes
	var encodeData = function(data) {
		var strData = "";
		if (typeof data == "string") {
			strData = data;
		} else {
			var aData = data;
			for (var i=0;i<aData.length;i++) {
				strData += String.fromCharCode(aData[i]);
			}
		}
		return btoa(strData);
	}

	// creates a base64 encoded string containing BMP data
	// takes an imagedata object as argument
	var createBMP = function(oData) {
		var aHeader = [];
	
		var iWidth = oData.width;
		var iHeight = oData.height;

		aHeader.push(0x42); // magic 1
		aHeader.push(0x4D); 
	
		var iFileSize = iWidth*iHeight*3 + 54; // total header size = 54 bytes
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256);

		aHeader.push(0); // reserved
		aHeader.push(0);
		aHeader.push(0); // reserved
		aHeader.push(0);

		aHeader.push(54); // dataoffset
		aHeader.push(0);
		aHeader.push(0);
		aHeader.push(0);

		var aInfoHeader = [];
		aInfoHeader.push(40); // info header size
		aInfoHeader.push(0);
		aInfoHeader.push(0);
		aInfoHeader.push(0);

		var iImageWidth = iWidth;
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256);
	
		var iImageHeight = iHeight;
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256);
	
		aInfoHeader.push(1); // num of planes
		aInfoHeader.push(0);
	
		aInfoHeader.push(24); // num of bits per pixel
		aInfoHeader.push(0);
	
		aInfoHeader.push(0); // compression = none
		aInfoHeader.push(0);
		aInfoHeader.push(0);
		aInfoHeader.push(0);
	
		var iDataSize = iWidth*iHeight*3; 
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); 
	
		for (var i=0;i<16;i++) {
			aInfoHeader.push(0);	// these bytes not used
		}
	
		var iPadding = (4 - ((iWidth * 3) % 4)) % 4;

		var aImgData = oData.data;

		var strPixelData = "";
		var y = iHeight;
		do {
			var iOffsetY = iWidth*(y-1)*4;
			var strPixelRow = "";
			for (var x=0;x<iWidth;x++) {
				var iOffsetX = 4*x;

				strPixelRow += String.fromCharCode(aImgData[iOffsetY+iOffsetX+2]);
				strPixelRow += String.fromCharCode(aImgData[iOffsetY+iOffsetX+1]);
				strPixelRow += String.fromCharCode(aImgData[iOffsetY+iOffsetX]);
			}
			for (var c=0;c<iPadding;c++) {
				strPixelRow += String.fromCharCode(0);
			}
			strPixelData += strPixelRow;
		} while (--y);

		var strEncoded = encodeData(aHeader.concat(aInfoHeader)) + encodeData(strPixelData);

		return strEncoded;
	}


	// sends the generated file to the client
	var saveFile = function(strData) {
		//document.location.href = strData;

		var download = document.createElement('a');

		download.href = strData;

		var filename = fontInfoGlobal.fontDisplayName;
		filename = filename.replace(/\s+/g, '-').toLowerCase();

		download.download = filename + '.png';
		download.click();

	}

	var makeDataURI = function(strData, strMime) {
		return "data:" + strMime + ";base64," + strData;
	}

	// generates a <img> object containing the imagedata
	var makeImageObject = function(strSource) {
		var oImgElement = document.createElement("img");
		oImgElement.src = strSource;
		return oImgElement;
	}

	var scaleCanvas = function(oCanvas, iWidth, iHeight) {
		if (iWidth && iHeight) {
			var oSaveCanvas = document.createElement("canvas");
			oSaveCanvas.width = iWidth;
			oSaveCanvas.height = iHeight;
			oSaveCanvas.style.width = iWidth+"px";
			oSaveCanvas.style.height = iHeight+"px";

			var oSaveCtx = oSaveCanvas.getContext("2d");

			oSaveCtx.drawImage(oCanvas, 0, 0, oCanvas.width, oCanvas.height, 0, 0, iWidth, iHeight);
			return oSaveCanvas;
		}
		return oCanvas;
	}

	return {

		saveAsPNG : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!bHasDataURL) {
				return false;
			}
			var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
			var strData = oScaledCanvas.toDataURL("image/png");
			if (bReturnImg) {
				return makeImageObject(strData);
			} else {
				saveFile(strData.replace("image/png", strDownloadMime));
			}

			return true;
		},

		saveAsJPEG : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!bHasDataURL) {
				return false;
			}

			var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
			var strMime = "image/jpeg";
			var strData = oScaledCanvas.toDataURL(strMime);
	
			// check if browser actually supports jpeg by looking for the mime type in the data uri.
			// if not, return false
			if (strData.indexOf(strMime) != 5) {
				return false;
			}

			if (bReturnImg) {
				return makeImageObject(strData);
			} else {
				saveFile(strData.replace(strMime, strDownloadMime));
			}
			return true;
		},

		saveAsBMP : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!(bHasImageData && bHasBase64)) {
				return false;
			}

			var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);

			var oData = readCanvasData(oScaledCanvas);
			var strImgData = createBMP(oData);
			if (bReturnImg) {
				return makeImageObject(makeDataURI(strImgData, "image/bmp"));
			} else {
				saveFile(makeDataURI(strImgData, strDownloadMime));
			}
			return true;
		}
	};

})();



/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */

/*
 * Interfaces:
 * b64 = base64encode(data);
 * data = base64decode(b64);
 */

(function() {

var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64DecodeChars = new Array(
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
	c1 = str.charCodeAt(i++) & 0xff;
	if(i == len)
	{
	    out += base64EncodeChars.charAt(c1 >> 2);
	    out += base64EncodeChars.charAt((c1 & 0x3) << 4);
	    out += "==";
	    break;
	}
	c2 = str.charCodeAt(i++);
	if(i == len)
	{
	    out += base64EncodeChars.charAt(c1 >> 2);
	    out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
	    out += base64EncodeChars.charAt((c2 & 0xF) << 2);
	    out += "=";
	    break;
	}
	c3 = str.charCodeAt(i++);
	out += base64EncodeChars.charAt(c1 >> 2);
	out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
	out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
	out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
	/* c1 */
	do {
	    c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
	} while(i < len && c1 == -1);
	if(c1 == -1)
	    break;

	/* c2 */
	do {
	    c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
	} while(i < len && c2 == -1);
	if(c2 == -1)
	    break;

	out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

	/* c3 */
	do {
	    c3 = str.charCodeAt(i++) & 0xff;
	    if(c3 == 61)
		return out;
	    c3 = base64DecodeChars[c3];
	} while(i < len && c3 == -1);
	if(c3 == -1)
	    break;

	out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

	/* c4 */
	do {
	    c4 = str.charCodeAt(i++) & 0xff;
	    if(c4 == 61)
		return out;
	    c4 = base64DecodeChars[c4];
	} while(i < len && c4 == -1);
	if(c4 == -1)
	    break;
	out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
}

if (!window.btoa) window.btoa = base64encode;
if (!window.atob) window.atob = base64decode;

})();
