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
    function setOpcode(opcode, address) {
      address = address || 0x200;
      chip8.memory[address] = (opcode & 0xFF00) >> 8;
      chip8.memory[address + 1] = opcode & 0x00FF;
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

        xit("sets carry flag (VF) if overflow", function() {
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

      describe("0x9XY0", function() {
        beforeEach(function() {
          setOpcode(0x9010);
        });
        
        it("skips next instruction when VX != VY", function() {
          chip8.V[0] = 0x44;
          chip8.V[1] = 0x45;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x204);
        });

        it("increments program counter as normal when VX == VY", function() {
          chip8.V[0] = 0x44;
          chip8.V[1] = 0x44;
          chip8.emulateCycle();
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

      describe("0xBNNN", function() {
        it("sets program counter to NNN plus value of V0", function() {
          setOpcode(0xB300);
          chip8.V[0] = 0x20;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x300 + 0x20);
        });
      });

      describe("0xCXNN", function() {
        beforeEach(function() {
          setOpcode("0xC0AB");
        });

        it("sets VX to a random number masked by NN", function() {
          spyOn(Math, 'random').and.returnValue(0.5);
          chip8.emulateCycle();
          expect(chip8.V[0]).toEqual(0x2B);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xDXYN", function() {
        beforeEach(function() {
          chip8.I = 0x400;

          // Sprite
          chip8.memory[0x400] = 0x3C;  // 00111100
          chip8.memory[0x401] = 0xC3;  // 11000011
          chip8.memory[0x402] = 0xFF;  // 11111111
        });

        it("draws sprite from address I and of height N to (VX, VY)", function() {
          setOpcode("0xD013");
          chip8.V[0] = 8;
          chip8.V[1] = 0;
          chip8.emulateCycle();
          // first spots are still empty
          expect(chip8.gfx.subarray(0,8)).toEqual(     new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]));
          // sprite
          expect(chip8.gfx.subarray(8,16)).toEqual(    new Uint8Array([0, 0, 1, 1, 1, 1, 0, 0]));
          expect(chip8.gfx.subarray(72, 80)).toEqual(  new Uint8Array([1, 1, 0, 0, 0, 0, 1, 1]));
          expect(chip8.gfx.subarray(136, 144)).toEqual(new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1]));
        });

        it("sets VF to 1 if drawing causes a collision (pixel is toggled from on to off)", function() {
          // draw first sprite
          setOpcode("0xD013");
          chip8.V[0] = 8;
          chip8.V[1] = 0;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(0);
          
          // draw second sprite
          setOpcode("0xD233", 0x202);
          chip8.V[2] = 1;
          chip8.V[3] = 0;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(1);
        });

        it("increments program counter", function() {
          setOpcode("0xD013");
          chip8.V[0] = 8;
          chip8.V[1] = 0;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xEX9E", function() {
        beforeEach(function() {
          setOpcode(0xE89E);
          chip8.V[8] = 0xF;
        });

        it("skips next instruction if key in VX is pressed", function() {
          chip8.key[0xF] = 1;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x204);
        });

        it("increments program counter as normal if key in VX is not pressed", function() {
          chip8.key[0xF] = 0;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xEXA1", function() {
        beforeEach(function() {
          setOpcode(0xE5A1);
          chip8.V[5] = 0xA;
        });

        it("skips next instruction if key in VX is not pressed", function() {
          chip8.key[0xA] = 0;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x204);
        });

        it("increments program counter as normal if key in VX is pressed", function() {
          chip8.key[0xA] = 1;
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX07", function() {
        beforeEach(function() {
          setOpcode(0xF107);
          chip8.delayTimer = 0xF0;
        });

        it("sets VX to the value of delay timer", function() {
          chip8.emulateCycle();
          expect(chip8.V[1]).toEqual(0xF0);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX0A", function() {
        beforeEach(function() {
          setOpcode(0xF20A);
        });

        it("awaits keypress and stores in VX", function() {
          chip8.key[0xA] = 1;
          chip8.emulateCycle();
          expect(chip8.V[2]).toEqual(0xA);
          expect(chip8.pc).toEqual(0x202);
        });

        it("waits if no key is pressed", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x200);
        });
      });

      describe("0xFX15", function() {
        beforeEach(function() {
          setOpcode(0xF315);
          chip8.V[3] = 0xBB;
          chip8.emulateCycle();
        });
        
        it("sets delay timer to VX", function() {
          expect(chip8.delayTimer).toEqual(0xBB - 1);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX18", function() {
        beforeEach(function() {
          setOpcode(0xF418);
          chip8.V[4] = 0xBB;
          chip8.emulateCycle();
        });
        
        it("sets sound timer to VX", function() {
          expect(chip8.soundTimer).toEqual(0xBB - 1);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX1E", function() {
        beforeEach(function() {
          setOpcode(0xF51E);
          chip8.V[5] = 0x4A;
          chip8.I = 0x400;
        });

        it("adds VX to I", function() {
          chip8.emulateCycle();
          expect(chip8.I).toEqual(0x400 + 0x4A);
        });

        it("sets carry flag (VF) on overflow", function() {
          chip8.I = 0xFFF;
          chip8.emulateCycle();
          expect(chip8.V[0xF]).toEqual(1);
          expect(chip8.I).toEqual(0x49);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX29", function() {
        beforeEach(function() {
          setOpcode(0xF629);
          chip8.V[6] = 0xB;
          chip8.emulateCycle();
        });

        it("sets I to the address of the character in VX", function() {
          expect(chip8.I).toEqual(0x37);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX33", function() {
        beforeEach(function() {
          setOpcode(0xF733);
          chip8.I = 0x400;
        });

        it("saves the binary-coded decimal representation of the number in VX to addresses I, I+1, and I+2", function() {
          chip8.V[7] = 243;
          chip8.emulateCycle();
          expect(chip8.memory[chip8.I]).toEqual(2);
          expect(chip8.memory[chip8.I + 1]).toEqual(4);
          expect(chip8.memory[chip8.I + 2]).toEqual(3);

          chip8.V[7] = 25;
          setOpcode(0xF733, 0x202);
          chip8.emulateCycle();
          expect(chip8.memory[chip8.I]).toEqual(0);
          expect(chip8.memory[chip8.I + 1]).toEqual(2);
          expect(chip8.memory[chip8.I + 2]).toEqual(5);

          chip8.V[7] = 8;
          setOpcode(0xF733, 0x204);
          chip8.emulateCycle();
          expect(chip8.memory[chip8.I]).toEqual(0);
          expect(chip8.memory[chip8.I + 1]).toEqual(0);
          expect(chip8.memory[chip8.I + 2]).toEqual(8);
        });

        it("increments program counter", function() {
          chip8.emulateCycle();
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX55", function() {
        beforeEach(function() {
          setOpcode(0xF255);
          chip8.I = 0x400;
          chip8.V[0] = 0x11;
          chip8.V[1] = 0x22;
          chip8.V[2] = 0x33;
          chip8.emulateCycle();
        });

        it("stores V0 to VX in memory starting at address I", function() {
          expect(chip8.memory[chip8.I]).toEqual(0x11);
          expect(chip8.memory[chip8.I + 1]).toEqual(0x22);
          expect(chip8.memory[chip8.I + 2]).toEqual(0x33);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });

      describe("0xFX65", function() {
        beforeEach(function() {
          setOpcode(0xF265);
          chip8.I = 0x400;
          chip8.memory[0x400] = 0x11;
          chip8.memory[0x401] = 0x22;
          chip8.memory[0x402] = 0x33;
          chip8.emulateCycle();
        });

        it("fills V0 to VX with values from memory starting at address I", function() {
          expect(chip8.V[0]).toEqual(0x11);
          expect(chip8.V[1]).toEqual(0x22);
          expect(chip8.V[2]).toEqual(0x33);
        });

        it("increments program counter", function() {
          expect(chip8.pc).toEqual(0x202);
        });
      });
    });
  });
});
