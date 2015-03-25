describe("CHIP-8", function() {
  var chip8;
  
  beforeEach(function() {
    chip8 = new Chip8();
    chip8.initialize();
  });

  describe("initialize", function() {
    it("sets program counter to 0x200", function() {
      expect(chip8.pc).toEqual(0x200);
    });

    it("resets current opcode", function() {
      expect(chip8.opcode).toEqual(0);
    });

    it("resets index register", function() {
      expect(chip8.I).toEqual(0);
    });

    it("resets stack pointer", function() {
      expect(chip8.sp).toEqual(0);
    });

    it("loads font set into memory", function() {
      for(var i = 0; i < fontSet.length; i++) {
        expect(chip8.memory[i]).toEqual(fontSet[i]);
      }
    });

    it("resets timers", function() {
      expect(chip8.delayTimer).toEqual(0);
      expect(chip8.soundTimer).toEqual(0);
    });
  });

  describe("load", function() {
    var buffer = new Uint8Array([0xF8, 0x90, 0xAB, 0x78, 0x9C, 0xF8, 0x90, 0xAB, 0x78, 0x9C]);

    it("initializes emulator", function() {
      spyOn(chip8, 'initialize').and.callThrough();
      chip8.load(buffer);
      expect(chip8.initialize).toHaveBeenCalled();
    });

    it("loads the buffer into memory starting at address 0x200", function() {
      chip8.load(buffer);

      for(var i = 0; i < buffer.byteLength; i++) {
        expect(chip8.memory[i + 512]).toEqual(buffer[i]);
      }
    });
  });

  describe("emulateCycle", function() {
    it("fetches the next opcode from memory", function() {
      chip8.memory[0x200] = 0x13;
      chip8.memory[0x201] = 0xFF;
      chip8.emulateCycle();
      expect(chip8.opcode).toEqual(0x13FF);
    });

    it("updates timers", function() {
      chip8.delayTimer = 60;
      chip8.soundTimer = 10;
      chip8.emulateCycle();
      expect(chip8.delayTimer).toEqual(59);
      expect(chip8.soundTimer).toEqual(9);
    });

    describe("opcode ANNN", function() {
      beforeEach(function() {
        chip8.memory[0x200] = 0xA1;
        chip8.memory[0x201] = 0x23;
      });

      it("sets index register to NNN", function() {
        chip8.emulateCycle();
        expect(chip8.I).toEqual(0x123);
      });

      it("increments program counter", function() {
        chip8.emulateCycle();
        expect(chip8.pc).toEqual(0x202);
      });
    });
  });
});
