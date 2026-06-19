import React, { useMemo } from 'react'

export function QRCode({
  text,
  size = 120,
  className,
}: {
  text: string
  size?: number
  className?: string
}) {
  const { sizeMod, paths } = useMemo(() => {
    const textBytes = new TextEncoder().encode(text)
    const v5 = textBytes.length > 78
    if (textBytes.length > 108) throw new Error('Text too long for this QR generator')
    const sizeMod = v5 ? 37 : 33
    const dataCap = v5 ? 108 : 80
    const ecCap = v5 ? 26 : 20

    const bytes: number[] = []
    let bitBuf = 0,
      bitLen = 0
    const addBits = (val: number, len: number) => {
      bitBuf = (bitBuf << len) | val
      bitLen += len
      while (bitLen >= 8) {
        bytes.push((bitBuf >> (bitLen - 8)) & 255)
        bitLen -= 8
      }
    }

    addBits(4, 4)
    addBits(textBytes.length, 8)
    for (const b of textBytes) addBits(b, 8)
    addBits(0, 4)
    if (bitLen > 0) addBits(0, 8 - bitLen)
    const pads = [236, 17]
    let padIdx = 0
    while (bytes.length < dataCap) {
      bytes.push(pads[padIdx])
      padIdx = (padIdx + 1) % 2
    }

    const exp = new Uint8Array(512)
    const log = new Uint8Array(256)
    let x = 1
    for (let i = 0; i < 255; i++) {
      exp[i] = x
      exp[i + 255] = x
      log[x] = i
      x <<= 1
      if (x & 256) x ^= 0x11d
    }
    const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]])

    let poly = new Uint8Array(ecCap + 1)
    poly[0] = 1
    for (let i = 0; i < ecCap; i++) {
      let nextPoly = new Uint8Array(ecCap + 1)
      for (let j = 0; j <= i + 1; j++) {
        nextPoly[j] = (j > 0 ? poly[j - 1] : 0) ^ mul(poly[j], exp[i])
      }
      poly = nextPoly
    }

    const ec = new Uint8Array(ecCap)
    for (let i = 0; i < dataCap; i++) {
      const factor = bytes[i] ^ ec[0]
      for (let j = 0; j < ecCap - 1; j++) {
        ec[j] = ec[j + 1] ^ mul(factor, poly[j + 1])
      }
      ec[ecCap - 1] = mul(factor, poly[ecCap])
    }
    const message = [...bytes, ...ec]

    const matrix = Array.from({ length: sizeMod }, () => new Array(sizeMod).fill(null))
    const setM = (r: number, c: number, v: boolean) => {
      if (r >= 0 && r < sizeMod && c >= 0 && c < sizeMod) matrix[r][c] = v
    }
    const getM = (r: number, c: number) => matrix[r][c]

    const drawFinder = (r: number, c: number) => {
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          if (r + i < 0 || r + i >= sizeMod || c + j < 0 || c + j >= sizeMod) continue
          if (i === -1 || i === 7 || j === -1 || j === 7) setM(r + i, c + j, false)
          else
            setM(
              r + i,
              c + j,
              i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4),
            )
        }
      }
    }
    drawFinder(0, 0)
    drawFinder(0, sizeMod - 7)
    drawFinder(sizeMod - 7, 0)

    const alignPos = v5 ? 30 : 26
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        setM(
          alignPos + i,
          alignPos + j,
          i === -2 || i === 2 || j === -2 || j === 2 || (i === 0 && j === 0),
        )
      }
    }

    for (let i = 8; i < sizeMod - 8; i++) {
      if (getM(6, i) === null) setM(6, i, i % 2 === 0)
      if (getM(i, 6) === null) setM(i, 6, i % 2 === 0)
    }

    for (let i = 0; i < 9; i++) {
      if (getM(8, i) === null) setM(8, i, false)
      if (getM(i, 8) === null) setM(i, 8, false)
    }
    for (let i = sizeMod - 8; i < sizeMod; i++) {
      if (getM(8, i) === null) setM(8, i, false)
      if (getM(i, 8) === null) setM(i, 8, false)
    }
    setM(sizeMod - 8, 8, true)

    let bitIdx = 0
    let dir = -1,
      r = sizeMod - 1,
      c = sizeMod - 1
    while (c > 0) {
      if (c === 6) c--
      while (r >= 0 && r < sizeMod) {
        for (let i = 0; i < 2; i++) {
          if (getM(r, c - i) === null) {
            let bit = false
            if (bitIdx < message.length * 8) {
              bit = ((message[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) === 1
              bitIdx++
            }
            if ((r + c - i) % 2 === 0) bit = !bit
            setM(r, c - i, bit)
          }
        }
        r += dir
      }
      dir = -dir
      r += dir
      c -= 2
    }

    const formatData = 8
    let rem = formatData << 10
    for (let i = 14; i >= 10; i--) {
      if ((rem >> i) & 1) rem ^= 0x537 << (i - 10)
    }
    const formatInfo = ((formatData << 10) | rem) ^ 0x5412

    for (let i = 0; i < 15; i++) {
      const bit = ((formatInfo >> i) & 1) === 1
      if (i < 6) setM(8, i, bit)
      else if (i === 6) setM(8, 7, bit)
      else if (i === 7) setM(8, 8, bit)
      else if (i === 8) setM(7, 8, bit)
      else setM(14 - i, 8, bit)

      if (i < 7) setM(sizeMod - 1 - i, 8, bit)
      else setM(8, sizeMod - 15 + i, bit)
    }

    const paths = []
    for (let row = 0; row < sizeMod; row++) {
      for (let col = 0; col < sizeMod; col++) {
        if (matrix[row][col]) paths.push(`M${col},${row}h1v1h-1z`)
      }
    }
    return { sizeMod, paths }
  }, [text])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`-2 -2 ${sizeMod + 4} ${sizeMod + 4}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width={sizeMod + 4} height={sizeMod + 4} fill="#ffffff" />
      <path d={paths.join('')} fill="#000000" />
    </svg>
  )
}
