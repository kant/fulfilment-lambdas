// @flow
import csv from 'fast-csv'
import moment from 'moment'
import type { S3Folder } from './../lib/storage'
import { getCanadianState, getUSState } from './../lib/states'

// input headers
const ADDRESS_1 = 'SoldToContact.Address1'
const ADDRESS_2 = 'SoldToContact.Address2'
const CITY = 'SoldToContact.City'
const COUNTRY = 'SoldToContact.Country'
const TITLE = 'SoldToContact.Title__c'
const FIRST_NAME = 'SoldToContact.FirstName'
const LAST_NAME = 'SoldToContact.LastName'
const POSTAL_CODE = 'SoldToContact.PostalCode'
const SUBSCRIPTION_NAME = 'Subscription.Name'
const QUANTITY = 'RatePlanCharge.Quantity'
const COMPANY_NAME = 'SoldToContact.Company_Name__c'
const SHOULD_HAND_DELIVER = 'Subscription.CanadaHandDelivery__c'
// output headers

const CUSTOMER_REFERENCE = 'Subscriber ID'
const CUSTOMER_FULL_NAME = 'Name'
const CUSTOMER_COMPANY_NAME = 'Company name'
const CUSTOMER_ADDRESS_LINE_1 = 'Address 1'
const CUSTOMER_ADDRESS_LINE_2 = 'Address 2'
const CUSTOMER_ADDRESS_LINE_3 = 'Address 3'
const CUSTOMER_COUNTRY = 'Country'
const CUSTOMER_POSTCODE = 'Post code'
const DELIVERY_QUANTITY = 'Copies'

const outputHeaders = [
  CUSTOMER_REFERENCE,
  CUSTOMER_FULL_NAME,
  CUSTOMER_COMPANY_NAME,
  CUSTOMER_ADDRESS_LINE_1,
  CUSTOMER_ADDRESS_LINE_2,
  CUSTOMER_ADDRESS_LINE_3,
  CUSTOMER_COUNTRY,
  CUSTOMER_POSTCODE,
  DELIVERY_QUANTITY
]

export class WeeklyExporter {
  country: string
  sentDate: string
  formattedDeliveryDate: string
  chargeDay: string
  writeCSVStream: any
  folder: S3Folder

  constructor (country: string, deliveryDate: moment, folder: S3Folder) {
    this.country = country
    this.writeCSVStream = csv.createWriteStream({
      headers: outputHeaders,
      quoteColumns: true
    })

    this.sentDate = moment().format('DD/MM/YYYY')
    this.chargeDay = deliveryDate.format('dddd')
    this.formattedDeliveryDate = deliveryDate.format('DD/MM/YYYY')
    this.folder = folder
  }

  useForRow (row: { [string]: string }): boolean {
    return !!(row[COUNTRY] && row[COUNTRY] === this.country)
  }

  formatAddress (name: string) {
    return name
  }

  formatState (state: string) {
    return state
  }

  processRow (row: { [string]: string }) {
    let outputCsvRow = {}
    outputCsvRow[CUSTOMER_REFERENCE] = row[SUBSCRIPTION_NAME]
    outputCsvRow[CUSTOMER_FULL_NAME] = this.formatAddress([row[TITLE], row[FIRST_NAME], row[LAST_NAME]].join(' ').trim())
    outputCsvRow[CUSTOMER_COMPANY_NAME] = this.formatAddress(row[COMPANY_NAME])
    outputCsvRow[CUSTOMER_ADDRESS_LINE_1] = this.formatAddress(row[ADDRESS_1])
    outputCsvRow[CUSTOMER_ADDRESS_LINE_2] = this.formatAddress(row[ADDRESS_2])
    outputCsvRow[CUSTOMER_ADDRESS_LINE_3] = this.formatAddress(this.formatState(row[CITY]))
    outputCsvRow[CUSTOMER_POSTCODE] = this.formatAddress(row[POSTAL_CODE])
    outputCsvRow[DELIVERY_QUANTITY] = row[QUANTITY]
    outputCsvRow[CUSTOMER_COUNTRY] = row[COUNTRY]
    this.writeCSVStream.write(outputCsvRow)
  }

  end () {
    this.writeCSVStream.end()
  }
}

export class AusExporter extends WeeklyExporter {
  formatAddress (s: string) {
    return s.toUpperCase()
  }
}

export class CaExporter extends WeeklyExporter {
  checkHandDelivery (handDeliveryValue: string): boolean {
    return handDeliveryValue.trim().toUpperCase() !== 'YES'
  }

  useForRow (row: { [string]: string }): boolean {
    return super.useForRow(row) && this.checkHandDelivery(row[SHOULD_HAND_DELIVER])
  }

  formatState (s: string) {
    return getCanadianState(s)
  }
}

export class USExporter extends WeeklyExporter {
  formatState (s: string) {
    return getUSState(s)
  }
}

export class CaHandDeliveryExporter extends CaExporter {
  checkHandDelivery (handDeliveryValue: string): boolean {
    return handDeliveryValue.trim().toUpperCase() === 'YES'
  }
}
