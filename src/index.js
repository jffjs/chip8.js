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
  var maxStack = 16;
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
    var opcode = this.opcode;
    switch (opcode & 0xF000) {
      case 0x0000: 
        switch (opcode & 0x000F) {
          case 0x0000: // 00E0: Clears the screen
            // TODO
            break;

          case 0x000E: // 00EE: Returns from subroutine
            if (this.sp > 0) this.sp--;
            this.pc = this.stack[this.sp] + 2;
            break;

          default:
            console.error("Unknown opcode: " + opcode);
        }
        break;

      case 0x1000: // 1NNN: Jumps to address at NNN
        this.pc = opcode & 0x0FFF;
        break;

      case 0x2000: // 2NNN: Calls subroutine at NNN
        if (this.sp === maxStack) {
          console.error('Stack limit exceeded!');
          return;
        }
        this.stack[this.sp] = this.pc;
        this.sp++;
        this.pc = opcode & 0x0FFF;
        break;

      case 0x3000: // 3XNN: Skips the next instruction if VX equals NN
        if (this.V[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF)) {
          this.pc += 4;
        } else {
          this.pc += 2;
        }
        break;

      case 0x4000: // 4XNN: Skips the next instruction if VX does not equal NN
        if (this.V[(opcode & 0x0F00) >> 8] !== (opcode & 0x00FF)) {
          this.pc += 4;
        } else {
          this.pc += 2;
        }
        break;

      case 0x5000: // 5XY0: Skips the next instruction if VX equals VY
        if (this.V[(opcode & 0x0F00) >> 8] === this.V[(opcode & 0x00F0) >> 4]) {
          this.pc += 4;
        } else {
          this.pc += 2;
        }
        break;

      case 0x6000: // 6XNN: Sets VX to NN
        this.V[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
        this.pc += 2;
        break;

      case 0x7000: // 7XNN: Adds NN to VX
        // TODO: should carry flag be set here?
        if (this.V[(opcode & 0x0F00) >> 8] + (opcode & 0x00FF) > 0xFF) {
          this.V[0xF] = 1;
        } else {
          this.V[0xF] = 0;
        }

        this.V[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
        this.pc +=2;
        break;
        
      case 0x8000:
        switch (opcode & 0x000F) {
          case 0x0000: // 8XY0: Sets VX to the value of VY.
            this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x00F0) >> 4];
            this.pc +=2;
            break;

          case 0x0001: // 8XY1: Sets VX to VX OR VY.
            this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x0F00) >> 8] | this.V[(opcode & 0x00F0) >> 4];
            this.pc +=2;
            break;

          case 0x0002: // 8XY2: Sets VX to VX AND VY.
            this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x0F00) >> 8] & this.V[(opcode & 0x00F0) >> 4];
            this.pc +=2;
            break;

          case 0x0003: // 8XY3: Sets VX to VX XOR VY.
            this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x0F00) >> 8] ^ this.V[(opcode & 0x00F0) >> 4];
            this.pc +=2;
            break;

          case 0x0004: // 8XY4: Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
            if (this.V[(opcode & 0x0F00) >> 8] + this.V[(opcode & 0x00F0) >> 4] > 0xFF) {
              this.V[0xF] = 1;
            } else {
              this.V[0xF] = 0;
            }
            this.V[(opcode & 0x0F00) >> 8] += this.V[(opcode & 0x00F0) >> 4];
            this.pc +=2;
            break;

          case 0x0005: // 8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
            if (this.V[(opcode & 0x0F00) >> 8] - this.V[(opcode & 0x00F0) >> 4] < 0) {
              this.V[0xF] = 1;
            } else {
              this.V[0xF] = 0;
            }
            this.V[(opcode & 0x0F00) >> 8] -= this.V[(opcode & 0x00F0) >> 4];
            this.pc +=2;
            break;

          case 0x0006: // 8XY6: Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.
            this.V[0xF] = this.V[(opcode & 0x0F00) >> 8] & 0x01;
            this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x0F00) >> 8] >> 1;
            this.pc +=2;
            break;

          case 0x0007: // 8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
            if (this.V[(opcode & 0x00F0) >> 4] - this.V[(opcode & 0x0F00) >> 8] < 0) {
              this.V[0xF] = 1;
            } else {
              this.V[0xF] = 0;
            }
            this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x00F0) >> 4] - this.V[(opcode & 0x0F00) >> 8];
            this.pc +=2;
            break;

          case 0x000E: // 8XYE: Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.
            this.V[0xF] = this.V[(opcode & 0x0F00) >> 8] >> 7;
            this.V[(opcode & 0x0F00) >> 8] = this.V[(opcode & 0x0F00) >> 8] << 1;
            this.pc +=2;
            break;

          default:
            console.error("Unknown opcode: " + opcode);
        }
        break;
        
      case 0xA000: // ANNN: Sets I to the address NNN
        this.I = opcode & 0x0FFF;
        this.pc += 2;
        break;
      default:
        console.error("Unknown opcode: " + opcode);
        
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

