import { Injectable, computed, signal } from '@angular/core';

@Injectable()
export class DashboardPeriodService {
  private readonly today = new Date();
  private readonly currentYear = this.today.getFullYear();
  private readonly currentMonth = this.today.getMonth() + 1;

  readonly selectedYear = signal(this.currentYear);
  readonly selectedMonth = signal(this.currentMonth);

  readonly canNextYear = computed(() => this.selectedYear() < this.currentYear);
  readonly canNextMonth = computed(
    () => this.currentYear > this.selectedYear() || this.currentMonth > this.selectedMonth(),
  );

  readonly isCurrentPeriod = computed(
    () => this.selectedYear() === this.currentYear && this.selectedMonth() === this.currentMonth,
  );

  goToday(): void {
    this.selectedYear.set(this.currentYear);
    this.selectedMonth.set(this.currentMonth);
  }

  prevMonth(): void {
    if (this.selectedMonth() > 1) {
      this.selectedMonth.set(this.selectedMonth() - 1);
      return;
    }

    this.selectedYear.set(this.selectedYear() - 1);
    this.selectedMonth.set(12);
  }

  nextMonth(): void {
    if (!this.canNextMonth()) {
      return;
    }

    if (this.selectedMonth() < 12) {
      this.selectedMonth.set(this.selectedMonth() + 1);
      return;
    }

    this.selectedYear.set(this.selectedYear() + 1);
    this.selectedMonth.set(1);
  }

  prevYear(): void {
    this.selectedYear.set(this.selectedYear() - 1);
  }

  nextYear(): void {
    if (!this.canNextYear()) {
      return;
    }

    this.selectedYear.set(this.selectedYear() + 1);

    if (this.selectedYear() === this.currentYear && this.selectedMonth() > this.currentMonth) {
      this.selectedMonth.set(this.currentMonth);
    }
  }

  isInSelectedMonth(date: Date): boolean {
    return (
      date.getFullYear() === this.selectedYear() && date.getMonth() + 1 === this.selectedMonth()
    );
  }
}
