var Chip8 = require('./chip8');

function Emulator(canvas, rom) {
  this.canvas = document.getElementById(canvas);
  this.chip8 = new Chip8();

  this.draw = function() {
    var ctx = this.canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 640, 320);

    ctx.fillStyle = "#FFF";
    for (var y = 0; y < 32; y++) {
      for (var x = 0; x < 64; x++) {
        if (this.chip8.gfx[x + (y * 64)]) {
          ctx.fillRect(x * 10, y * 10, 10, 10);
        }
      }
    }
  };

  this.run = function() {
    var chip8 = this.chip8;
    chip8.load(rom);

    var loop = function() {
      for(var i = 0; i < 20; i++) {
        if (this._stop) {
          break;
        }
        chip8.drawFlag = false;
        chip8.emulateCycle();

        if (chip8.drawFlag) {
          this.draw();
        }
      }

      // Update timers
      if (chip8.delayTimer > 0) {
        --chip8.delayTimer;
      }

      if (chip8.soundTimer > 0) {
        if (chip8.soundTimer === 1) {
          console.log('BEEP!');
        }
        --chip8.soundTimer;
      }
      if (!this._stop) {
        window.requestAnimationFrame(loop);
      }
    }.bind(this);

    window.requestAnimationFrame(loop);
  };

  this.stop = function() {
    this._stop = true;
  };

  var keyListener = function(toggle) {
    var keyMap = {
      49: 1,   50: 2,   51: 3,   52: 0xC,  // 1 2 3 4
      81: 4,   87: 5,   69: 6,   82: 0xD,  // Q W E R
      65: 7,   83: 8,   68: 9,   70: 0xE,  // A S D F
      90: 0xA, 88: 0,   67: 0xB, 86: 0xF   // Z X C V
    };
    
    return function(e) {
      var k = keyMap[e.which];
      if (k) {
        this.chip8.key[k] = toggle;
      }
    }.bind(this);

  }.bind(this);

  document.onkeydown = keyListener(1);
  document.onkeyup = keyListener(0);
}

module.exports = Emulator;
