var image = {
	render: function (ctx, entity) {
        const char = entity._entity;
        const drawOffsetY = -61;
        const height = 6;
        const health = entity.getFocusAsPercent(); // [0,0..1,0]
        const width = char._bounds2d.x;
        const leftWidth = width * health;
        const rightWidth = width - leftWidth;
        const leftColor = '#03fcf8';
		// Move to top-left of the entity draw space
		ctx.translate(-char._bounds2d.x2, -char._bounds2d.y2 + drawOffsetY);

		ctx.fillStyle = '#000';
		ctx.fillRect(-1, -1, width + 2, height + 1);

        ctx.fillStyle = leftColor;
        ctx.fillRect(0, 0, leftWidth, height);
	}
};