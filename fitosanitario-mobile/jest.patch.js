const { ModuleMocker } = require('jest-mock');
if (ModuleMocker && !ModuleMocker.prototype.clearMocksOnScope) {
  ModuleMocker.prototype.clearMocksOnScope = function () {};
}
