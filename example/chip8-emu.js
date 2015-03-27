var Chip8 = require('../index.js');

window.onload = function() {
  var fileInput = document.getElementById('rom');

  fileInput.addEventListener('change', function(e) {
    var rom = fileInput.files[0];
    var reader = new FileReader();

    reader.onload = function() {
      if (window.chip8Emu) {
        window.chip8Emu.stop();
        delete window.chip8Emu;
      }
      var buffer = new Uint8Array(reader.result);

      window.chip8Emu = new Chip8.emulator('chip8', buffer);
      window.chip8Emu.run();
    };
    reader.readAsArrayBuffer(rom);
  });
};
