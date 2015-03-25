var fontSet = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
]);

/**
 * CHIP-8 Emulator
 * @constructor
 */
function Chip8() {
  this.opcode     = 0;                    // 2 bytes
  this.I          = 0;                    // Index register 
  this.pc         = 0;                    // program counter
  this.delayTimer = 0;
  this.soundTimer = 0;
  this.sp         = 0;                    // stack pointer
  this.memory     = new Uint8Array(4096); // 4K memory
  this.stack      = new Uint16Array(16);
  this.V          = new Uint8Array(16);   // general purpose registers
  this.key        = new Uint8Array(16);   // keypad
  this.gfx        = new Array(64);        // 64 x 32

  for(i = 0; i < this.gfx.length; i++) {
    this.gfx[i] = new Uint8Array(32);
  }

  this.initialize = function() {
    this.pc     = 0x200;  // Program counter starts at 0x200
    this.opcode = 0;      // Reset current opcode	
    this.I      = 0;      // Reset index register
    this.sp     = 0;      // Reset stack pointer

    // Load font set
    for (var i = 0; i < 80; i++) {
      this.memory[i] = fontSet[i];
    }

    // Reset timers
    this.delayTimer = 0;
    this.soundTimer = 0;
  };

  /**
   * Loads buffer into memory
   * @param {Uint8Array} buffer - binary data to be loaded into memory
   */
  this.load = function(buffer) {
    this.initialize();

    for(var i = 0; i < buffer.byteLength; i++) {
      this.memory[i + 512] = buffer[i];
    }
    
  };

  this.draw = function() {
    
  };

  this.setKeys = function() {
    
  };

  this.emulateCycle = function() {
    // Fetch opcode
    this.opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];

    // Decode and execute opcode
    switch (this.opcode & 0xF000) {
      case 0x0000: 
        switch (this.opcode & 0x000F) {
          case 0x0000: // 00E0: Clears the screen
            // TODO
            break;
          case 0x000E: // 00EE: Returns from subroutine
            // TODO
            break;
          default:
            console.error("Unknown opcode: " + this.opcode);
        }
        break;
      case 0xA000: // ANNN: Sets I to the address NNN
        this.I = this.opcode & 0x0FFF;
        this.pc += 2;
        break;
      default:
        console.error("Unknown opcode: " + this.opcode);
        
    }
    
    // Update timers
    if (this.delayTimer > 0) {
      --this.delayTimer;
    }

    if (this.soundTimer > 0) {
      if (this.soundTimer === 1) {
        console.log('BEEP!');
      }
      --this.soundTimer;
    }
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

