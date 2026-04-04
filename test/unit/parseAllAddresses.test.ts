import { assert } from 'chai'

import 'mocha'

import parseAllAddresses from '../../src/services/users'
import { AddressInformation } from '../../src/types/database'
import { ParseError, ParseErrorType } from '../../src/utils/errors'

/**
 * Creates a base64-encoded protected payload for a verified address signature.
 *
 * @param obj - The object to encode.
 * @returns A base64 string.
 */
function makeProtected(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
}

const identityKeyProtected = makeProtected({ name: 'identityKey' })

describe('Admin API - parseAllAddresses()', function (): void {
  describe('Old API format (version < 2020-08-25)', function (): void {
    const oldVersion = '2020-05-28'

    it('Returns concatenated addresses and verified addresses unchanged', function () {
      // GIVEN addresses and verified addresses in the old database format
      const addresses: AddressInformation[] = [
        {
          paymentNetwork: 'XRP',
          environment: 'TESTNET',
          details: { address: 'rDk7FQvkQxQQNGTtfM2Fr66s7Nm3k87vdS' },
        },
      ]
      const verifiedAddresses: AddressInformation[] = [
        {
          paymentNetwork: 'ETH',
          environment: 'MAINNET',
          details: { address: '0xf333907BaF09DC58ad4Ba39Af94009801C825531' },
        },
      ]
      const identityKey = 'anIdentityKey'

      // WHEN we parse all addresses with the old API version
      const [allAddresses, returnedIdentityKey] = parseAllAddresses(
        addresses,
        verifiedAddresses,
        identityKey,
        oldVersion,
      )

      // THEN all addresses are concatenated without transformation
      assert.deepStrictEqual(allAddresses, [...addresses, ...verifiedAddresses])
      assert.strictEqual(returnedIdentityKey, identityKey)
    })

    it('Returns empty arrays when no addresses are provided', function () {
      // GIVEN no addresses or verified addresses
      // WHEN we parse with the old API version
      const [allAddresses, returnedIdentityKey] = parseAllAddresses(
        undefined,
        undefined,
        undefined,
        oldVersion,
      )

      // THEN we get empty arrays and no identity key
      assert.deepStrictEqual(allAddresses, [])
      assert.isUndefined(returnedIdentityKey)
    })

    it('Handles only regular addresses with no verified addresses', function () {
      // GIVEN only regular addresses in the old format
      const addresses: AddressInformation[] = [
        {
          paymentNetwork: 'BTC',
          environment: 'MAINNET',
          details: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
        },
      ]

      // WHEN we parse with the old API version
      const [allAddresses, returnedIdentityKey] = parseAllAddresses(
        addresses,
        undefined,
        undefined,
        oldVersion,
      )

      // THEN we get back just the regular addresses
      assert.deepStrictEqual(allAddresses, addresses)
      assert.isUndefined(returnedIdentityKey)
    })
  })

  describe('New API format (version >= 2020-08-25)', function (): void {
    const newVersion = '2020-08-25'

    it('Translates Public API address format to database format', function () {
      // GIVEN addresses in the Public API format (addressDetails instead of details)
      const addresses = [
        {
          paymentNetwork: 'XRP',
          environment: 'TESTNET',
          addressDetailsType: 'CryptoAddressDetails',
          addressDetails: { address: 'rDk7FQvkQxQQNGTtfM2Fr66s7Nm3k87vdS' },
        },
      ]
      const expectedAddresses: AddressInformation[] = [
        {
          paymentNetwork: 'XRP',
          environment: 'TESTNET',
          details: { address: 'rDk7FQvkQxQQNGTtfM2Fr66s7Nm3k87vdS' },
        },
      ]

      // WHEN we parse all addresses with the new API version
      const [allAddresses] = parseAllAddresses(
        addresses as never,
        [],
        undefined,
        newVersion,
      )

      // THEN the addresses are translated to the database format
      assert.deepStrictEqual(allAddresses, expectedAddresses)
    })

    it('Translates a verified ETH address (with identity key signature) to database format', function () {
      // GIVEN a verified ETH address in Public API format
      const ethAddress = '0xf333907BaF09DC58ad4Ba39Af94009801C825531'
      const verifiedAddresses = [
        {
          payload: JSON.stringify({
            payIdAddress: {
              paymentNetwork: 'ETH',
              environment: 'MAINNET',
              addressDetails: { address: ethAddress },
            },
          }),
          signatures: [
            {
              protected: identityKeyProtected,
              signature: 'ethSignature',
            },
          ],
        },
      ]
      const expectedAddresses: AddressInformation[] = [
        {
          paymentNetwork: 'ETH',
          environment: 'MAINNET',
          details: { address: ethAddress },
          identityKeySignature: 'ethSignature',
        },
      ]

      // WHEN we parse verified addresses
      const [allAddresses, returnedIdentityKey] = parseAllAddresses(
        [],
        verifiedAddresses as never,
        undefined,
        newVersion,
      )

      // THEN we get the properly formatted address and the identity key
      assert.deepStrictEqual(allAddresses, expectedAddresses)
      assert.strictEqual(returnedIdentityKey, identityKeyProtected)
    })

    it('Returns an empty array when no addresses are provided in the new format', function () {
      // GIVEN no addresses
      // WHEN we parse with the new API version
      const [allAddresses, returnedIdentityKey] = parseAllAddresses(
        undefined,
        undefined,
        undefined,
        newVersion,
      )

      // THEN we get empty arrays and no identity key
      assert.deepStrictEqual(allAddresses, [])
      assert.isUndefined(returnedIdentityKey)
    })

    it('Throws ParseError for invalid base64 in protected payload', function () {
      // GIVEN a verified address with an invalid (non-JSON) protected payload
      const verifiedAddresses = [
        {
          payload: JSON.stringify({
            payIdAddress: {
              paymentNetwork: 'XRP',
              environment: 'TESTNET',
              addressDetails: { address: 'rDk7FQvkQxQQNGTtfM2Fr66s7Nm3k87vdS' },
            },
          }),
          signatures: [
            {
              // This base64 decodes to invalid JSON
              protected: Buffer.from('not-valid-json!!').toString('base64'),
              signature: 'someSignature',
            },
          ],
        },
      ]

      // WHEN we parse the verified addresses
      const throwFn = (): [AddressInformation[], string | undefined] =>
        parseAllAddresses([], verifiedAddresses as never, undefined, newVersion)

      // THEN we get a ParseError for the invalid identity key
      assert.throws(
        throwFn,
        ParseError,
        'Invalid JSON for protected payload (identity key).',
      )
    })

    it('Throws ParseError when multiple different identity keys are detected across addresses', function () {
      // GIVEN two verified addresses with different identity key protected payloads
      const identityKey1 = makeProtected({ name: 'identityKey' })
      const identityKey2 = makeProtected({ name: 'identityKey' }) // same name but different encoding (simulated)

      // We simulate different identity keys by having two distinct base64 strings
      const differentKey = Buffer.from(
        JSON.stringify({ name: 'identityKey', extra: 'differentKey' }),
      ).toString('base64')

      const verifiedAddresses = [
        {
          payload: JSON.stringify({
            payIdAddress: {
              paymentNetwork: 'XRP',
              environment: 'TESTNET',
              addressDetails: { address: 'rDk7FQvkQxQQNGTtfM2Fr66s7Nm3k87vdS' },
            },
          }),
          signatures: [
            {
              protected: identityKey1,
              signature: 'xrpSignature',
            },
          ],
        },
        {
          payload: JSON.stringify({
            payIdAddress: {
              paymentNetwork: 'ETH',
              environment: 'MAINNET',
              addressDetails: {
                address: '0xf333907BaF09DC58ad4Ba39Af94009801C825531',
              },
            },
          }),
          signatures: [
            {
              protected: differentKey,
              signature: 'ethSignature',
            },
          ],
        },
      ]

      // WHEN we parse the verified addresses
      const throwFn = (): [AddressInformation[], string | undefined] =>
        parseAllAddresses([], verifiedAddresses as never, undefined, newVersion)

      // THEN we get a ParseError for multiple identity keys
      assert.throws(throwFn, ParseError, "More than one identity key detected. Only one identity key per PayID can be used.")
    })

    it('Throws ParseError when one address has multiple identity key signatures', function () {
      // GIVEN a verified address with two identity key signatures
      const verifiedAddresses = [
        {
          payload: JSON.stringify({
            payIdAddress: {
              paymentNetwork: 'XRP',
              environment: 'TESTNET',
              addressDetails: { address: 'rDk7FQvkQxQQNGTtfM2Fr66s7Nm3k87vdS' },
            },
          }),
          signatures: [
            {
              protected: identityKeyProtected,
              signature: 'firstSignature',
            },
            {
              protected: identityKeyProtected,
              signature: 'secondSignature',
            },
          ],
        },
      ]

      // WHEN we parse the verified addresses
      const throwFn = (): [AddressInformation[], string | undefined] =>
        parseAllAddresses([], verifiedAddresses as never, undefined, newVersion)

      // THEN we get a ParseError for multiple identity keys
      assert.throws(throwFn, ParseError, "More than one identity key detected. Only one identity key per address can be used.")
    })
  })
})
