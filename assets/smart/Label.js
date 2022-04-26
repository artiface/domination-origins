var image = {
	render: function (ctx, entity) {
        ctx.save();
        var text,
            mx,
            my,
            textMeasurement;

        // Re-scale the context to ensure that output is always 1:1
        ctx.scale(1, 1);
        let options = entity.getLabelOptions();
        // Work out the re-scale mouse position
        mx = options.offsetX || 0;
        my = options.offsetY || 0;// -70;
        let fontSize = options.fontSize || 20;
        let fontFamily = options.fontFamily || 'Arial';
        let fontColor = options.fontColor || '#fff';
        ctx.font = fontSize + 'px ' + fontFamily;
        text = options.text;

        let measureList = text.map(x => ctx.measureText(x).width);
        ctx.fillStyle = '#000';
        let longestWidth = measureList.reduce(function (a, b) {
            return a > b ? a : b;
        });
        let padding = 6;
        let lineWidth = Math.floor(longestWidth + padding * 2);
        let halfLineWidth = Math.floor(lineWidth / 2);
        let lineHeight = fontSize + padding;
        let contentHeight = lineHeight * text.length;

        ctx.fillRect(mx - halfLineWidth, my - contentHeight + lineHeight, lineWidth, contentHeight);
        ctx.fillStyle = fontColor;


        let startY = my;
        if (text.length > 1) {
            startY = my - contentHeight + (fontSize * 2) + padding;
        }
        for (let i = 0; i < text.length; i++) {
            let nextY = startY + (lineHeight * i);
            ctx.fillText(text[i], mx - halfLineWidth + padding, nextY);
        }
        ctx.restore();
	}
};