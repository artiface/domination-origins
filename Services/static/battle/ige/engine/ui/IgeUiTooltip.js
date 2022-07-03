/**
 * Provides a UI tooltip. Change properties (textBox, fonts, backgroundcolor)
 * at free will.
 */
var IgeUiTooltip = IgeUiElement.extend({
	classId: 'IgeUiTooltip',

	/**
	 * @constructor
	 * @param width Width of the tooltip
	 * @param height Height of the tooltip
	 * @param content The content which is set with public method "setContent". Can be string, array(2) or an entity
	 */
	init: function (parent, width, height, content) {
		IgeUiElement.prototype.init.call(this);
        const titleHeight = 20;
		var self = this;
		this.titleBox = new IgeUiElement()
			.left(0)
			.top(0)
			.width(width)
			.height(titleHeight)
			.mount(this);
		this.titleBox.borderBottomColor('#ffffff');
		this.titleBox.borderBottomWidth(1);
		
		this.textBox = new IgeUiElement()
			.left(0)
			.top(titleHeight)
			.width(width)
			.height(height - titleHeight)
			.mount(this);
		
		this.fontEntityTitle = new IgeFontEntity()
			.left(5)
			.top(5)
			.textAlignX(0)
			.textAlignY(0)
			.colorOverlay('#ffffff')
			.nativeFont('10pt Arial')
			.textLineSpacing(15)
			.mount(this.titleBox);
			
		this.fontEntityText = new IgeFontEntity()
			.left(5)
			.top(5)
			.height(height - titleHeight)
			.textAlignX(0)
			.textAlignY(0)
			.colorOverlay('#ffffff')
			.nativeFont('10pt Arial')
			.textLineSpacing(15)
			.mount(this.textBox);
			
		this.setContent(content);
		this.hide();

		this.mount(parent);
		this.backgroundColor('#000000');
		this.depth(10000);
		this.width(width);
		this.height(height);
		
		parent._tooltip = this;

		this.translateTo(0, -90, 0);

		return this;
	},

	/**
	 * Extended method to auto-update the width of the child
	 * font entity automatically to fill the text box.
	 * @param px
	 * @param lockAspect
	 * @param modifier
	 * @param noUpdate
	 * @return {*}
	 */
	width: function (px, lockAspect, modifier, noUpdate) {
		var val;

		// Call the main super class method
		val = IgeUiElement.prototype.width.call(this, px, lockAspect, modifier, noUpdate);

		// Update the font entity width
		this.fontEntityTitle.width(px, lockAspect, modifier, noUpdate);
		this.fontEntityText.width(px, lockAspect, modifier, noUpdate);

		return val;
	},

	/**
	 * Extended method to auto-update the height of the child
	 * font entity automatically to fill the text box.
	 * @param px
	 * @param lockAspect
	 * @param modifier
	 * @param noUpdate
	 * @return {*}
	 */
	height: function (px, lockAspect, modifier, noUpdate) {
		var val;

		// Call the main super class method
		val = IgeUiElement.prototype.height.call(this, px, lockAspect, modifier, noUpdate);

		// Update the font entity height
		this.fontEntityTitle.width(px, lockAspect, modifier, noUpdate);
		this.fontEntityText.width(px, lockAspect, modifier, noUpdate);

		return val;
	},

	/**
	 * Sets the content of the tooltip. Can be a string for
	 * simple text, an array with two strings for text and title
	 * or a whole entity
	 * @param val The content, be it string, array(2) or an entity
	 * @return {*}
	 */
	setContent: function (val) {
		if (val !== undefined) {
			/*
			this.titleBox.unMount();
			this.textBox.unMount();
			this._children.forEach(function(child) {
				child.unMount();
				child.destroy();
			});
			*/
			if (typeof(val) == 'object' && typeof(val[0] == 'string') && typeof(val[1] == 'string')) {
				const totalHeight = this._bounds2d.y;
				const titleHeight = 30;
				const textHeight = totalHeight - titleHeight;
                /*
				this.titleBox.mount(this);
				this.textBox.mount(this);
                */
				/*this.titleBox.height(titleHeight);
				this.textBox.height(textHeight);
				this.titleBox.top(0);
				this.textBox.top(this.titleBox._bounds2d.y);
                */
				//title + text
				this.fontEntityTitle.text(val[0]);
				this.fontEntityText.text(val[1]);
			}
			else if (typeof(val) == 'object') {
				val.mount(this);
			}
			this.updateUiChildren();
		}

		return this;
	},
});