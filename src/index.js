(function() {
  function Chip8() {
    this.opcode     = 0;               // 2 bytes
    this.I          = 0;               // Index register 
    this.pc         = 0;               // program counter
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.sp         = 0;               // stack pointer
    this.memory     = new Array(4096); // 4K memory
    this.stack      = new Array(16);
    this.V          = new Array(16);   // general purpose registers
    this.key        = new Array(16);   // keypad
    this.gfx        = new Array(64);   // 64 x 32

    function clearRegisters() {
      var i;
      for(i = 0; i < this.gfx.length; i++) {
        this.gfx[i] = new Array(32);
        for(var j = 0; j < this.gfx[i].length; j++) {
          this.gfx[i][j] = 0;
        }
      }

      for(i = 0; i < this.memory.length; i++) {
        this.memory[i] = 0;
      }

      for(i = 0; i < 16; i++) {
        this.stack[i] = 0;
        this.V[i] = 0;
        this.key[i] = 0;
      }
    }

    this.initialize = function() {
      this.pc     = 0x200;  // Program counter starts at 0x200
      this.opcode = 0;      // Reset current opcode	
      this.I      = 0;      // Reset index register
      this.sp     = 0;      // Reset stack pointer
      clearRegisters();

      // Load font set
    };

    this.load = function() {
      
    };

    this.draw = function() {
      
    };

    this.setKeys = function() {
      
    };

    this.emulateCycle = function() {
      // Fetch opcode
      // Decode opcode
      // Execute opcode
      
      // Update timers
    };

    this.run = function() {
      var drawFlag = false;
      var loop = function() {
        for(var i = 0; i < 10; i++) {
          this.emulateCycle();

          if (drawFlag) {
            this.draw();
          }

          this.setKeys();
        }
        window.requestAnimationFrame(loop);
      }.bind(this);

      window.requestAnimationFrame(loop);
    };
  }

  return new Chip8();
})();
