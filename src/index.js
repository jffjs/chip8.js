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
  this.drawFlag   = false;
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
  this.gfx        = new Uint8Array(64 * 32);        // 64 x 32

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
    console.log(this.gfx);
    var line = "";
    for (var y = 0; y < 32; y++) {
      for (var x = 0; x < 64; x++) {
        line += this.gfx[x + (y * 64)];
      }
      line += "\n";
    }
    console.log(line);
  };

  this.setKeys = function() {
    
  };

  this.emulateCycle = function() {
    // Fetch opcode
    this.opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];

    // Decode and execute opcode
    var opcode = this.opcode;
    var i;
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
        // if (this.V[(opcode & 0x0F00) >> 8] + (opcode & 0x00FF) > 0xFF) {
        //   this.V[0xF] = 1;
        // } else {
        //   this.V[0xF] = 0;
        // }

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
        
      case 0x9000: // 9XY0: Skips the next instruction if VX doesn't equal VY. 
        if (this.V[(opcode & 0x0F00) >> 8] !== this.V[(opcode & 0x00F0) >> 4]) {
          this.pc += 4;
        } else {
          this.pc += 2;
        }
        break;

      case 0xA000: // ANNN: Sets I to the address NNN
        this.I = opcode & 0x0FFF;
        this.pc += 2;
        break;

      case 0xB000: // BNNN: Jumps to the address NNN plus V0.
        // TODO: Need carry flag?
        this.pc = (opcode & 0x0FFF) + this.V[0];
        break;

      case 0xC000: // CXNN: Sets VX to a random number, masked by NN.
        this.V[(opcode & 0x0F00) >> 8] = Math.floor(Math.random() * 0xFF) & (opcode & 0x00FF);
        this.pc += 2;
        break;

      case 0xD000: // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. 
        var x = this.V[(opcode & 0x0F00) >> 8];
        var y = this.V[(opcode & 0x00F0) >> 4];
        var height = opcode & 0x000F;
        var sprite;

        this.V[0xF] = 0;
        for (var yline = 0; yline < height; yline++) {
          sprite = this.memory[this.I + yline];

          for (var xline = 0; xline < 8; xline++) {
            if ((sprite & (0x80 >> xline)) !== 0) {
              if (this.gfx[x + xline + ((y + yline) * 64)] === 1) {
                this.V[0xF] = 1;
              }
              this.gfx[x + xline + ((y + yline) * 64)] ^= 1;
            }
          }
        }

        this.drawFlag = true;
        this.pc += 2;
        break;

      case 0xE000:
        switch (opcode & 0x00FF) {
          case 0x009E: // EX9E: Skips the next instruction if the key stored in VX is pressed.
            if (this.key[this.V[(opcode & 0x0F00) >> 8]] !== 0) {
              this.pc += 4;
            } else {
              this.pc += 2;
            }
            break;

          case 0x00A1: // EXA1: Skips the next instruction if the key stored in VX isn't pressed.
            if (this.key[this.V[(opcode & 0x0F00) >> 8]] !== 1) {
              this.pc += 4;
            } else {
              this.pc += 2;
            }
            break;

          default:
            console.error("Unknown opcode: " + opcode);
        }
        break;
        
      case 0xF000:
        switch (opcode & 0x00FF) {
          case 0x0007: // FX07: Sets VX to the value of the delay timer.
            this.V[(opcode & 0x0F00) >> 8] = this.delayTimer;
            this.pc += 2;
            break;

          case 0x000A: // FX0A: A key press is awaited, and then stored in VX.
            for (var k = 0; k < 16; k++) {
              if (this.key[k] === 1) {
                this.V[(opcode & 0x0F00) >> 8] = k;
                this.pc += 2;
              }
            }
            break;

          case 0x0015: // FX15: Sets the delay timer to VX.
            this.delayTimer = this.V[(opcode & 0x0F00) >> 8];
            this.pc += 2;
            break;

          case 0x0018: // FX18: Sets the sound timer to VX.
            this.soundTimer = this.V[(opcode & 0x0F00) >> 8];
            this.pc += 2;
            break;

          case 0x001E: // FX1E: Adds VX to I. Sets carry flag (VF) if overflow.
            if (this.V[(opcode & 0x0F00) >> 8] + this.I > 0xFFF) {
              this.V[0xF] = 1;
            } else {
              this.V[0xF] = 0;
            }
            this.I = (this.I + this.V[(opcode & 0x0F00) >> 8]) % 0x1000;
            this.pc += 2;
            break;

          case 0x0029: // FX29: Sets I to the location of the sprite for the character in VX
            this.I = this.V[(opcode & 0x0F00) >> 8]  * 5;
            this.pc += 2;
            break;

          case 0x0033: // FX33: Stores the Binary-coded decimal representation of VX  to addresses I, I+1, I+2
            this.memory[this.I] = this.V[(opcode & 0x0F00) >> 8] / 100;
            this.memory[this.I + 1] = (this.V[(opcode & 0x0F00) >> 8] / 10) % 10;
            this.memory[this.I + 2] = (this.V[(opcode & 0x0F00) >> 8] % 100) % 10;
            this.pc += 2;
            break;

          case 0x0055: // FX55: Stores V0 to VX in memory starting at address I.
            // TODO: is this inclusive?
            for (i = 0; i <= (opcode & 0x0F00) >> 8; i++) {
              this.memory[this.I + i] = this.V[i];
            }
            this.pc += 2;
            break;

          case 0x0065: // FX65:Fills V0 to VX with values from memory starting at address I. 
            for (i = 0; i <= (opcode & 0x0F00) >> 8; i++) {
              this.V[i] = this.memory[this.I + i];
            }
            this.pc += 2;
            break;

          default:
            console.error("Unknown opcode: " + opcode);
        }
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
    var loop = function() {
      for(var i = 0; i < 10; i++) {
        this.emulateCycle();

        if (this.drawFlag) {
          this.draw();
        }

        this.setKeys();
      }
      window.requestAnimationFrame(loop);
    }.bind(this);

    window.requestAnimationFrame(loop);
  };
}

