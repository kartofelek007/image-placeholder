const htmlColors = require("./html-colors.js");

function checkColor(text, defaultValue) {
    if (/^[abcdef0-9]{6}$/i.test(text)) {
        return '#' + text;
    }
    if (/^[abcdef0-9]{3}$/i.test(text)) {
        return '#' + text;
    }
    if (/^.+$/.test(text) && htmlColors.includes(text)) {
        return text;
    }

    return defaultValue;
}

function colorBrightness(color) {
    const c = color.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateFontSize(ctx) {
    let size = 30;
    if (ctx.canvas.width < 150) {
        size = 20
    }
    if (ctx.canvas.width < 100) {
        size = 10
    }
    if (ctx.canvas.width < 50) {
        size = 7
    }
    if (ctx.canvas.height < 50) {
        size = 20;
    }
    return size
}

module.exports.checkColor = checkColor;
module.exports.colorBrightness = colorBrightness;
module.exports.calculateFontSize = calculateFontSize;
