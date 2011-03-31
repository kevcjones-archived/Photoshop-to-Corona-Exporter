/*
The MIT License

Copyright (c) 2011 Kevin C Jones aka @KevCJones aka him@kevincjones.co.uk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.	
*/

/*
	Corona Director Exporter
	----------------------------------
	
	Converts a layered PSD into a main.lua + and scenes along with an assets folder for all images used in the layout as seperate usable assets.
	I use templates in the script which are direct copies and make good use of the String.replace(what,with) js function. As we grow these $hooks 
	to inject code can be easily exxpanded to support more and more complex jobs. The challenge will be finding nice ways to put them into the  layers.
	
	Currently we make good use of keyterms in the name to help the exported identiy what to treat that layer as. These keyterms are removed once detected
	and not included in filenames and variable names for the objects they generate. e.g, myscene_scene strips _scene_ and calls the local scene file 'myscene.lua'.
	
	Keyterms:
	
	 + _scene_ in layers on the root is the scene files themselves. 
	 + _button_ in group layers will beging creating a button in the scene and look inside the group for :
	     - _default_ for the image used as the default state of the button (UI.lua)
	     - _touch_ for the touch image. 	
	+ _merge_ on groups will merge normal group layers into flat images and create single local variables to reference the image

	Note : If _touch_ or _default_ is the name of a group not a layer then that group is merged and saved as  a single image as you would expect.

	Contributors
	-----------------

	So far just me :) but I hope to involve everyone. These things tend to do the best when they have a following and people care about the code as well. I hope
	that we can keep it clean, readable and maintainable as we grow it, I will be adding it into Github sooner rather than later. With any luck the great guys at Corona
	will see fit to bundle it in the installer package and offer us all promotion codes for our efforts ;) ;) such rewards are merely a bonus...
	
	
	To Do: 
	---------
	
	- Add Sprite Sheet / MovieClip support
	- Add Basic Entry Animations (tweenfrombottom, top, left, right etc)
	
	
	Known Issues
	-------------------
	
	- I added padding because in Corona i was seeing a glitch in the simulator for left hand edges which touched the screen. We should test with and without this on hardware to 
	  see if it is purely a scaling issue on the simulator or if there is an issue with the rendering, Padding is all sides and will auto offset the X,Y coord by -padding, -padding to compensate
	  the invisible bordering.
	
*/

var scriptversion						= "0.0.39";
var dom 									= app.activeDocument;
var origURL                                 = (dom!=null)?dom.path + "/" + dom.name:"";
app.activeDocument.rulerUnits 	= Units.PIXELS;
app.preferences.rulerUnits 			= Units.PIXELS;
var totalLayers 							= dom.layers.length;
var width 									= app.activeDocument.width.as('px');
var height 								= app.activeDocument.height.as('px');
var imagePadding 					= 1.0; //px 
var imagePaddingx2 					= imagePadding*2; //px
var nativePPI							= Math.round(dom.resolution);

//folder names
var exportFolder 						= "export/"
var assetsFolder 						= "images/";

//groups using the word _scene_ on the root layer are treated as such
var groupStack 						= ["localGroup"];
var currentScene 						= null;
var firstScene 							= "";

//file and code strings
var SceneGroupString 				= "";
var SceneImagesString 				= "";
var sceneInsertsString				= "";
var scenePositionsString			= "";
var touchFunctionsString			= "";
var listenerFunctionsString			= "";
var configLua							= "";
var mainLuaText 						= mainLuaTemplate();
var currentSceneText				= "";

//exported png file names used to avoid conflicts
var exportedPNGS 					= [];
var closeList                           = [dom];

var isWindows                          = true;



//Testing purposes only - in the event of a crash the following are suspected choke points
//turn them off and back on with a test for each to see when the crash occurs..

var renderImages						= true;
var performUndos						= true;
var closeDocuments					= true;

//==============================================================================================================
// CORE LOOP AND  CODE GENERATION
//==============================================================================================================


