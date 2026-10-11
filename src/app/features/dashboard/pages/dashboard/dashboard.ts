import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FinancialCalendar } from '@app/features/dashboard/components/financial-calendar/financial-calendar';
import { FinancialSummary } from '@app/features/dashboard/components/financial-summary/financial-summary';
import { PeriodComparison } from '@app/features/dashboard/components/period-comparison/period-comparison';
import { StorageUsage } from '@app/features/dashboard/components/storage-usage/storage-usage';
import { DashboardPeriodService } from '@app/features/dashboard/services/dashboard-period.service';
import { PeriodComparisonService } from '@app/features/dashboard/services/period-comparison.service';

@Component({
  selector: 'app-dashboard',
  imports: [FinancialSummary, FinancialCalendar, PeriodComparison, StorageUsage],
  providers: [DashboardPeriodService, PeriodComparisonService],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {}
