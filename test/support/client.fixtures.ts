import { Client, PaymentType, Type } from '../../src/crm/client.entity';

export function aClient(): Client {
  const client = new Client();
  client.setName('Anna');
  client.setLastName('Nowak');
  client.setType(Type.NORMAL);
  client.setDefaultPaymentType(PaymentType.PRE_PAID);
  return client;
}
