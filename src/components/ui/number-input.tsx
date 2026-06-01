import React, { useState, useEffect, forwardRef } from 'react'
import { Input, InputProps } from '@/components/ui/input'
import { formatNumberPtBR, parseNumberPtBR } from '@/lib/format'

export interface NumberInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: number | string | null
  onChange?: (value: number | '') => void
  decimalScale?: number
  minDecimals?: number
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, decimalScale = 4, minDecimals = 0, onBlur, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

    useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setDisplayValue('')
      } else {
        const num = typeof value === 'string' ? parseFloat(value) : value
        const parsedDisplay = parseNumberPtBR(displayValue)
        if (parsedDisplay !== num) {
          setDisplayValue(formatNumberPtBR(num, decimalScale, minDecimals))
        }
      }
    }, [value, decimalScale, minDecimals])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value
      val = val.replace(/[^\d.,-]/g, '')
      setDisplayValue(val)

      const parsed = parseNumberPtBR(val)
      onChange?.(parsed)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === '.') {
        e.preventDefault()
        const target = e.target as HTMLInputElement
        const start = target.selectionStart || 0
        const end = target.selectionEnd || 0
        const val = target.value
        const newVal = val.slice(0, start) + ',' + val.slice(end)
        setDisplayValue(newVal)
        onChange?.(parseNumberPtBR(newVal))

        setTimeout(() => {
          target.setSelectionRange(start + 1, start + 1)
        }, 0)
      }
      props.onKeyDown?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseNumberPtBR(displayValue)
      if (parsed !== '') {
        setDisplayValue(formatNumberPtBR(parsed, decimalScale, minDecimals))
      }
      onBlur?.(e)
    }

    return (
      <Input
        type="text"
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        {...props}
      />
    )
  },
)
NumberInput.displayName = 'NumberInput'
