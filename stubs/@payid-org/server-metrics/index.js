'use strict'

class Metrics {
  constructor() {}
  initialize() {}
  recordPayIdLookupResult() {}
  recordPayIdLookupBadAcceptHeader() {}
  startMetricsPush() {}
  stopMetricsPush() {}
  getMetrics() {
    return ''
  }
}

function checkMetricsConfiguration() {}

module.exports = { Metrics, checkMetricsConfiguration }
