import { Module } from '@nestjs/common';
import { TierListController } from './tier-list.controller';
import { TierListService } from './tier-list.service';

@Module({
  controllers: [TierListController],
  providers: [TierListService],
  exports: [TierListService],
})
export class TierListModule {}
