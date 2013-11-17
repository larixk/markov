function Front(config) {
    'use strict';
    var keys = [],
        values = [];
    return {
        add: function (element) {
            var key = '' + element.pixel.x + ',' + element.pixel.y;
            if (
                element.pixel.x < 0 ||
                element.pixel.y < 0 ||
                element.pixel.x >= config.width ||
                element.pixel.y >= config.height ||
                keys[key] === true) {
                return false;
            }
            values.push(element);
            keys[key] = true;
            return true;
        },
        get: function () {
            if (values.length < 1) {
                return;
            }

            var randomness = config.depthFirst,
                base = Math.max(0, randomness),
                scale = 1 - Math.abs(randomness),
                index = (scale * Math.random() + base) * values.length;
            index = Math.min(values.length - 1, Math.floor(index));
            return values.splice(index, 1)[0];
        },
        getLength: function () {
            return values.length;
        }
    };
}
