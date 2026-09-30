import { Module } from '@nestjs/common';
import { DriverNotificationService } from './driver-notification.service';
import { ClientNotificationService } from './client-notification.service';

@Module({
  imports: [],
  providers: [DriverNotificationService, ClientNotificationService],
  controllers: [],
  exports: [DriverNotificationService, ClientNotificationService],
})
export class NotificationModule {}
