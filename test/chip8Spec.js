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
});
