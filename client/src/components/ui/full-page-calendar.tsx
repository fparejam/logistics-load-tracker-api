/**
 * ===============================================================================
 * USAGE EXAMPLE
 * ===============================================================================
 *
 * This full-page calendar component provides a traditional calendar view for displaying
 * features, events, or deadlines. Features appear on their end dates as calendar items.
 * Below is a complete example showing how to use all the main features:
 *
 * STEP 1: Define your data structures
 *
 * const statuses: Status[] = [
 *   { id: "todo", name: "To Do", color: "#6b7280" },
 *   { id: "in-progress", name: "In Progress", color: "#3b82f6" },
 *   { id: "review", name: "In Review", color: "#f59e0b" },
 *   { id: "done", name: "Done", color: "#10b981" },
 *   { id: "blocked", name: "Blocked", color: "#ef4444" },
 * ];
 *
 * const initialFeatures: Feature[] = [
 *   {
 *     id: "1",
 *     name: "Project Planning Complete",
 *     startAt: new Date(2024, 1, 1),
 *     endAt: new Date(2024, 1, 5), // Feature appears on Feb 5, 2024
 *     status: statuses[3], // Done
 *   },
 *   {
 *     id: "2",
 *     name: "UI/UX Design Phase Done",
 *     startAt: new Date(2024, 2, 1),
 *     endAt: new Date(2024, 2, 15), // Feature appears on Mar 15, 2024
 *     status: statuses[3], // Done
 *   },
 *   // ... more features
 * ];
 *
 * STEP 2: Set up state and handlers
 *
 * const [features, setFeatures] = useState<Feature[]>(initialFeatures);
 * const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
 *
 * const handleSelectFeature = (id: string) => {
 *   setSelectedFeature(prev => prev === id ? null : id);
 * };
 *
 * STEP 3: Component hierarchy structure
 *
 * CalendarProvider (locale="en-US" startDay={0})
 *   ├── CalendarDate
 *   │   ├── CalendarDatePicker
 *   │   │   ├── CalendarMonthPicker
 *   │   │   └── CalendarYearPicker (start={2020} end={2030})
 *   │   └── CalendarDatePagination
 *   ├── CalendarHeader
 *   └── CalendarBody (features={features})
 *       └── Custom render function for each feature
 *
 * COMPONENT STRUCTURE:
 *
 * 1. **CalendarProvider**: Root wrapper that provides locale and startDay context
 *    - locale: Intl.LocalesArgument (default: "en-US")
 *    - startDay: number (0 = Sunday, 1 = Monday, etc.)
 *
 * 2. **CalendarDate**: Header container for navigation elements
 *
 * 3. **CalendarDatePicker**: Container for month/year selection
 *    - CalendarMonthPicker: Dropdown to select month
 *    - CalendarYearPicker: Dropdown to select year (requires start/end range)
 *
 * 4. **CalendarDatePagination**: Previous/next month navigation buttons
 *
 * 5. **CalendarHeader**: Displays weekday names (respects locale and startDay)
 *
 * 6. **CalendarBody**: Main calendar grid that displays features
 *    - Accepts features array and children render function
 *    - Features appear on their endAt date
 *    - Shows up to 3 features per day, with "+X more" indicator
 *
 * 7. **CalendarItem**: Default feature display component
 *    - Shows colored dot based on feature.status.color
 *    - Displays truncated feature name
 *
 * KEY CONCEPTS:
 *
 * 1. **Feature Positioning**: Features appear on their `endAt` date in the calendar
 *
 * 2. **Data Structure**:
 *    - Feature: { id, name, startAt, endAt, status }
 *    - Status: { id, name, color }
 *
 * 3. **State Management**: Uses Jotai atoms internally for month/year state
 *    - useCalendarMonth(): [month, setMonth] - 0-11 range
 *    - useCalendarYear(): [year, setYear] - full year number
 *
 * 4. **Internationalization**:
 *    - Supports any Intl.LocalesArgument for locale
 *    - Automatically formats month names and weekday names
 *    - Respects locale-specific date formatting
 *
 * 5. **Week Start Day**:
 *    - startDay prop controls which day starts the week
 *    - 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
 *
 * 6. **Feature Overflow**:
 *    - Shows maximum 3 features per day
 *    - Additional features shown as "+X more" text
 *    - No built-in modal/popover for overflow (implement as needed)
 *
 * 7. **Interactive Elements**:
 *    - Month/year dropdowns with search functionality
 *    - Previous/next month navigation
 *    - Clickable feature items (customize via children render function)
 *    - Hover states and selection highlighting
 *
 * 8. **Responsive Design**:
 *    - Uses CSS Grid for calendar layout
 *    - Flexible height based on container
 *    - Handles month boundaries with out-of-bounds day display
 *
 * ADVANCED USAGE PATTERNS:
 *
 * 1. Custom Feature Rendering:
 *    - Use CalendarBody's children render function to customize feature display
 *    - Add tooltips, badges, or custom styling to features
 *    - Handle click events for feature selection/interaction
 *
 * 2. Internationalization:
 *    - Set locale prop on CalendarProvider (e.g., "fr-FR", "es-ES")
 *    - Adjust startDay for different week start preferences
 *    - Month names and weekday names automatically localized
 *
 * 3. External State Control:
 *    - Use useCalendarMonth() and useCalendarYear() hooks
 *    - Access current month (0-11) and year values
 *    - Programmatically control calendar navigation
 *
 * 4. Feature Filtering:
 *    - Filter features array before passing to CalendarBody
 *    - Implement search, status filtering, or date range filtering
 *    - Show/hide features based on user preferences
 *
 * The component is optimized for performance with memoization of expensive date calculations
 * and supports full customization of feature rendering and interaction handlers.
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getDay, getDaysInMonth, isSameDay } from "date-fns";
import { atom, useAtom } from "jotai";
import {
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDown,
} from "lucide-react";
import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type CalendarState = {
  month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  year: number;
};

const monthAtom = atom<CalendarState["month"]>(
  new Date().getMonth() as CalendarState["month"],
);
const yearAtom = atom<CalendarState["year"]>(new Date().getFullYear());

export const useCalendarMonth = () => useAtom(monthAtom);
export const useCalendarYear = () => useAtom(yearAtom);

type CalendarContextProps = {
  locale: Intl.LocalesArgument;
  startDay: number;
};

const CalendarContext = createContext<CalendarContextProps>({
  locale: "en-US",
  startDay: 0,
});

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

type ComboboxProps = {
  value: string;
  setValue: (value: string) => void;
  data: {
    value: string;
    label: string;
  }[];
  labels: {
    button: string;
    empty: string;
    search: string;
  };
  className?: string;
};

export const monthsForLocale = (
  localeName: Intl.LocalesArgument,
  monthFormat: Intl.DateTimeFormatOptions["month"] = "long",
) => {
  const format = new Intl.DateTimeFormat(localeName, { month: monthFormat })
    .format;

  return [...new Array(12).keys()].map((m) =>
    format(new Date(Date.UTC(2021, m, 2))),
  );
};

export const daysForLocale = (
  locale: Intl.LocalesArgument,
  startDay: number,
) => {
  const weekdays: string[] = [];
  const baseDate = new Date(2024, 0, startDay);

  for (let i = 0; i < 7; i++) {
    weekdays.push(
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(baseDate),
    );
    baseDate.setDate(baseDate.getDate() + 1);
  }

  return weekdays;
};

const Combobox = ({
  value,
  setValue,
  data,
  labels,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-40 justify-between capitalize", className)}
          variant="outline"
        >
          {value
            ? data.find((item) => item.value === value)?.label
            : labels.button}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0">
        <Command
          filter={(value, search) => {
            const label = data.find((item) => item.value === value)?.label;

            return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  className="capitalize"
                  key={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  value={item.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type OutOfBoundsDayProps = {
  day: number;
};

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
  <div className="relative h-full w-full bg-secondary p-1 text-muted-foreground text-xs">
    {day}
  </div>
);

export type CalendarBodyProps = {
  features: Feature[];
  children: (props: { feature: Feature }) => ReactNode;
};

export const CalendarBody = ({ features, children }: CalendarBodyProps) => {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();
  const { startDay } = useContext(CalendarContext);

  // Memoize expensive date calculations
  const currentMonthDate = useMemo(
    () => new Date(year, month, 1),
    [year, month],
  );
  const daysInMonth = useMemo(
    () => getDaysInMonth(currentMonthDate),
    [currentMonthDate],
  );
  const firstDay = useMemo(
    () => (getDay(currentMonthDate) - startDay + 7) % 7,
    [currentMonthDate, startDay],
  );

  // Memoize previous month calculations
  const prevMonthData = useMemo(() => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1));
    const prevMonthDaysArray = Array.from(
      { length: prevMonthDays },
      (_, i) => i + 1,
    );
    return { prevMonthDays, prevMonthDaysArray };
  }, [month, year]);

  // Memoize next month calculations
  const nextMonthData = useMemo(() => {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1));
    const nextMonthDaysArray = Array.from(
      { length: nextMonthDays },
      (_, i) => i + 1,
    );
    return { nextMonthDaysArray };
  }, [month, year]);

  // Memoize features filtering by day to avoid recalculating on every render
  const featuresByDay = useMemo(() => {
    const result: { [day: number]: Feature[] } = {};
    for (let day = 1; day <= daysInMonth; day++) {
      result[day] = features.filter((feature) => {
        return isSameDay(new Date(feature.endAt), new Date(year, month, day));
      });
    }
    return result;
  }, [features, daysInMonth, year, month]);

  const days: ReactNode[] = [];

  for (let i = 0; i < firstDay; i++) {
    const day =
      prevMonthData.prevMonthDaysArray[
        prevMonthData.prevMonthDays - firstDay + i
      ];

    if (day) {
      days.push(<OutOfBoundsDay day={day} key={`prev-${i}`} />);
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const featuresForDay = featuresByDay[day] || [];

    days.push(
      <div
        className="relative flex h-full w-full flex-col gap-1 p-1 text-muted-foreground text-xs"
        key={day}
      >
        {day}
        <div>
          {featuresForDay.slice(0, 3).map((feature) => children({ feature }))}
        </div>
        {featuresForDay.length > 3 && (
          <span className="block text-muted-foreground text-xs">
            +{featuresForDay.length - 3} more
          </span>
        )}
      </div>,
    );
  }

  const remainingDays = 7 - ((firstDay + daysInMonth) % 7);
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      const day = nextMonthData.nextMonthDaysArray[i];

      if (day) {
        days.push(<OutOfBoundsDay day={day} key={`next-${i}`} />);
      }
    }
  }

  return (
    <div className="grid flex-grow grid-cols-7">
      {days.map((day, index) => (
        <div
          className={cn(
            "relative aspect-square overflow-hidden border-t border-r",
            index % 7 === 6 && "border-r-0",
          )}
          key={index}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarDatePickerProps = {
  className?: string;
  children: ReactNode;
};

export const CalendarDatePicker = ({
  className,
  children,
}: CalendarDatePickerProps) => (
  <div className={cn("flex items-center gap-1", className)}>{children}</div>
);

export type CalendarMonthPickerProps = {
  className?: string;
};

export const CalendarMonthPicker = ({
  className,
}: CalendarMonthPickerProps) => {
  const [month, setMonth] = useCalendarMonth();
  const { locale } = useContext(CalendarContext);

  // Memoize month data to avoid recalculating date formatting
  const monthData = useMemo(() => {
    return monthsForLocale(locale).map((month, index) => ({
      value: index.toString(),
      label: month,
    }));
  }, [locale]);

  return (
    <Combobox
      className={className}
      data={monthData}
      labels={{
        button: "Select month",
        empty: "No month found",
        search: "Search month",
      }}
      setValue={(value) =>
        setMonth(Number.parseInt(value) as CalendarState["month"])
      }
      value={month.toString()}
    />
  );
};

export type CalendarYearPickerProps = {
  className?: string;
  start: number;
  end: number;
};

export const CalendarYearPicker = ({
  className,
  start,
  end,
}: CalendarYearPickerProps) => {
  const [year, setYear] = useCalendarYear();

  return (
    <Combobox
      className={className}
      data={Array.from({ length: end - start + 1 }, (_, i) => ({
        value: (start + i).toString(),
        label: (start + i).toString(),
      }))}
      labels={{
        button: "Select year",
        empty: "No year found",
        search: "Search year",
      }}
      setValue={(value) => setYear(Number.parseInt(value))}
      value={year.toString()}
    />
  );
};

export type CalendarDatePaginationProps = {
  className?: string;
};

export const CalendarDatePagination = ({
  className,
}: CalendarDatePaginationProps) => {
  const [month, setMonth] = useCalendarMonth();
  const [year, setYear] = useCalendarYear();

  const handlePreviousMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth((month - 1) as CalendarState["month"]);
    }
  }, [month, year, setMonth, setYear]);

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth((month + 1) as CalendarState["month"]);
    }
  }, [month, year, setMonth, setYear]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button onClick={handlePreviousMonth} size="icon" variant="ghost">
        <ChevronLeftIcon size={16} />
      </Button>
      <Button onClick={handleNextMonth} size="icon" variant="ghost">
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  );
};

export type CalendarDateProps = {
  children: ReactNode;
};

export const CalendarDate = ({ children }: CalendarDateProps) => (
  <div className="flex items-center justify-between p-3">{children}</div>
);

export type CalendarHeaderProps = {
  className?: string;
};

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
  const { locale, startDay } = useContext(CalendarContext);

  // Memoize days data to avoid recalculating date formatting
  const daysData = useMemo(() => {
    return daysForLocale(locale, startDay);
  }, [locale, startDay]);

  return (
    <div className={cn("grid flex-grow grid-cols-7", className)}>
      {daysData.map((day) => (
        <div className="p-3 text-right text-muted-foreground text-xs" key={day}>
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarItemProps = {
  feature: Feature;
  className?: string;
};

export const CalendarItem = memo(
  ({ feature, className }: CalendarItemProps) => (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: feature.status.color,
        }}
      />
      <span className="truncate">{feature.name}</span>
    </div>
  ),
);

CalendarItem.displayName = "CalendarItem";

export type CalendarProviderProps = {
  locale?: Intl.LocalesArgument;
  startDay?: number;
  children: ReactNode;
  className?: string;
};

export const CalendarProvider = ({
  locale = "en-US",
  startDay = 0,
  children,
  className,
}: CalendarProviderProps) => (
  <CalendarContext.Provider value={{ locale, startDay }}>
    <div className={cn("relative flex flex-col", className)}>{children}</div>
  </CalendarContext.Provider>
);
