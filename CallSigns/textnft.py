import os

def annotateImage(sourceImageFilename, text):
	width = 240
	height = 180
	backgroundColor = 'white'
	fontSize = 290
	font = 'Verdana'
	fontColor = 'silver'
	destImageFilename = 'output.png'
	command = 'convert -pointsize %s -font %s -fill %s -gravity center -stroke "#000C" -strokewidth 2 -annotate 0 "%s" %s %s' % (
			fontSize,
			font,
			fontColor,
			text,
			sourceImageFilename,
			destImageFilename
		)
	os.system(command)

annotateImage('image_29537456.jpg', 'Grasshopper')