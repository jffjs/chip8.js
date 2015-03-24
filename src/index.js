(function() {
  var opcode, // 2 bytes
      memory = new Array(4096), // 4K memory
      V = new Array(16), // general purpose registers
      I,  // Index register 
      pc, // program counter
      gfx = new Array(64) // 64 x 32
  ;

  for(var i = 0; i < gfx.length; i++) {
    gfx[i] = new Array(32);
  }
})();
