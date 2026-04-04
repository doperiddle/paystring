'use strict'

const HttpStatus = {
  OK: 200,
  BadRequest: 400,
  NotFound: 404,
  Conflict: 409,
  UnsupportedMediaType: 415,
  InternalServerError: 500,
}

module.exports = HttpStatus
module.exports.default = HttpStatus
