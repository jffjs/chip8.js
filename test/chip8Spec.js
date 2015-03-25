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
    function setOpcode(opcode) {
      chip8.memory[0x200] = (opcode & 0xFF00) >> 8;
      chip8.memory[0x201] = opcode & 0x00FF;
    };

    it("fetches the next opcode from memory", function() {
      setOpcode(0x00EE);
      chip8.emulateCycle();
      expect(chip8.opcode).toEqual(0x00EE);
    });

    it("updates timers", function() {
      chip8.delayTimer = 60;
      chip8.soundTimer = 10;
      chip8.emulateCycle();
      expect(chip8.delayTimer).toEqual(59);
      expect(chip8.soundTimer).toEqual(9);
    });

    describe("opcodes", function() {

      describe("0x00EE", function() {
        beforeEach(function() {
          setOpcode(0x00EE);
          chip8.stack[0] = 0xCCC;
          chip8.stack[1] = 0x200;
          chip8.sp = 2;
        });

        it("decrements stack pointer", function() {
          chip8.emulateCycle();
          expect(chip8.sp).toEqual(1);
        });

        it("sets program counter to address at top of stack", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });
      
      describe("0x1NNN", function() {
        it("sets program counter to address NNN", function() {
          setOpcode(0x1BBB);
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0xBBB);
        });
      });

      describe("0x2NNN", function() {
        beforeEach(function() {
          setOpcode(0x2BBB);
        });

        it("puts return address on top of stack", function() {
          chip8.emulateCycle();
          expect(chip8.stack[0]).toEqual(0x200); // return address should be next instruction
        });

        it("increments stack pointer", function() {
          chip8.emulateCycle();
          expect(chip8.sp).toEqual(1);
        });

        it("sets program counter to address NNN", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0xBBB);
        });

        it("throws an error if stack exceeded", function() {
          spyOn(console, 'error');
          chip8.sp = 16;
          chip8.emulateCycle();
          expect(console.error).toHaveBeenCalledWith('Stack limit exceeded!');
        });
      });

      describe("0x3XNN", function() {
        beforeEach(function() {
          setOpcode(0x3044);
        });

        it("skips next instruction when VX == NN", function() {
          chip8.V[0] = 0x44;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x204);
        });

        it("increments program counter as normal when VX != NN", function() {
          chip8.V[0] = 0x00;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x4XNN", function() {
        beforeEach(function() {
          setOpcode(0x4044);
        });

        it("skips next instruction when VX != NN", function() {
          chip8.V[0] = 0x00;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x204);
        });

        it("increments program counter as normal when VX == NN", function() {
          chip8.V[0] = 0x44;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x5XY0", function() {
        beforeEach(function() {
          setOpcode(0x5010);
        });
        
        it("skips next instruction when VX == VY", function() {
          chip8.V[0] = 0x44;
          chip8.V[1] = 0x44;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x204);
        });

        it("increments program counter as normal when VX != VY", function() {
          chip8.V[0] = 0x44;
          chip8.V[1] = 0x55;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });
      
      describe("0x6XNN", function() {
        beforeEach(function() {
          setOpcode(0x65CC);
        });

        it("sets VX to NN", function() {
          chip8.emulateCycle();
          expect(chip8.V[5]).toEqual(0xCC);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x7XNN", function() {
        beforeEach(function() {
          setOpcode(0x7044);
        });

        it("adds NN to VX", function() {
          chip8.V[0] = 0x11;
          chip8.emulateCycle();
          expect(chip8.V[15]).toEqual(0);
          expect(chip8.V[0]).toEqual(0x44 + 0x11);
        });

        it("sets carry flag (VF) if overflow", function() {
          setOpcode(0x70FF);
          chip8.V[0] = 0xFF;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(1);
          expect(chip8.V[0]).toEqual(0xFE);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });
      
      describe("0x8XY0", function() {
        beforeEach(function() {
          setOpcode(0x8010);
          chip8.V[0] = 0x11;
          chip8.V[1] = 0x22;
          chip8.emulateCycle();
        });

        it("sets VX to the value of VY", function() {
          expect(chip8.V[0]).toEqual(0x22);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XY1", function() {
        beforeEach(function() {
          setOpcode(0x8011);
          chip8.V[0] = 0x11;
          chip8.V[1] = 0x22;
          chip8.emulateCycle();
        });

        it("sets VX to the value of VX | VY", function() {
          expect(chip8.V[0]).toEqual(0x33);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XY2", function() {
        beforeEach(function() {
          setOpcode(0x8012);
          chip8.V[0] = 0xFF;
          chip8.V[1] = 0xF0;
          chip8.emulateCycle();
        });

        it("sets VX to the value of VX & VY", function() {
          expect(chip8.V[0]).toEqual(0xF0);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XY3", function() {
        beforeEach(function() {
          setOpcode(0x8013);
          chip8.V[0] = 0x11;
          chip8.V[1] = 0x11;
          chip8.emulateCycle();
        });

        it("sets VX to the value of VX xor VY", function() {
          expect(chip8.V[0]).toEqual(0);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XY4", function() {
        beforeEach(function() {
          setOpcode(0x8014);
        });

        it("adds VY to VX", function() {
          chip8.V[0] = 0x11;
          chip8.V[1] = 0xB0;
          chip8.emulateCycle();
          expect(chip8.V[15]).toEqual(0);
          expect(chip8.V[0]).toEqual(0x11 + 0xB0);
        });

        it("sets carry flag (VF) if overflow", function() {
          chip8.V[0] = 0xFF;
          chip8.V[1] = 0xFF;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(1);
          expect(chip8.V[0]).toEqual(0xFE);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XY5", function() {
        beforeEach(function() {
          setOpcode(0x8015);
        });

        it("subtracts VY from VX", function() {
          chip8.V[0] = 0xFF;
          chip8.V[1] = 0x22;
          chip8.emulateCycle();
          expect(chip8.V[15]).toEqual(0);
          expect(chip8.V[0]).toEqual(0xFF - 0x22);
        });

        it("sets borrow flag (VF) if overflow", function() {
          chip8.V[0] = 0x0A;
          chip8.V[1] = 0xFF;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(1);
          expect(chip8.V[0]).toEqual(0x0B);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XY6", function() {
        beforeEach(function() {
          setOpcode(0x8016);
          chip8.V[0] = 0xFF;
          chip8.emulateCycle();
        });

        it("sets VF to the value of the least significant bit of VX", function() {
          expect(chip8.V[0xF]).toEqual(1);
        });

        it("shifts VX right by 1", function() {
          expect(chip8.V[0]).toEqual(0x7F);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XY7", function() {
        beforeEach(function() {
          setOpcode(0x8017);
        });

        it("subtracts VY from VX", function() {
          chip8.V[0] = 0x22;
          chip8.V[1] = 0xFF;
          chip8.emulateCycle();
          expect(chip8.V[15]).toEqual(0);
          expect(chip8.V[0]).toEqual(0xFF - 0x22);
        });

        it("sets borrow flag (VF) if overflow", function() {
          chip8.V[0] = 0xFF;
          chip8.V[1] = 0x0A;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(1);
          expect(chip8.V[0]).toEqual(0x0B);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0x8XYE", function() {
        beforeEach(function() {
          setOpcode(0x801E);
          chip8.V[0] = 0xFF;
          chip8.emulateCycle();
        });

        it("sets VF to the value of the most significant bit of VX", function() {
          expect(chip8.V[0xF]).toEqual(1);
          chip8.V[0] = 0x12;
          chip8.pc = 0x200;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(0);
        });

        it("shifts VX left by 1", function() {
          expect(chip8.V[0]).toEqual(0xFE);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xANNN", function() {
        beforeEach(function() {
          setOpcode(0xA123);
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
});
