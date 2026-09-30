export function driverProjection(alias: string): string {
  return `jsonb_build_object(
    'id', ${alias}.id, 'firstName', ${alias}.first_name,
    'lastName', ${alias}.last_name, 'driverLicense', ${alias}.driver_license,
    'photo', ${alias}.photo, 'status', ${alias}.status, 'type', ${alias}.type)`;
}

export const transitProjection = `t.view || case when cl.id is null then '{}'::jsonb else jsonb_build_object(
  'claimDto', jsonb_build_object(
    'claimID', cl.id, 'clientId', cl.owner_id, 'transitId', cl.transit_id,
    'reason', cl.reason, 'incidentDescription', cl.incident_description,
    '_isDraft', cl.status = 'draft', 'creationDate', cl.creation_date,
    'completionDate', cl.completion_date, 'changeDate', cl.change_date,
    'completionMode', cl.completion_mode, 'status', cl.status, 'claimNo', cl.claim_no
  )) end`;
