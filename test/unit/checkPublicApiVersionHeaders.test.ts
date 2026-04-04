import { assert } from 'chai'
import { Request, Response, NextFunction } from 'express'

import 'mocha'

import checkPublicApiVersionHeaders from '../../src/middlewares/checkPublicApiVersionHeaders'
import { ParseError, ParseErrorType } from '../../src/utils/errors'

/**
 * Creates a mock Express Request object with the given headers.
 *
 * @param headers - A map of header names to values.
 * @returns A mock Request object.
 */
function mockReq(headers: Record<string, string | undefined>): Request {
  return {
    header: (name: string) => headers[name],
    method: 'GET',
  } as unknown as Request
}

/**
 * Creates a mock Express Response object that tracks headers set on it.
 *
 * @returns A mock Response object with a `responseHeaders` map.
 */
function mockRes(): Response & { responseHeaders: Record<string, string> } {
  const responseHeaders: Record<string, string> = {}
  const res = {
    responseHeaders,
    header: (name: string, value?: string) => {
      if (value !== undefined) {
        responseHeaders[name] = value
      }
      return res
    },
    locals: {},
    headersSent: false,
  } as unknown as Response & { responseHeaders: Record<string, string> }
  return res
}

describe('Public API - checkPublicApiVersionHeaders()', function (): void {
  it('Throws a ParseError when the PayID-Version header is missing', function () {
    // GIVEN a request with no PayID-Version header
    const req = mockReq({})
    const res = mockRes()

    // WHEN we check the version headers
    const throwFn = (): void =>
      checkPublicApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the missing header
    assert.throws(throwFn, ParseError, "A PayID-Version header is required in the request")
  })

  it('Throws a ParseError when the PayID-Version header format is invalid', function () {
    // GIVEN a request with a malformed PayID-Version header (not major.minor)
    const req = mockReq({ 'PayID-Version': '1.0.0' })
    const res = mockRes()

    // WHEN we check the version headers
    const throwFn = (): void =>
      checkPublicApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the invalid header format
    assert.throws(
      throwFn,
      ParseError,
      "A PayID-Version header must be in the form",
    )
  })

  it('Throws a ParseError when the PayID-Version header is a non-numeric string', function () {
    // GIVEN a request with a PayID-Version header that is not a version number
    const req = mockReq({ 'PayID-Version': 'abc' })
    const res = mockRes()

    // WHEN we check the version headers
    const throwFn = (): void =>
      checkPublicApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the invalid header format
    assert.throws(
      throwFn,
      ParseError,
      "A PayID-Version header must be in the form",
    )
  })

  it('Throws a ParseError when the PayID-Version is greater than the server version', function () {
    // GIVEN a request with a PayID-Version higher than the server supports
    const req = mockReq({ 'PayID-Version': '2.0' })
    const res = mockRes()

    // WHEN we check the version headers
    const throwFn = (): void =>
      checkPublicApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the unsupported version
    assert.throws(
      throwFn,
      ParseError,
      "is not supported, please try downgrading your request",
    )
  })

  it('Throws a ParseError when the PayID-Version is not in the supported versions list', function () {
    // GIVEN a request with a PayID-Version that is ≤ server version but not in supported list
    const req = mockReq({ 'PayID-Version': '0.9' })
    const res = mockRes()

    // WHEN we check the version headers
    const throwFn = (): void =>
      checkPublicApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the unsupported version
    assert.throws(
      throwFn,
      ParseError,
      "is not supported, try something in the range",
    )
  })

  it('Calls next() and sets response headers for PayID-Version 1.0', function () {
    // GIVEN a request with a supported PayID-Version of 1.0
    const req = mockReq({ 'PayID-Version': '1.0' })
    const res = mockRes()
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the version headers
    checkPublicApiVersionHeaders(req, res, next)

    // THEN next() is called and the appropriate headers are set on the response
    assert.isTrue(nextCalled)
    assert.strictEqual(res.responseHeaders['PayID-Version'], '1.0')
    assert.strictEqual(res.responseHeaders['Cache-Control'], 'no-store')
    assert.exists(res.responseHeaders['PayID-Server-Version'])
  })

  it('Calls next() and sets response headers for PayID-Version 1.1', function () {
    // GIVEN a request with the latest supported PayID-Version
    const req = mockReq({ 'PayID-Version': '1.1' })
    const res = mockRes()
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the version headers
    checkPublicApiVersionHeaders(req, res, next)

    // THEN next() is called and the PayID-Version header echoes the request version
    assert.isTrue(nextCalled)
    assert.strictEqual(res.responseHeaders['PayID-Version'], '1.1')
    assert.strictEqual(res.responseHeaders['Cache-Control'], 'no-store')
  })
})
