import * as React from 'react'
import { Input } from '@/components/ui/input'
import { formatNumberPtBR, parseNumberPtBR } from '@/lib/format'

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> {
  value: number | string | undefined | null
  onChange: (value: number | '') => void
  maxDecimals?: number
  minDecimals?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, maxDecimals = 4, minDecimals = 0, name, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState('')

    const isQgbtNoDecimalField = name
      ? [
          'subestacao',
          'numero',
          'corrente_nominal',
          'rele_minima_tensao',
          'rele_abertura',
          'rele_fechamento',
          'motorizacao',
        ].includes(name)
      : false

    const effectiveMax = isQgbtNoDecimalField ? 0 : maxDecimals
    const effectiveMin = isQgbtNoDecimalField ? 0 : minDecimals

    React.useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setLocalValue('')
      } else if (typeof value === 'number') {
        setLocalValue(formatNumberPtBR(value, effectiveMax, effectiveMin))
      } else {
        const parsed = parseNumberPtBR(String(value))
        if (typeof parsed === 'number') {
          setLocalValue(formatNumberPtBR(parsed, effectiveMax, effectiveMin))
        } else {
          setLocalValue(String(value))
        }
      }
    }, [value, effectiveMax, effectiveMin])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/[^0-9.,-]/g, '')
      setLocalValue(val)
      const parsed = parseNumberPtBR(val)
      if (typeof parsed === 'number') {
        onChange(parsed)
      } else {
        onChange('')
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseNumberPtBR(localValue)
      if (typeof parsed === 'number') {
        setLocalValue(formatNumberPtBR(parsed, effectiveMax, effectiveMin))
        onChange(parsed)
      } else {
        setLocalValue('')
        onChange('')
      }
      props.onBlur?.(e)
    }

    return (
      <Input
        type="text"
        className={className}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        name={name}
        ref={ref}
        {...props}
      />
    )
  },
)
NumberInput.displayName = 'NumberInput'

export { NumberInput }
