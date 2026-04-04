import { assert } from 'chai'
import { Request, Response, NextFunction } from 'express'

import 'mocha'

import {
  checkRequestAdminApiVersionHeaders,
  checkRequestContentType,
  addAcceptPatchResponseHeader,
} from '../../src/middlewares/adminApiHeaders'
import { ParseError, ParseErrorType } from '../../src/utils/errors'
import ContentTypeError from '../../src/utils/errors/contentTypeError'

/**
 * Creates a mock Express Request object.
 *
 * @param headers - A map of header names to values.
 * @param method - The HTTP method for the request.
 * @returns A mock Request object.
 */
function mockReq(
  headers: Record<string, string | undefined>,
  method = 'GET',
): Request {
  return {
    header: (name: string) => headers[name],
    method,
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

describe('Admin API - checkRequestAdminApiVersionHeaders()', function (): void {
  it('Throws a ParseError when the PayID-API-Version header is missing', function () {
    // GIVEN a request with no PayID-API-Version header
    const req = mockReq({})
    const res = mockRes()

    // WHEN we check the headers
    const throwFn = (): void =>
      checkRequestAdminApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the missing header
    assert.throws(
      throwFn,
      ParseError,
      "A PayID-API-Version header is required in the request",
    )
  })

  it('Throws a ParseError when the PayID-API-Version header format is invalid', function () {
    // GIVEN a request with a malformed PayID-API-Version header
    const req = mockReq({ 'PayID-API-Version': 'not-a-date' })
    const res = mockRes()

    // WHEN we check the headers
    const throwFn = (): void =>
      checkRequestAdminApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the invalid header format
    assert.throws(
      throwFn,
      ParseError,
      "A PayID-API-Version header must be in the form",
    )
  })

  it('Throws a ParseError when the PayID-API-Version is before the minimum supported version', function () {
    // GIVEN a request with a PayID-API-Version older than 2020-05-28
    const req = mockReq({ 'PayID-API-Version': '2019-01-01' })
    const res = mockRes()

    // WHEN we check the headers
    const throwFn = (): void =>
      checkRequestAdminApiVersionHeaders(req, res, () => undefined)

    // THEN we get a ParseError for the unsupported version
    assert.throws(
      throwFn,
      ParseError,
      "is not supported, please try upgrading your request",
    )
  })

  it('Calls next() and sets response headers for a valid minimum version', function () {
    // GIVEN a request with the minimum supported PayID-API-Version
    const req = mockReq({ 'PayID-API-Version': '2020-05-28' })
    const res = mockRes()
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the headers
    checkRequestAdminApiVersionHeaders(req, res, next)

    // THEN next() is called and the server version headers are set
    assert.isTrue(nextCalled)
    assert.exists(res.responseHeaders['PayID-Server-Version'])
    assert.exists(res.responseHeaders['PayID-API-Server-Version'])
  })

  it('Calls next() and sets response headers for the latest version', function () {
    // GIVEN a request with the latest supported PayID-API-Version
    const req = mockReq({ 'PayID-API-Version': '2020-08-25' })
    const res = mockRes()
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the headers
    checkRequestAdminApiVersionHeaders(req, res, next)

    // THEN next() is called
    assert.isTrue(nextCalled)
  })
})

describe('Admin API - checkRequestContentType()', function (): void {
  it('Throws a ContentTypeError for a POST request without a Content-Type header', function () {
    // GIVEN a POST request with no Content-Type header
    const req = mockReq({}, 'POST')

    // WHEN we check the Content-Type
    const throwFn = (): void =>
      checkRequestContentType(req, mockRes(), () => undefined)

    // THEN we get a ContentTypeError requiring application/json
    assert.throws(throwFn, ContentTypeError)
  })

  it('Throws a ContentTypeError for a PUT request with the wrong Content-Type header', function () {
    // GIVEN a PUT request with an incorrect Content-Type
    const req = mockReq(
      { 'Content-Type': 'application/merge-patch+json' },
      'PUT',
    )

    // WHEN we check the Content-Type
    const throwFn = (): void =>
      checkRequestContentType(req, mockRes(), () => undefined)

    // THEN we get a ContentTypeError requiring application/json
    assert.throws(throwFn, ContentTypeError)
  })

  it('Throws a ContentTypeError for a PATCH request without the merge-patch Content-Type', function () {
    // GIVEN a PATCH request with the wrong Content-Type
    const req = mockReq({ 'Content-Type': 'application/json' }, 'PATCH')

    // WHEN we check the Content-Type
    const throwFn = (): void =>
      checkRequestContentType(req, mockRes(), () => undefined)

    // THEN we get a ContentTypeError requiring application/merge-patch+json
    assert.throws(throwFn, ContentTypeError)
  })

  it('Calls next() for a POST request with the correct Content-Type', function () {
    // GIVEN a POST request with the correct Content-Type
    const req = mockReq({ 'Content-Type': 'application/json' }, 'POST')
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the Content-Type
    checkRequestContentType(req, mockRes(), next)

    // THEN next() is called without error
    assert.isTrue(nextCalled)
  })

  it('Calls next() for a PUT request with the correct Content-Type', function () {
    // GIVEN a PUT request with the correct Content-Type
    const req = mockReq({ 'Content-Type': 'application/json' }, 'PUT')
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the Content-Type
    checkRequestContentType(req, mockRes(), next)

    // THEN next() is called without error
    assert.isTrue(nextCalled)
  })

  it('Calls next() for a PATCH request with the merge-patch Content-Type', function () {
    // GIVEN a PATCH request with the correct Content-Type
    const req = mockReq(
      { 'Content-Type': 'application/merge-patch+json' },
      'PATCH',
    )
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the Content-Type
    checkRequestContentType(req, mockRes(), next)

    // THEN next() is called without error
    assert.isTrue(nextCalled)
  })

  it('Calls next() for a GET request regardless of Content-Type', function () {
    // GIVEN a GET request with no Content-Type header (GET does not require one)
    const req = mockReq({}, 'GET')
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we check the Content-Type
    checkRequestContentType(req, mockRes(), next)

    // THEN next() is called without error
    assert.isTrue(nextCalled)
  })
})

describe('Admin API - addAcceptPatchResponseHeader()', function (): void {
  it('Sets the Accept-Patch header on the response and calls next()', function () {
    // GIVEN any request
    const req = mockReq({})
    const res = mockRes()
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we add the Accept-Patch response header
    addAcceptPatchResponseHeader(req, res, next)

    // THEN the Accept-Patch header is set and next() is called
    assert.strictEqual(
      res.responseHeaders['Accept-Patch'],
      'application/merge-patch+json',
    )
    assert.isTrue(nextCalled)
  })
})