try
{
	
	if ($.os.search(/windows/i) != -1) {
			isWindows = true;
		} else {
			isWindows = false;
	}

	isWindows=false;
	
	trace("Starting the export using version "+scriptversion);
	trace(" using "+(isWindows==true)?"Windows":"Mac");

	//build scenes one group at a time
	for(i=0;i<totalLayers;i++)
	{
		//scene strings are wiped clean on every scene
		SceneGroupString 			= "";
		SceneImagesString 		= "";
		sceneInsertsString			= "";
		scenePositionsString		= "";
		touchFunctionsString		= "";
		listenerFunctionsString	= "";
		
		//write a new template
		currentSceneText = sceneLuaTemplate();
		
		//time to run down the layers, groups_scene_ first then its open season. Art Layers are ignored right now
		var layer 	= dom.layers[i];
		switch(layer.typename)
		{
				case "ArtLayer":  HandleRootArtLayer(layer);
				break;
				case "LayerSet": HandleScene(layer);
				break;
		}

		//builds the scene text from the collected strings
		currentSceneText = currentSceneText.replace ("$height",height);					
		currentSceneText = currentSceneText.replace ("$width",width);
		currentSceneText = currentSceneText.replace ("$groups",SceneGroupString);
		currentSceneText = currentSceneText.replace ("$displayObjects",SceneImagesString);
		currentSceneText = currentSceneText.replace ("$inserts",sceneInsertsString);
		currentSceneText = currentSceneText.replace("$positions",scenePositionsString);
		currentSceneText = currentSceneText.replace("$addListeners",listenerFunctionsString);
		currentSceneText = currentSceneText.replace("$listeners",touchFunctionsString);
		
		//write the scene file
		saveFile(currentScene+".lua",currentSceneText);
		if(i==0) 
			firstScene = currentScene;
	}

	if(currentScene != null) // we found at least one scene 
	{
		mainLuaText = mainLuaText.replace ("$initScene",firstScene)
		saveFile("main.lua",mainLuaText);
		alert ("You have exported the project in the export folder local to your PSD", "Export Complete");
		
		if(isWindows == false && closeDocuments==true)
		{
			for(i=0;i<closeList.length;i++)
			{
				var cDoc = closeList[i];    
				if(cDoc)
				{
					cDoc.close(SaveOptions.DONOTSAVECHANGES);
				}
			}
		
			app.open (File(origURL));
		}
	}
	else
	{
		alert ("No group layers on the root found containing the string _scene_", "Export Failed");
	}
}
catch(error)
{
		alert (error, "Export Failed");
}

//==============================================================================================================
// FUNCTIONS BEGIN
//==============================================================================================================

function HandleRootArtLayer(layer)
{
	trace("LAYER - " + layer.name);
	trace("Warning there is no need to create root layers.... use scene groups");
}


function HandleScene(layer)
{
	var visible = layer.visible;
	if(!visible) 
		return; // we are not going to work on invible
	
	var isScene = layer.name.lastIndexOf ("_scene_");
	if(isScene == -1)
		return;// we are looking for scenese
		
	if(currentScene == null) // first scene found create some folders so we can export
	{
		//create the export folders...
		trace("Create folders...");
		new Folder (dom.path+"/"+exportFolder).create()
		new Folder(dom.path+"/"+exportFolder+assetsFolder).create()
	}
		
	currentScene = layer.name.substr (0,isScene);
	trace("SCENE - "+currentScene);
	
	HandleSceneGroupFolder(layer);
}

function HandleSceneGroupFolder(layer)
{
	/*
	for simplicity every scene is made up of :
		+ Layers
			-- Images
		+ Groups
			-- Groups are merged if _merged_ is found in the name
			-- Groups are treated as button if _button_ is found in the name	
			-- Groups will be treated as simply groups in Corona and still it will recurse the same parse function
	*/
	var scenelayers = layer.layers.length
	
	//from bottom to top
	while(scenelayers--)
	{
		var scenelayer = layer.layers[scenelayers];
		
		switch(scenelayer.typename)
		{
				case "ArtLayer":  HandleSceneImage(scenelayer);
				break;
				case "LayerSet": HandleSceneGroup(scenelayer);
				break;
		}
	}
}


