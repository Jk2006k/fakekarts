export const generateRoomCode = () => String(100 + crypto.getRandomValues(new Uint16Array(1))[0] % 900)

export const normalizeRoomCode = (value: string) => value.replace(/\D/g, '').slice(0, 3)

export const isRoomCode = (value: string) => /^\d{3}$/.test(value)
