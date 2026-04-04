'use strict'

function createLogger() {
  const logger = {
    level: 'INFO',
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
  }
  return logger
}

module.exports = createLogger
module.exports.default = createLogger