function HandleSceneImage(scenelayer)
{
	var visible = scenelayer.visible;
	if(!visible) 
		return; // we are not going to work on invible
		
	var imageName = printUniquePNGName(scenelayer.name);
	printAssetPath("SCENEIMAGE",imageName+".png");
	
	scenelayer.name = imageName;

    
    scenePositionsString  += generatePositionsString(scenelayer,imageName);
	SceneImagesString += generateNewImageString(imageName,scenelayer);
	saveLayerAsImage(scenelayer,imageName);
	sceneInsertsString += generateInsertString(getCurrentGroupName(),imageName);
}

function HandleSceneGroup(scenegroup)
{
	var visible = scenegroup.visible;
	if(!visible) 
		return; // we are not going to work on invible
		
	//its either a subgroup, flat image or a button
	var isMerged = scenegroup.name.lastIndexOf ("_merge_");
	var isButton = scenegroup.name.lastIndexOf ("_button_");
	
	if(isButton != -1)
		HandleButtonSceneGroup(scenegroup);
	else if(isMerged != -1)
		HandleMergeSceneGroup(scenegroup);
	else
	{
		trace("SUBGROUP REMOVED"+groupStack[groupStack.length-1]);
		HandleSubGroup(scenegroup);
		groupStack.pop();
	}
	
	//var groupName = scenegroup.name;
	//trace("SCENEGROUP - "+groupName);
}

function HandleButtonSceneGroup(scenegroup)
{
	var isButton = scenegroup.name.lastIndexOf ("_button_");
	var groupName = scenegroup.name.substr(0,isButton);
	groupName = printUniquePNGName(groupName);

	printAssetPath("BUTTONGROUP",groupName);
	scenegroup.name= groupName+ "_button_";

	//collect the default and over layers 
	//then call buttonFunctionsString += generateUIButtonString
	
	var scenelayers = scenegroup.layers.length
	var defaultImageName = "";
	var touchImageName = "";
	
	while(scenelayers--)
	{
		var buttonLayer =  scenegroup.layers[scenelayers];
		var layerName = buttonLayer.name;
		var validName;
		if(layerName.lastIndexOf("_default_") !=-1)
		{
			validName = printUniquePNGName(layerName);
			
			saveLayerAsImage(buttonLayer,validName);
			
			defaultImageName = validName;
		}
		else 	if(layerName.lastIndexOf("_touch_")!=-1)
		{
			validName = printUniquePNGName(layerName);
			
			saveLayerAsImage(buttonLayer,validName);
			
			touchImageName = validName;
		
		}
	}

	if(defaultImageName.length > 0)
	{
		if(touchImageName.length == 0)
			touchImageName=defaultImageName;
			
		//create button
		sceneInsertsString += generateInsertString(getCurrentGroupName(),groupName);
		SceneImagesString += generateUIButtonString(scenegroup,groupName,defaultImageName,touchImageName);
		scenePositionsString  += generatePositionsString(scenegroup,groupName);
	}
}

function HandleMergeSceneGroup(scenegroup)
{
	var isMerged = scenegroup.name.lastIndexOf ("_merge_");
	var groupName = printUniquePNGName(scenegroup.name.substr(0,isMerged));
	printAssetPath("MERGEDGROUP ",groupName+".png");
	
	scenegroup.name = groupName+"_merge_";
    
    scenePositionsString  += generatePositionsString(scenegroup,groupName);
    SceneImagesString += generateNewImageString(groupName,scenegroup);

    
	saveLayerAsImage(scenegroup,groupName);
	
	
	sceneInsertsString += generateInsertString(getCurrentGroupName(),groupName);

}

function HandleSubGroup(scenegroup)
{
	var newGroupName = sanitiseString(scenegroup.name);
	sceneInsertsString += generateInsertString(getCurrentGroupName(),newGroupName);
	groupStack.push(newGroupName);
	
	trace("SUBGROUP INSERTED"+newGroupName);
	
	SceneGroupString += generateNewGroupString(newGroupName);

	HandleSceneGroupFolder(scenegroup);
}



