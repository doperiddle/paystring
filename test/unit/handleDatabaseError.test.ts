import { assert } from 'chai'

import 'mocha'

import DatabaseError, {
  DatabaseErrorMessage,
  handleDatabaseError,
} from '../../src/utils/errors/databaseError'

describe('Database Errors - handleDatabaseError()', function (): void {
  it('Throws a DatabaseError with InvalidPayId message for valid_pay_id constraint', function () {
    // GIVEN an error message referencing the valid_pay_id constraint
    const rawError = new Error('violates check constraint "valid_pay_id"')

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(throwFn, DatabaseError, DatabaseErrorMessage.InvalidPayId)
  })

  it('Throws a DatabaseError with EmptyStringPayId message for pay_id_length_nonzero constraint', function () {
    // GIVEN an error message referencing the pay_id_length_nonzero constraint
    const rawError = new Error(
      'violates check constraint "pay_id_length_nonzero"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(throwFn, DatabaseError, DatabaseErrorMessage.EmptyStringPayId)
  })

  it('Throws a DatabaseError with EmptyStringPaymentNetwork message for payment_network_length_nonzero constraint', function () {
    // GIVEN an error message referencing the payment_network_length_nonzero constraint
    const rawError = new Error(
      'violates check constraint "payment_network_length_nonzero"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(
      throwFn,
      DatabaseError,
      DatabaseErrorMessage.EmptyStringPaymentNetwork,
    )
  })

  it('Throws a DatabaseError with EmptyStringEnvironment message for environment_length_nonzero constraint', function () {
    // GIVEN an error message referencing the environment_length_nonzero constraint
    const rawError = new Error(
      'violates check constraint "environment_length_nonzero"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(
      throwFn,
      DatabaseError,
      DatabaseErrorMessage.EmptyStringEnvironment,
    )
  })

  it('Throws a DatabaseError with StringCasePayId message for pay_id_lowercase constraint', function () {
    // GIVEN an error message referencing the pay_id_lowercase constraint
    const rawError = new Error(
      'violates check constraint "pay_id_lowercase"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(throwFn, DatabaseError, DatabaseErrorMessage.StringCasePayId)
  })

  it('Throws a DatabaseError with StringCasePaymentNetwork message for payment_network_uppercase constraint', function () {
    // GIVEN an error message referencing the payment_network_uppercase constraint
    const rawError = new Error(
      'violates check constraint "payment_network_uppercase"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(
      throwFn,
      DatabaseError,
      DatabaseErrorMessage.StringCasePaymentNetwork,
    )
  })

  it('Throws a DatabaseError with StringCaseEnvironment message for environment_uppercase constraint', function () {
    // GIVEN an error message referencing the environment_uppercase constraint
    const rawError = new Error(
      'violates check constraint "environment_uppercase"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(
      throwFn,
      DatabaseError,
      DatabaseErrorMessage.StringCaseEnvironment,
    )
  })

  it('Throws a DatabaseError with UniqueConstraintPayId message for account_pay_id_key constraint', function () {
    // GIVEN an error message referencing the account_pay_id_key unique constraint
    const rawError = new Error(
      'duplicate key value violates unique constraint "account_pay_id_key"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(
      throwFn,
      DatabaseError,
      DatabaseErrorMessage.UniqueConstraintPayId,
    )
  })

  it('Throws a DatabaseError with UniqueConstraintAddress message for one_address_per_account constraint', function () {
    // GIVEN an error message referencing the one_address_per_account_payment_network_environment_tuple constraint
    const rawError = new Error(
      'duplicate key value violates unique constraint "one_address_per_account_payment_network_environment_tuple"',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(
      throwFn,
      DatabaseError,
      DatabaseErrorMessage.UniqueConstraintAddress,
    )
  })

  it('Throws a DatabaseError with NotNull message for not-null constraint violations', function () {
    // GIVEN an error message referencing a not-null constraint violation
    const rawError = new Error(
      'null value in column "payment_network" violates not-null constraint',
    )

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the appropriate message
    assert.throws(throwFn, DatabaseError, DatabaseErrorMessage.NotNull)
  })

  it('Throws a DatabaseError with Unknown message for unrecognized errors', function () {
    // GIVEN an error message that does not match any known constraint
    const rawError = new Error('some completely unknown database error')

    // WHEN we handle the database error
    const throwFn = (): never => handleDatabaseError(rawError)

    // THEN we get a DatabaseError with the Unknown message
    assert.throws(throwFn, DatabaseError, DatabaseErrorMessage.Unknown)
  })
})
