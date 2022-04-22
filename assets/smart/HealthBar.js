var image = {
	render: function (ctx, entity) {
        const char = entity._character;
        const drawOffsetY = -60;
        const height = 10;
        const health = entity.getHealthAsPercent(); // [0,0..1,0]
        const width = char._bounds2d.x;
        const leftWidth = width * health;
        const rightWidth = width - leftWidth;


        ctx.fillStyle = '#f00';
		// Move to top-left of the entity draw space
		ctx.translate(-char._bounds2d.x2, -char._bounds2d.y2 + drawOffsetY);

		// Draw a rectangle
		ctx.fillRect(0, 0, leftWidth, height);

		ctx.fillStyle = '#000';
        ctx.fillRect(leftWidth, 0, rightWidth, height);

	}
};