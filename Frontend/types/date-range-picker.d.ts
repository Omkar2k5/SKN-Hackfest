import { DateRange } from 'react-day-picker'

export interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  className?: string
}

export declare function DateRangePicker(props: DateRangePickerProps): JSX.Element 