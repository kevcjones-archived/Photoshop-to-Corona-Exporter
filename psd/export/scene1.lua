

module(..., package.seeall)

---------------------------------------------------------------
-- IMPORTS
---------------------------------------------------------------

local ui = require ("ui")

---------------------------------------------------------------
-- GROUPS
---------------------------------------------------------------

local localGroup = display.newGroup()


---------------------------------------------------------------
-- DISPLAY OBJECTS
---------------------------------------------------------------


local background = display.newRect(0,0,480,320)
local backgroundimg = display.newImageRect("images/backgroundimg.png",482,322);
local title = display.newImageRect("images/title.png",370,17);
local textbody = display.newImageRect("images/textbody.png",273,231);

--
local test_1_ = ui.newButton{
			defaultSrc = "images/exampleBut_default_.png",
			overSrc = "images/exampleBut_touch_.png",
			defaultX = 148,
			defaultY = 37,
			onEvent = onTouch_test_1_,
			overX = 148,
			overY = 37,
			id = "test_1_"
}
--


---------------------------------------------------------------
-- LISTENERS
---------------------------------------------------------------


local function onTouch_test_1_ ( event )
	if event.phase == "ended" then
		--director:changeScene("scenename","transitiontype")
		print("touched onTouch_test_1_")
	end
end



---------------------------------------------------------------
-- INIT VARS
---------------------------------------------------------------

local function initVars ()

	-----------------------------------
	-- Inserts
	-----------------------------------
	
	localGroup:insert(background)
	localGroup:insert(backgroundimg)
	localGroup:insert(title)
	localGroup:insert(textbody)
	localGroup:insert(test_1_)
	
	
	-----------------------------------
	-- Positions
	-----------------------------------
	
	
	-------------- backgroundimg.png
	backgroundimg.x = 240
	backgroundimg.y = 160
	-----------
	

	-------------- title.png
	title.x = 205
	title.y = 36
	-----------
	

	-------------- textbody.png
	textbody.x = 155
	textbody.y = 172
	-----------
	

	-------------- test_1_.png
	test_1_.x = 387
	test_1_.y = 279
	-----------
	

	
	-----------------------------------
	-- Colors
	-----------------------------------
	
	background:setFillColor(0,0,0)
	
	-----------------------------------
	-- Listeners
	-----------------------------------
	
	test_1_:addEventListener( "touch" , onTouch_test_1_ )

	
end

---------------------------------------------------------------
-- CLEAN
---------------------------------------------------------------

function clean ( event )
	print("cleaned")
end

---------------------------------------------------------------
-- NEW
---------------------------------------------------------------

function new()
	
	-----------------------------------
	-- Initiate variables
	-----------------------------------
	
	initVars()
	
	-----------------------------------
	-- MUST return a display.newGroup()
	-----------------------------------
	
	return localGroup
	
end


