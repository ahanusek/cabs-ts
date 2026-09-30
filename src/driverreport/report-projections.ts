export function driverProjection(alias: string): string {
  return `jsonb_build_object(
    'id', ${alias}.id, 'firstName', ${alias}.first_name,
    'lastName', ${alias}.last_name, 'driverLicense', ${alias}.driver_license,
    'photo', ${alias}.photo, 'status', ${alias}.status, 'type', ${alias}.type)`;
}

export function addressProjection(alias: string): string {
  return `jsonb_build_object(
    'country', ${alias}.country, 'district', ${alias}.district,
    'city', ${alias}.city, 'street', ${alias}.street,
    'buildingNumber', ${alias}.building_number,
    'additionalNumber', ${alias}.additional_number,
    'postalCode', ${alias}.postal_code, 'name', ${alias}.name)`;
}

export const transitProjection = `jsonb_build_object(
  'id', t.id, 'tariff', t.tariff_name, 'status', t.status,
  'factor', t.factor, 'distance', t.km,
  'kmRate', t.tariff_km_rate, 'baseFee', t.tariff_base_fee,
  'date', coalesce(t.date_time, 0), 'dateTime', coalesce(t.date_time, 0),
  'published', coalesce(t.published, 0), 'acceptedAt', t.accepted_at,
  'started', t.started, 'completeAt', t.complete_at,
  'from', ${addressProjection('af')}, 'to', ${addressProjection('ato')},
  'carClass', t.car_type,
  'clientDto', jsonb_build_object(
    'id', c.id, 'type', c.type, 'name', c.name, 'lastName', c.last_name,
    'defaultPaymentType', c.default_payment_type, 'clientType', c.client_type),
  'proposedDrivers', coalesce((select jsonb_agg(${driverProjection('pd')} order by pd.id)
    from transit_proposed_drivers p join driver pd on pd.id = p.driver_id
    where p.transit_id = t.id), '[]'::jsonb)
) || jsonb_strip_nulls(jsonb_build_object(
  'price', t.price, 'driverFee', t.drivers_fee, 'estimatedPrice', t.estimated_price
)) || case when cl.id is null then '{}'::jsonb else jsonb_build_object(
  'claimDto', jsonb_build_object(
    'claimID', cl.id, 'clientId', cl.owner_id, 'transitId', cl.transit_id,
    'reason', cl.reason, 'incidentDescription', cl.incident_description,
    '_isDraft', cl.status = 'draft', 'creationDate', cl.creation_date,
    'completionDate', cl.completion_date, 'changeDate', cl.change_date,
    'completionMode', cl.completion_mode, 'status', cl.status, 'claimNo', cl.claim_no
  )) end`;
