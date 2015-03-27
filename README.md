# chip8.js

a Javascript implementation of the [CHIP-8](http://en.wikipedia.org/wiki/CHIP-8) virtual machine.

## Install

    npm install jffjs/chip8.js

## Usage

Start a browser-based emulator:


```html
<html>
    <head>
        <script src="main.js"></script>
    </head>
    <body>
        <canvas id="emu-canvas" width="640" height="320"></canvas>
    </body>
</html>
```

```javascript
window.onload = function() {
  var Chip8 = require('chip8.js'),
      romBuffer = new Uint8Array(/* ROM data... */),
      emulator = new Chip8.emulator('emu-canvas', romBuffer);
  emulator.run();
}
```

## Run Example

    npm start

## Run Tests

    npm test

or to run tests in browser:

    npm run karma


## Acknowledgements

* [Tutorial that got me started] (http://www.multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/)
* Example CHIP-8 ROMs are from the [CHIP-8 Program Pack](http://www.chip8.com/?page=109) by [Revival Studios](http://www.revival-studios.com/)

### License MIT
