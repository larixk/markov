/* global jQuery, dat, Front, Markov */

(function ($, container) {
    'use strict';

    var src = 'img/test.jpg',

        markov,

        startTime,       // For performance measurement

        front,           // Pixels to be drawn

        width,           // Canvas width
        height,          // Canvas height
        $canvas,         // jQuery canvas object
        $container,      // jQuery parent of canvas object
        img,             // HTML img with our source
        ctx,             // 2d canvas context
        running = false, // Is the interval running for iterations?
        drawing = false, // Is the requestAnimationFrame running for draws?

        gui,             // Controls

        bitmap,          // ImageData object
        bitmapData,      // R's, G's, B's and A's for every X and Y

        config = {
            colorCompression: 1,
            speed: 500,
            depthFirst:  0.99,
            width: 800,
            height: 600,
            srcSize: 256,
            startX: 0.5,
            startY: 0.5,
            restart: function() {
                try {
                    restart();
                } catch (e) {

                }
            }
        };

    // Copy the latest bitmap to the canvas every frame
    function draw() {
        if (drawing) {
            window.requestAnimFrame(draw);
            ctx.putImageData(bitmap, 0, 0);
            drawing = running;
        }
    }

    // Change the color of a pixel in a bitmap with alpha blending
    function setPixel(pixel, color) {
        var index = (pixel.x + width * pixel.y) * 4;

        // Linear interpolation with a
        bitmapData[index]     = color.r;
        bitmapData[index + 1] = color.g;
        bitmapData[index + 2] = color.b;
        bitmapData[index + 3] = 255;
        return true;
    }

    function queueNeighbours(pixel, color) {
        var pixelDs = [
                {x: -1, y: 0},
                {x: 1, y: 0},
                {x: 0, y: 1},
                {x: 0, y: -1}
            ],
            pixelD,
            randomIndex,
            randomNeighbour;
        while (pixelDs.length) {
            randomNeighbour = markov.getNeighbour(color);
            randomIndex = Math.floor(pixelDs.length * Math.random());
            pixelD = pixelDs.splice(randomIndex, 1)[0];
            front.add({
                pixel: {x: pixel.x + pixelD.x, y: pixel.y + pixelD.y},
                color: randomNeighbour
            });
        }
    }

    // Do a single iteration
    function iterate() {
        for (var i = 0; i < config.speed; i += 1) {
            if (!front.getLength()) {
                return false;
            }
            var frontItem = front.get(),
                color = frontItem.color;
            setPixel(frontItem.pixel, color);
            queueNeighbours(frontItem.pixel, color);
        }
        return true;
    }

    function loop() {
        if (!running) {
            return;
        }
        if (!iterate()) {
            stop();
            return;
        }

        // Repeat immediately
        setTimeout(loop, 0);

        //window.setImmediate(loop);
    }

    // We are done for now
    function stop() {
        running = false;
    }

    // Start drawing, start moving
    function start() {
        startTime = new Date().getTime();

        running = true;
        drawing = true;

        front.add({
            pixel: {
                x: Math.min(width - 1, Math.round(width * config.startX)),
                y: Math.min(height - 1, Math.round(height * config.startY))
            },
            color: markov.getRandomColor()
        });
        loop();
        draw();
    }

    function reset() {
        front = new Front(config);

        // How big is the image?
        width  = config.width;
        height = config.height;

        // Fill the container
        $canvas.css('width', width)
            .css('height', height)
            .attr('width', width)
            .attr('height', height);

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);
        bitmap = ctx.getImageData(0, 0, width, height);
        bitmapData = bitmap.data;
    }

    function restart() {
        stop();
        reset();
        start();
    }

    // Stretch the canvas to fit the container and restart the magic
    function reload() {
        stop();

        // Place the image
        img = new Image();
        img.onload = imageReady;
        img.src = src;
    }

    // When image data is loaded
    function imageReady() {
        var $srcCanvas,
            srcCtx,
            srcData;

        reset();

        // Get the image data by painting it to a canvas
        var srcWidth = Math.min(config.srcSize, img.width);
        var srcHeight = Math.min(config.srcSize, img.height);

        $srcCanvas = $('<canvas style="display: none" />')
            .css('width', srcWidth)
            .css('height', srcHeight)
            .attr('width', srcWidth)
            .attr('height', srcHeight);
        $container.append($srcCanvas);

        srcCtx = $srcCanvas[0].getContext('2d');
        srcCtx.drawImage(img, 0, 0, srcWidth, srcHeight);
        srcData = srcCtx
            .getImageData(0, 0, srcWidth, srcHeight)
            .data;

        // Create a 2d markov chain
        markov = new Markov(srcData, {
            srcHeight: srcHeight,
            srcWidth: srcWidth,
            colorCompression: config.colorCompression
        });

        // Clean up
        $srcCanvas.remove();

        // Start walking
        start();
    }

    // Dropping occured
    function fileDropped(e) {
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();

        var files = e.originalEvent.dataTransfer.files, // FileList object
            reader;
        if (!(files && files.length)) {
            return;
        }

        reader = new FileReader();
        reader.onload = function (e) {
            src = e.target.result;
            reload();
        };
        reader.readAsDataURL(files[0]);
    }

    // Prepare to allow droppings
    function initFileDrop($dropZone) {
        $dropZone
            .bind('dragover', false)
            .bind('dragenter', false)
            .bind('drop', fileDropped);
    }

    // Open canvas as img
    function clicked() {
        open().document.write('<img src="' + $canvas[0].toDataURL() + '"/>');
    }

    // Adds controls
    function addDatGui() {
        gui = new dat.GUI();
        gui.close();

        gui.add(config, 'restart');
        gui.add(config, 'depthFirst', -1, 1)
            .step(0.01);
        gui.add(config, 'speed', 0, 1024)
            .step(0.01);
        gui.add(config, 'colorCompression', 1, 255)
            .step(1)
            .onFinishChange(imageReady);
        gui.add(config, 'width', 16, 1920)
            .step(1)
            .onFinishChange(restart);
        gui.add(config, 'height', 16, 1080)
            .step(1)
            .onFinishChange(restart);
        gui.add(config, 'startX', 0, 1)
            .step(0.01);
        gui.add(config, 'startY', 0, 1)
            .step(0.01);

        $('#controls').on('click', function () {
            gui.open();
            return false;
        });
    }

    function init() {
        // Create the canvas
        $canvas = $('<canvas />').click(clicked);
        $container = $(container).append($canvas);
        ctx = $canvas[0].getContext('2d');

        addDatGui();

        // Allow dropping files
        initFileDrop($('html'));

        // Now: reload()
        reload();
    }

    // Leggo!
    $(init);
}(jQuery, '#photo', '#busy'));
