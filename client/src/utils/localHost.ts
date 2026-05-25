const localHostnames = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export const isLocalHost = (hostname: string) => localHostnames.has(hostname)