//==============================================================================================================
// SUB STRING GENERATION FACTORIES - STACKED AND THEN SUBBED INTO FILE TEMPLATES 
//==============================================================================================================
function generateNewGroupString(groupName)
{
	return "local "+groupName+" = display.newGroup()\n";
}

function generateNewImageString(filename,sceneObj)
{
    var elWidth = getObjectWidth(sceneObj);
	var elHeight = getObjectHeight(sceneObj);
	
	elWidth = Math.min(elWidth,width+imagePaddingx2);
	elHeight= Math.min(elHeight,height+imagePaddingx2);
	elWidth= Math.max(elWidth,0);
	elHeight= Math.max(elHeight,0);
    
	return "local "+filename+" = display.newImageRect(\""+assetsFolder+filename+".png\","+elWidth+","+elHeight+");\n"
}

function generateListenerFunctionString(functionName)
{
	return "\
local function "+functionName+" ( event )\
	if event.phase == \"ended\" then\
		--director:changeScene(\"scenename\",\"transitiontype\")\
		print(\"touched "+functionName+"\")\
	end\
end\n\n";
}

function generatePositionsString(sceneObj,sceneObjName)
{
	// Gets element position
	var elX = getObjectLeft(sceneObj);
	var elY = getObjectTop(sceneObj);
	
	elX = Math.min(elX,width);
	elY= Math.min(elY,height);
	elX = Math.max(elX,0-imagePadding);
	elY= Math.max(elY,0-imagePadding);
	
	var elWidth = getObjectWidth(sceneObj);
	var elHeight = getObjectHeight(sceneObj);
	
	elWidth = Math.min(elWidth,width+imagePaddingx2);
	elHeight= Math.min(elHeight,height+imagePaddingx2);
	elWidth= Math.max(elWidth,0);
	elHeight= Math.max(elHeight,0);
	
	var xMid = Math.floor(elX) + (Math.floor(elWidth)/2);
	var yMid =  Math.floor(elY)+ (Math.floor(elHeight)/2); 
	
	
	
	return  "\
	-------------- "+sceneObjName+".png\
	"+sceneObjName+".x = "+Math.floor(xMid)+"\
	"+sceneObjName+".y = "+Math.floor(yMid)+"\
	-----------\
	\n";
}

function generateAddListener(objName,functionName)
{
		return objName+":addEventListener( \"touch\" , "+functionName+" )\n";
}

function generateUIButtonString(sceneObject,idName,defaultName,overName)
{

	var defaultStr = assetsFolder+defaultName+".png";
	var overStr = assetsFolder+overName+".png";
	var touchFunctionName = "onTouch_"+idName;
	
	//create the listener function too since we have all the code we need for it
	touchFunctionsString += generateListenerFunctionString(touchFunctionName);
	listenerFunctionsString += generateAddListener(idName,touchFunctionName);
	
return "\
--\
local "+idName+" = ui.newButton{\
			defaultSrc = \""+defaultStr+"\",\
			overSrc = \""+overStr+"\",\
			defaultX = "+getObjectWidth(sceneObject)+",\
			defaultY = "+getObjectHeight(sceneObject)+",\
			onEvent = "+touchFunctionName+",\
			overX = "+getObjectWidth(sceneObject)+",\
			overY = "+getObjectHeight(sceneObject)+",\
			id = \""+idName+"\"\
}\
--\n";
}	

//==============================================================================================================
//	FILE TEMPLATES FACTORIES director.lua and main.lua
//==============================================================================================================

