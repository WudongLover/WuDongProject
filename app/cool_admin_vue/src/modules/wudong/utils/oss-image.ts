const DEFAULT_OSS_BASE_URL = 'https://wudong1.oss-cn-guangzhou.aliyuncs.com';
const OSS_BASE_URL = (import.meta.env.VITE_OSS_BASE_URL || DEFAULT_OSS_BASE_URL).replace(/\/+$/, '');
const OSS_PREFIX = (import.meta.env.VITE_OSS_PREFIX || 'wudong').replace(/^\/+|\/+$/g, '');

/** Returns a public OSS URL for a Wudong static image object. */
export function ossImage(fileName: string) {
	return `${OSS_BASE_URL}/${OSS_PREFIX}/images/${fileName}`;
}
