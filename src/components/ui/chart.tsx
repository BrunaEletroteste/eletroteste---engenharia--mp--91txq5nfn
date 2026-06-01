import * as React from 'react'
import { cn } from '@/lib/utils'

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: Record<string, { label?: string; color?: string }>
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, config, ...props }, ref) => {
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
      <div
        ref={ref}
        className={cn('w-full', className)}
        style={{ ...style, ...props.style }}
        {...props}
      />
    )
  },
)
ChartContainer.displayName = 'ChartContainer'
