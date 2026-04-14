import { assert } from 'chai'
import { Request, Response, NextFunction } from 'express'

import 'mocha'

import constructJrd from '../../src/middlewares/constructJrd'
import { ParseError, ParseErrorType } from '../../src/utils/errors'

/**
 * Creates a mock Express Request object with the given query parameters.
 *
 * @param query - A map of query parameter names to values.
 * @returns A mock Request object.
 */
function mockReq(query: Record<string, unknown>): Request {
  return {
    query,
    method: 'GET',
  } as unknown as Request
}

/**
 * Creates a mock Express Response object with a `locals` bag.
 *
 * @returns A mock Response object.
 */
function mockRes(): Response & { locals: Record<string, unknown> } {
  return {
    locals: {},
    header: () => undefined,
    headersSent: false,
  } as unknown as Response & { locals: Record<string, unknown> }
}

describe('Public API - constructJrd()', function (): void {
  it('Throws a ParseError when the resource query parameter is missing', function () {
    // GIVEN a request with no resource query parameter
    const req = mockReq({})
    const res = mockRes()

    // WHEN we construct the JRD
    const throwFn = (): void => constructJrd(req, res, () => undefined)

    // THEN we get a ParseError for the missing PayID
    assert.throws(throwFn, ParseError, "A PayID must be provided in the `resource` request parameter")
  })

  it('Throws a ParseError when the resource query parameter is an array', function () {
    // GIVEN a request with multiple resource query parameters (array)
    const req = mockReq({ resource: ['alice$example.com', 'bob$example.com'] })
    const res = mockRes()

    // WHEN we construct the JRD
    const throwFn = (): void => constructJrd(req, res, () => undefined)

    // THEN we get a ParseError for the invalid PayID
    assert.throws(throwFn, ParseError, "A PayID must be provided in the `resource` request parameter")
  })

  it('Sets res.locals.response with the JRD object and calls next() for a valid PayID resource', function () {
    // GIVEN a request with a valid resource query parameter
    const payId = 'alice$example.com'
    const req = mockReq({ resource: payId })
    const res = mockRes()
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we construct the JRD
    constructJrd(req, res, next)

    // THEN next() is called and res.locals.response has the subject set to the PayID
    assert.isTrue(nextCalled)
    const response = res.locals.response as {
      subject: string
      links: unknown
    }
    assert.strictEqual(response.subject, payId)
    assert.exists(response.links)
  })

  it('Sets the subject of the JRD to the full resource URL when provided as a URL', function () {
    // GIVEN a request with a PayID URL as the resource parameter
    const resourceUrl = 'https://example.com/alice'
    const req = mockReq({ resource: resourceUrl })
    const res = mockRes()
    let nextCalled = false
    const next: NextFunction = () => {
      nextCalled = true
    }

    // WHEN we construct the JRD
    constructJrd(req, res, next)

    // THEN the subject in the JRD is set to whatever resource was provided
    assert.isTrue(nextCalled)
    const response = res.locals.response as { subject: string }
    assert.strictEqual(response.subject, resourceUrl)
  })
})