//Main Lua when using Director class... 
//Need to replace $initScene with the first scene name
function mainLuaTemplate()
{
	
return "\
display.setStatusBar( display.HiddenStatusBar )\
\
---------------------------------------------------------------\
-- Import director class\
---------------------------------------------------------------\
\
director = require(\"director\")\
\
---------------------------------------------------------------\
-- Create a main group\
---------------------------------------------------------------\
\
local mainGroup = display.newGroup()\
\
---------------------------------------------------------------\
-- Main function\
---------------------------------------------------------------\
\
local function main()\
\
	-----------------------------------\
	-- Add the group from director class\
	-----------------------------------\
\
	mainGroup:insert(director.directorView)\
\
	-----------------------------------\
	-- Change scene without effects\
	-----------------------------------\
\
	director:changeScene(\"$initScene\")\
\
	-----------------------------------\
	-- Return\
	-----------------------------------\
\
	return true\
end\
\
---------------------------------------------------------------\
-- Begin\
---------------------------------------------------------------\
\
main()\
\
-- It's that easy! :-)\
";
}

//Scenes are morecomplicated
//$groups -body text with all groups found in a scene created a ready to be added too. Some are added to eachother in the init
//$width - width of the document
//$height - height of the document
//$displayObjects - all display obects found in scene- images buttons etc
//$listeners - any button listeners - auto generated from buttons found.
//$inserts - building a display heirachy of parent and children
//$positions - positioning the assets
//$addListeners - add listeners to buttons 
function sceneLuaTemplate()
{
return "\
\
module(..., package.seeall)\
\
---------------------------------------------------------------\
-- IMPORTS\
---------------------------------------------------------------\
\
local ui = require (\"ui\")\
\
---------------------------------------------------------------\
-- GROUPS\
---------------------------------------------------------------\
\
local localGroup = display.newGroup()\
$groups\
\
---------------------------------------------------------------\
-- DISPLAY OBJECTS\
---------------------------------------------------------------\
\
\
local background = display.newRect(0,0,$width,$height)\
$displayObjects\
\
---------------------------------------------------------------\
-- LISTENERS\
---------------------------------------------------------------\
\
$listeners\
\
---------------------------------------------------------------\
-- INIT VARS\
---------------------------------------------------------------\
\
local function initVars ()\
\
	-----------------------------------\
	-- Inserts\
	-----------------------------------\
	\
	localGroup:insert(background)\
	$inserts\
	\
	-----------------------------------\
	-- Positions\
	-----------------------------------\
	\
	$positions\
	\
	-----------------------------------\
	-- Colors\
	-----------------------------------\
	\
	background:setFillColor(0,0,0)\
	\
	-----------------------------------\
	-- Listeners\
	-----------------------------------\
	\
	$addListeners\
	\
end\
\
---------------------------------------------------------------\
-- CLEAN\
---------------------------------------------------------------\
\
function clean ( event )\
	print(\"cleaned\")\
end\
\
---------------------------------------------------------------\
-- NEW\
---------------------------------------------------------------\
\
function new()\
	\
	-----------------------------------\
	-- Initiate variables\
	-----------------------------------\
	\
	initVars()\
	\
	-----------------------------------\
	-- MUST return a display.newGroup()\
	-----------------------------------\
	\
	return localGroup\
	\
end\
\
\
";
}


function generateConfigLUAString(w,h)
{
return "\
application = \
{\
	content =\
	{\
		width = "+w+",\
		height ="+h+",\
		scale = \"zoomStretch\",\
		fps = 60\
	},\
}\
";
}


//==============================================================================================================
//HELPER FUNCTIONS
//==============================================================================================================
//trace like as3
function trace(text){$.writeln(text);}//for familiarity sake

//the assets display name
function printAssetPath(functionname,name)
{
	  var groupString = "";
	  for(j=1;j<groupStack.length;j++)
			groupString+=groupStack[j]+ "->";
	   trace(functionname+":"+currentScene+"->"+groupString+name);
}

