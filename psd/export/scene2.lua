

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
local Layer1 = display.newImageRect("images/Layer1.png",482,322);

--
local test_2_ = ui.newButton{
			defaultSrc = "images/exampleBut_default__1_.png",
			overSrc = "images/exampleBut_touch__1_.png",
			defaultX = 148,
			defaultY = 37,
			onEvent = onTouch_test_2_,
			overX = 148,
			overY = 37,
			id = "test_2_"
}
--


---------------------------------------------------------------
-- LISTENERS
---------------------------------------------------------------


local function onTouch_test_2_ ( event )
	if event.phase == "ended" then
		--director:changeScene("scenename","transitiontype")
		print("touched onTouch_test_2_")
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
	localGroup:insert(Layer1)
	localGroup:insert(test_2_)
	
	
	-----------------------------------
	-- Positions
	-----------------------------------
	
	
	-------------- Layer1.png
	Layer1.x = 240
	Layer1.y = 160
	-----------
	

	-------------- test_2_.png
	test_2_.x = 387
	test_2_.y = 279
	-----------
	

	
	-----------------------------------
	-- Colors
	-----------------------------------
	
	background:setFillColor(0,0,0)
	
	-----------------------------------
	-- Listeners
	-----------------------------------
	
	test_2_:addEventListener( "touch" , onTouch_test_2_ )

	
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


