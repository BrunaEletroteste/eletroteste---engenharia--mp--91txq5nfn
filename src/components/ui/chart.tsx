import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: Record<string, { label?: string; color?: string; icon?: React.ComponentType }>
}

const ChartContext = React.createContext<{ config: ChartContainerProps['config'] } | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, config, children, ...props }, ref) => {
    const style = React.useMemo(() => {
      const cssVars: Record<string, string> = {}
      Object.entries(config).forEach(([key, value]) => {
        if (value.color) {
          cssVars[`--color-${key}`] = value.color
        }
      })
      return cssVars as React.CSSProperties
    }, [config])

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn('w-full', className)}
          style={{ ...style, ...props.style }}
          {...props}
        >
          {children}
        </div>
      </ChartContext.Provider>
    )
  },
)
ChartContainer.displayName = 'ChartContainer'

export const ChartTooltip = RechartsPrimitive.Tooltip

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: 'line' | 'dot' | 'dashed'
    nameKey?: string
    labelKey?: string
    className?: string
    color?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    if (!active || !payload?.length) {
      return null
    }
    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className,
        )}
      >
        {!hideLabel && label && <div className="font-medium text-muted-foreground">{label}</div>}
        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const itemColor = color || item.payload?.fill || item.color
            return (
              <div key={item.dataKey || index} className="flex w-full items-center gap-2">
                {!hideIndicator && (
                  <div
                    className={cn('shrink-0', {
                      'h-2 w-2 rounded-full': indicator === 'dot',
                      'h-2 w-1 rounded-[2px]': indicator === 'line',
                    })}
                    style={{ backgroundColor: itemColor }}
                  />
                )}
                <div className="flex flex-1 justify-between gap-4 leading-none">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-mono font-medium text-foreground">{item.value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = 'ChartTooltipContent'

export const ChartLegend = RechartsPrimitive.Legend

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    payload?: any[]
    verticalAlign?: any
    hideIcon?: boolean
    nameKey?: string
  }
>(({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }, ref) => {
  if (!payload?.length) {
    return null
  }
  return (
    <div ref={ref} className={cn('flex items-center justify-center gap-4', className)}>
      {payload.map((item: any) => (
        <div key={item.value} className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {!hideIcon && (
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  )
})
ChartLegendContent.displayName = 'ChartLegendContent'
