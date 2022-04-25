var image = {
	render: function (ctx, entity) {
        const char = entity._character;
        const drawOffsetY = -54;
        const height = 6;
        const health = entity.getHealthAsPercent(); // [0,0..1,0]
        const width = char._bounds2d.x;
        const leftWidth = width * health;
        const rightWidth = width - leftWidth;
        let leftColor = '#56cf00';
        if (health < 0.75 && health > 0.5) {
            leftColor = '#cfc800';
        }
        else if (health < 0.5 && health > 0.25) {
            leftColor = '#cf6700';
        }
        else if (health <= 0.25) {
            leftColor = '#cf0e00';
        }

		// Move to top-left of the entity draw space
		ctx.translate(-char._bounds2d.x2, -char._bounds2d.y2 + drawOffsetY);

		ctx.fillStyle = '#000';
		ctx.fillRect(-1, -1, width + 2, height + 2);

        ctx.fillStyle = leftColor;
        ctx.fillRect(0, 0, leftWidth, height);
	}
};