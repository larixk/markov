// Creates a model of the connection between bordering pixel colors
function Markov(data, config) {
    'use strict';
    function createKey(color) {
        return color.r + ',' + color.g + ',' + color.b;
    }
    function addNeighbour(key, color) {
        if (typeof model[key] === 'undefined') {
            model[key] = [];
        }
        color.r = round(color.r);
        color.g = round(color.g);
        color.b = round(color.b);
        model[key].push(color);
    }
    function round(value) {
        var rounding = config.colorCompression;
        return Math.round(value / rounding) * rounding;
    }
    function processPixel(pixel, width, height) {
        var x = pixel.x,
            y = pixel.y,
            index = (y * config.srcWidth + x) * 4,
            pixelRGB = {
                r: round(data[index]),
                g: round(data[index + 1]),
                b: round(data[index + 2])
            },
            key = createKey(pixelRGB),
            pixelDs = [
                {x: -1, y: 0},
                {x: 1, y: 0},
                {x: 0, y: 1},
                {x: 0, y: -1}
            ],
            pixelD,
            neighbourIndex;
        while (pixelDs.length) {
            pixelD = pixelDs.pop();
            if (x + pixelD.x  < 0 ||
                x + pixelD.x >= width ||
                y + pixelD.y  < 0 ||
                y + pixelD.y >= height) {
                continue;
            }
            neighbourIndex = index + (pixelD.x + pixelD.y * width) * 4;
            addNeighbour(key, {
                r: data[neighbourIndex],
                g: data[neighbourIndex + 1],
                b: data[neighbourIndex + 2]
            });
        }
    }
    function create() {
        var width = config.srcWidth,
            height = config.srcHeight,
            x, y;
        for (y = 0; y < height; y += 1) {
            for (x = 0; x < width; x += 1) {
                processPixel({x: x, y: y}, width, height);
            }
        }

    }
    var model = {};
    create();

    return {
        // Get a single completely random color that exists in the model
        getRandomColor: function () {
            var keys = Object.keys(model),
                randomKey = keys[Math.floor(Math.random() * keys.length)];
            randomKey = randomKey.split(',');
            return {
                r: randomKey[0],
                g: randomKey[1],
                b: randomKey[2]
            };
        },
        // Get a random color bordering the input color in the original image
        getNeighbour: function (color) {
            var neighbours = model[createKey(color)];
            return neighbours[Math.floor(Math.random() * neighbours.length)];
        }
    };
}