//should be expanded if we find other characters that balls up the LUA naming...I just picked any  that came to mind.
//a better way is to create a regexp but I find that for now we should leave it open and readable for the average joe.  
function sanitiseString(string)
{
	string = string.replace ("(","");
	string = string.replace (")","");
	string = string.replace ("@","");
	string = string.replace ("!","");
	string = string.replace ("+","");
	string = string.replace ("-","");
	string = string.replace ("\\","");
	string = string.replace ("/","");
	string = string.replace ("[","");
	string = string.replace ("]","");
	string = string.replace (" ","");
	string = string.replace (";","");
	string = string.replace ("|","");
	string = string.replace ("\"","");
	string = string.replace ("'","");
	string = string.replace ("£","");
	string = string.replace ("$","");
	string = string.replace ("%","");
	string = string.replace ("^","");
	string = string.replace ("&","");
	string = string.replace ("*","");
	string = string.replace ("`","");
	string = string.replace ("#","");
	string = string.replace ("<","");
	string = string.replace (">","");
	return string;
}

//generates a filename for PNG/Layername name, remembers the names and recurses with an incremented name to 
//avoid duplicates 
function printUniquePNGName(name,increment)
{
	if(increment == null) increment = 0;
	var outName = name + ((increment>0)?"_"+increment+"_":"");

	//could use a reg exp for this but this is more like english for others to edit...
	outName = sanitiseString(outName);
	
	var allNames = exportedPNGS.join ("@");
	if(allNames.lastIndexOf (outName) == -1)
	{
		exportedPNGS.push (outName)
		return outName;
	}
	else
	{
		increment += 1;
		trace(increment);
		return printUniquePNGName(name,increment);
	}
}



//save a textfile 
function saveFile(fileName,fileContents)
{
	// Save main.lua
	// Verifies which kind of line feed
	if ($.os.search(/windows/i) != -1) {
		fileLineFeed = "Windows"
	} else {
		fileLineFeed = "Macintosh"
	}
	dire = dom.path //current application folder
	
	fileOut = new File(dire+"/"+exportFolder+fileName)
	fileOut.lineFeed = fileLineFeed
	fileOut.open("w", "TEXT", "????")
	fileOut.write(fileContents)
	fileOut.close()
	trace("Your file was saved at "+dire+"/"+exportFolder+fileName);
}

//helper to get the last name in the stack
function getCurrentGroupName()
{
	return groupStack[groupStack.length-1];
}

//trace helper - see console outputs
function generateInsertString(groupName,insert)
{
	return groupName+":insert("+insert+")\n\t";
}

//get object x
function getObjectLeft(sceneObj)
{
	return sceneObj.bounds[0].as("px") - imagePadding;
}

//get object y
function getObjectTop(sceneObj)
{
	return sceneObj.bounds[1].as("px") - imagePadding;
}

//get object width
function getObjectWidth(sceneObj)
{
	var elX = sceneObj.bounds[0].as("px");
	return sceneObj.bounds[2].as("px") - elX + imagePaddingx2;
}

//get height of an object
function getObjectHeight(sceneObj)
{
	var elY = sceneObj.bounds[1].as("px");
	return sceneObj.bounds[3].as("px") - elY + imagePaddingx2;
}

//saves the layer as an image by calling my saved scripts
function saveLayerAsImage(sceneObj,sceneObjName)
{
	var elX = getObjectLeft(sceneObj);
	var elY = getObjectTop(sceneObj);
	
	var elWidth = getObjectWidth(sceneObj);
	var elHeight = getObjectHeight(sceneObj);
	
	
	
	if((elWidth>0) && (elHeight>0))
	{
		//layer UID - during a save the app selects a layer by name... this caused the error if you had duplicate layers because it stops on first find.
		//Solution assign a temp UID to the layer while saving and put it back afterwards...
		var oldLayerName = sceneObj.name;
		sceneObj.name= new Date().getTime();
		trace("temp layer name is "+sceneObj.name);
	
		if(sceneObj.typename =="ArtLayer")
		{
			elWidth = Math.min(elWidth,width+imagePaddingx2);
			elHeight = Math.min(elHeight,height+imagePaddingx2);
			trace("CALLING SAVE PNG");
			savePNGLayer(sceneObj.name,elWidth,elHeight,nativePPI,dom.path+"/"+exportFolder+assetsFolder+sceneObjName+".png");
		}
		else
		{
			trace("Saving Merged Layer");
			elWidth = Math.min(elWidth,width+imagePaddingx2);
			elHeight = Math.min(elHeight,height+imagePaddingx2);
			sceneObj=sceneObj.merge();
			savePNGLayer(sceneObj.name,elWidth,elHeight,nativePPI,dom.path+"/"+exportFolder+assetsFolder+sceneObjName+".png");
			//mergeGroupAndSaveLayerAsPNG(sceneObj.name,elWidth,elHeight,nativePPI,dom.path+"/"+exportFolder+assetsFolder+sceneObjName+".png");

		}
	
		sceneObj.name = oldLayerName;
		
	}else
	{
		trace("WARNING : CANNOT SAVE EMPTY LAYERS "+sceneObjName);
	}
}


