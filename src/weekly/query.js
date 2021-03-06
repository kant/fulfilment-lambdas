// @flow
import { fetchConfig } from './../lib/config'
import type {Config} from './../lib/config'
import {Zuora} from './../lib/Zuora'
import type {Query} from './../lib/Zuora'
import moment from 'moment'

type input = {
  deliveryDate: ?string,
  deliveryDateDaysFromNow: ?number
}
async function queryZuora (deliveryDate, config: Config) {
  const formattedDate = deliveryDate.format('YYYY-MM-DD')
  const zuora = new Zuora(config)
  const subsQuery: Query =
    {
      'name': 'WeeklySubscriptions',
      'query': `
      SELECT
      RateplanCharge.quantity,
      Subscription.Name,
      SoldToContact.Address1,
      SoldToContact.Address2,
      SoldToContact.City,
      SoldToContact.Company_Name__c,
      SoldToContact.Country,
      SoldToContact.Title__c,
      SoldToContact.FirstName,
      SoldToContact.LastName,
      SoldToContact.PostalCode,
      SoldToContact.State,
      Subscription.CanadaHandDelivery__c,
      Subscription.AutoRenew,
      Subscription.Status,
      ProductRatePlanCharge.ProductType__c,
      Product.Name,
      RatePlanCharge.EffectiveStartDate,
      RatePlanCharge.EffectiveEndDate,
      RatePlan.AmendmentType,
      Subscription.TermEndDate
        FROM
          rateplancharge
        WHERE (Subscription.Status = 'Active' OR Subscription.Status = 'Cancelled') AND
        ProductRatePlanCharge.ProductType__c = 'Guardian Weekly' AND
        RatePlanCharge.EffectiveStartDate <= '${formattedDate}' AND
        (
         (Subscription.AutoRenew = true AND (
          (Subscription.Status = 'Active' AND RatePlanCharge.EffectiveEndDate >= '${formattedDate}') 
          OR (Subscription.Status = 'Cancelled' AND RatePlanCharge.EffectiveEndDate > '${formattedDate}')
         )) 
         OR
         (Subscription.AutoRenew = false AND Subscription.TermEndDate > '${formattedDate}')
        )   AND  (RatePlan.AmendmentType IS NULL OR RatePlan.AmendmentType != 'RemoveProduct' OR RatePlanCharge.EffectiveEndDate > '${formattedDate}' )
    `}

  const holidaySuspensionQuery: Query =
    {
      'name': 'WeeklyHolidaySuspensions',
      'query': `
      SELECT
        Subscription.Name
      FROM
        rateplancharge
      WHERE
       (Subscription.Status = 'Active' OR Subscription.Status = 'Cancelled') AND
       ProductRatePlanCharge.ProductType__c = 'Adjustment' AND
       RateplanCharge.Name = 'Holiday Credit' AND
       RatePlanCharge.EffectiveStartDate <= '${formattedDate}' AND
       RatePlanCharge.HolidayEnd__c >= '${formattedDate}' AND
       RatePlan.AmendmentType != 'RemoveProduct'`
    }
  let jobId = await zuora.query('Fulfilment-Queries', subsQuery, holidaySuspensionQuery)
  return {deliveryDate: formattedDate, jobId: jobId}
}

function getDeliveryDate (input: input) {
  if (input.deliveryDate) {
    let deliveryDate = moment(input.deliveryDate, 'YYYY-MM-DD')
    if (!deliveryDate.isValid()) {
      throw new Error('deliveryDate must be in the format "YYYY-MM-DD"')
    } else {
      console.log(deliveryDate)
      console.log('is valid')
    }
    return deliveryDate
  }

  if (input.deliveryDateDaysFromNow || typeof input.deliveryDateDaysFromNow === 'number') {
    let deliveryDateDaysFromNow = input.deliveryDateDaysFromNow
    return moment().add(deliveryDateDaysFromNow, 'days')
  }
  throw new Error('deliveryDate or deliveryDateDaysFromNow input param must be provided')
}

export async function weeklyQuery (input: input) {
  let deliveryDate = getDeliveryDate(input)
  let config = await fetchConfig()
  console.log('Config fetched succesfully.')
  return queryZuora(deliveryDate, config)
}
