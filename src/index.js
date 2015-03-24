(function() {
  var opcode,                   // 2 bytes
      I,                        // Index register 
      pc,                       // program counter
      delayTimer,
      soundTimer,
      sp,                       // stack pointer
      memory = new Array(4096), // 4K memory
      stack  = new Array(16),
      V      = new Array(16),   // general purpose registers
      key    = new Array(16),   // keypad
      gfx    = new Array(64);   // 64 x 32

  for(var i = 0; i < gfx.length; i++) {
    gfx[i] = new Array(32);
  }

  function initialize() {
    
  }

  function load() {
    
  }

  function emulateCycle() {
    
  }

  function draw() {
    
  }

  function setKeys() {
    
  }

  function run() {
    
  }

  return {
    initialize: initialize,
    load: load,
    run: run
  };
})();