//generated ussing scriptlistener plugin... fugly but this was a complicated step and this made it easier...
//generated , tweaked and left
//example call savePNGLayer("a_1_",292,569,72,dom.path+"/"+"autoLayerName.png");
function savePNGLayer(layerName,ww,hh,ppi,pngFilename)
{
	if(!renderImages) return;
	
	var padding = imagePaddingx2;
	// ======================================================= select what its already selected
	var id329 = charIDToTypeID( "slct" );
		var desc53 = new ActionDescriptor();
		var id330 = charIDToTypeID( "null" );
			var ref20 = new ActionReference();
			var id331 = charIDToTypeID( "Lyr " );
			ref20.putName( id331, layerName );
		desc53.putReference( id330, ref20 );
		var id332 = charIDToTypeID( "MkVs" );
		desc53.putBoolean( id332, false );
	executeAction( id329, desc53, DialogModes.NO );

	

	// =======================================================
	var id264 = charIDToTypeID( "setd" );
		var desc43 = new ActionDescriptor();
		var id265 = charIDToTypeID( "null" );
			var ref16 = new ActionReference();
			var id266 = charIDToTypeID( "Chnl" );
			var id267 = charIDToTypeID( "fsel" );
			ref16.putProperty( id266, id267 );
		desc43.putReference( id265, ref16 );
		var id268 = charIDToTypeID( "T   " );
		var id269 = charIDToTypeID( "Ordn" );
		var id270 = charIDToTypeID( "None" );
		desc43.putEnumerated( id268, id269, id270 );
	executeAction( id264, desc43, DialogModes.NO );

	// =======================================================
	var id271 = charIDToTypeID( "setd" );
		var desc44 = new ActionDescriptor();
		var id272 = charIDToTypeID( "null" );
			var ref17 = new ActionReference();
			var id273 = charIDToTypeID( "Chnl" );
			var id274 = charIDToTypeID( "fsel" );
			ref17.putProperty( id273, id274 );
		desc44.putReference( id272, ref17 );
		var id275 = charIDToTypeID( "T   " );
		var id276 = charIDToTypeID( "Ordn" );
		var id277 = charIDToTypeID( "Al  " );
		desc44.putEnumerated( id275, id276, id277 );
	executeAction( id271, desc44, DialogModes.NO );

	// =======================================================
	var id278 = charIDToTypeID( "copy" );
	executeAction( id278, undefined, DialogModes.NO );

	// =======================================================
	var id279 = charIDToTypeID( "Mk  " );
		var desc45 = new ActionDescriptor();
		var id280 = charIDToTypeID( "Nw  " );
			var desc46 = new ActionDescriptor();
			var id281 = charIDToTypeID( "Md  " );
			var id282 = charIDToTypeID( "RGBM" );
			desc46.putClass( id281, id282 );
			var id283 = charIDToTypeID( "Wdth" );
			var id284 = charIDToTypeID( "#Rlt" );
			desc46.putUnitDouble( id283, id284, ww  - padding);
			var id285 = charIDToTypeID( "Hght" );
			var id286 = charIDToTypeID( "#Rlt" );
			desc46.putUnitDouble( id285, id286, hh - padding);
			var id287 = charIDToTypeID( "Rslt" );
			var id288 = charIDToTypeID( "#Rsl" );
			desc46.putUnitDouble( id287, id288, ppi );
			var id289 = stringIDToTypeID( "pixelScaleFactor" );
			desc46.putDouble( id289, 1.000000 );
			var id290 = charIDToTypeID( "Fl  " );
			var id291 = charIDToTypeID( "Fl  " );
			var id292 = charIDToTypeID( "Trns" );
			desc46.putEnumerated( id290, id291, id292 );
			var id293 = charIDToTypeID( "Dpth" );
			desc46.putInteger( id293, 8 );
			var id294 = stringIDToTypeID( "profile" );
			desc46.putString( id294, "sRGB IEC61966-2.1" );
		var id295 = charIDToTypeID( "Dcmn" );
		desc45.putObject( id280, id295, desc46 );
	executeAction( id279, desc45, DialogModes.NO );

	// =======================================================
	var id296 = charIDToTypeID( "past" );
		var desc47 = new ActionDescriptor();
		var id297 = charIDToTypeID( "AntA" );
		var id298 = charIDToTypeID( "Annt" );
		var id299 = charIDToTypeID( "Anno" );
		desc47.putEnumerated( id297, id298, id299 );
	executeAction( id296, desc47, DialogModes.NO );
	
	// =======================================================
	var id3324 = charIDToTypeID( "CnvS" );
		var desc384 = new ActionDescriptor();
		var id3325 = charIDToTypeID( "Rltv" );
		desc384.putBoolean( id3325, true );
		var id3326 = charIDToTypeID( "Wdth" );
		var id3327 = charIDToTypeID( "#Pxl" );
		desc384.putUnitDouble( id3326, id3327, padding);
		var id3328 = charIDToTypeID( "Hght" );
		var id3329 = charIDToTypeID( "#Pxl" );
		desc384.putUnitDouble( id3328, id3329, padding);
		var id3330 = charIDToTypeID( "Hrzn" );
		var id3331 = charIDToTypeID( "HrzL" );
		var id3332 = charIDToTypeID( "Cntr" );
		desc384.putEnumerated( id3330, id3331, id3332 );
		var id3333 = charIDToTypeID( "Vrtc" );
		var id3334 = charIDToTypeID( "VrtL" );
		var id3335 = charIDToTypeID( "Cntr" );
		desc384.putEnumerated( id3333, id3334, id3335 );
	executeAction( id3324, desc384, DialogModes.NO );

	// =======================================================
	var id300 = charIDToTypeID( "save" );
		var desc48 = new ActionDescriptor();
		var id301 = charIDToTypeID( "As  " );
			var desc49 = new ActionDescriptor();
			var id302 = charIDToTypeID( "PGIT" );
			var id303 = charIDToTypeID( "PGIT" );
			var id304 = charIDToTypeID( "PGIN" );
			desc49.putEnumerated( id302, id303, id304 );
			var id305 = charIDToTypeID( "PNGf" );
			var id306 = charIDToTypeID( "PNGf" );
			var id307 = charIDToTypeID( "PGAd" );
			desc49.putEnumerated( id305, id306, id307 );
		var id308 = charIDToTypeID( "PNGF" );
		desc48.putObject( id301, id308, desc49 );
		var id309 = charIDToTypeID( "In  " );
		desc48.putPath( id309, new File( pngFilename ) );
		var id310 = charIDToTypeID( "Cpy " );
		desc48.putBoolean( id310, true );
	executeAction( id300, desc48, DialogModes.NO );

    if(isWindows == true)
    {
        // =======================================================
        var id311 = charIDToTypeID( "Cls " );
            var desc50 = new ActionDescriptor();
            var id312 = charIDToTypeID( "Svng" );
            var id313 = charIDToTypeID( "YsN " );
            var id314 = charIDToTypeID( "N   " );
            desc50.putEnumerated( id312, id313, id314 );
        executeAction( id311, desc50, DialogModes.NO );
     }
    else
    {
        closeList.push(app.activeDocument);
        app.activeDocument = dom;
     }
    
    
}
